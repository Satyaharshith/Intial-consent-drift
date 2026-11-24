import re
import secrets
import hashlib
import time
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, List
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
from fastapi import Request, HTTPException, Depends, status
from sqlalchemy.orm import Session
from app.config import (
    JWT_SECRET, JWT_ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES, REFRESH_TOKEN_EXPIRE_DAYS
)
from app.db import get_db
from app.models import User

# Password Hasher
ph = PasswordHasher(
    time_cost=2,
    memory_cost=19456,
    parallelism=1,
    hash_len=32,
    salt_len=16
)

def validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long."
        )
    if not re.search(r"[A-Za-z]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one letter."
        )
    if not re.search(r"[0-9]", password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number."
        )

def hash_password(password: str) -> str:
    validate_password_strength(password)
    return ph.hash(password)

def verify_password(password: str, password_hash: str) -> bool:
    try:
        return ph.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False

# In-memory Rate Limiter: 5 failed attempts per 15 min per (email, IP)
FAILED_ATTEMPTS: Dict[str, List[float]] = {}
RATE_LIMIT_WINDOW_SECONDS = 15 * 60  # 15 minutes
MAX_FAILED_ATTEMPTS = 5

def check_login_rate_limit(email: str, client_ip: str):
    key = f"{email.lower().strip()}:{client_ip}"
    now = time.time()
    attempts = [t for t in FAILED_ATTEMPTS.get(key, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    FAILED_ATTEMPTS[key] = attempts
    if len(attempts) >= MAX_FAILED_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many failed login attempts. Please try again after 15 minutes."
        )

def record_failed_login(email: str, client_ip: str):
    key = f"{email.lower().strip()}:{client_ip}"
    now = time.time()
    attempts = [t for t in FAILED_ATTEMPTS.get(key, []) if now - t < RATE_LIMIT_WINDOW_SECONDS]
    attempts.append(now)
    FAILED_ATTEMPTS[key] = attempts

def reset_failed_login(email: str, client_ip: str):
    key = f"{email.lower().strip()}:{client_ip}"
    if key in FAILED_ATTEMPTS:
        del FAILED_ATTEMPTS[key]

# Playground Rate Limiter: 20 per minute per IP
PLAYGROUND_ATTEMPTS: Dict[str, List[float]] = {}
PLAYGROUND_WINDOW_SECONDS = 60
MAX_PLAYGROUND_ATTEMPTS = 20

def check_playground_rate_limit(client_ip: str):
    now = time.time()
    attempts = [t for t in PLAYGROUND_ATTEMPTS.get(client_ip, []) if now - t < PLAYGROUND_WINDOW_SECONDS]
    PLAYGROUND_ATTEMPTS[client_ip] = attempts
    if len(attempts) >= MAX_PLAYGROUND_ATTEMPTS:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for playground simulator. Maximum 20 comparisons per minute."
        )
    attempts.append(now)
    PLAYGROUND_ATTEMPTS[client_ip] = attempts

# JWT Token Helpers
def create_access_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {
        "sub": str(user_id),
        "type": "access",
        "exp": expire,
        "iat": now
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: int) -> str:
    now = datetime.now(timezone.utc)
    expire = now + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "type": "refresh",
        "exp": expire,
        "iat": now
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str, expected_type: str = "access") -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != expected_type:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type.")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token has expired.")
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials.")

# Current User Dependency
def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    # Check Cookie first
    token = request.cookies.get("access_token")
    if not token:
        # Check Authorization Header: "Bearer <token>"
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required."
        )

    payload = decode_token(token, expected_type="access")
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token.")

    try:
        user_id = int(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject.")

    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account not found or inactive.")

    return user

# Password reset helpers
def generate_reset_token() -> tuple[str, str]:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash

def hash_token_str(raw_token: str) -> str:
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
