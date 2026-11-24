import os
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.db import Base, engine, get_db
from app import models  # Ensures models are registered with Base.metadata
from app.config import LLM_API_KEY
from app.schemas import HealthResponse
from app.seed import seed_database

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ConsentDrift API",
    description="Privacy purpose drift analysis prototype",
    version="0.1.0"
)

# CORS setup for localhost:5173 and chrome extensions
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_origin_regex=r"^chrome-extension://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        llm_available=bool(LLM_API_KEY)
    )

@app.post("/api/seed")
def seed_endpoint(db: Session = Depends(get_db)):
    result = seed_database(db=db)
    return result

from app.routers import consents, evidence, analyses, eval_api
app.include_router(consents.router)
app.include_router(evidence.router)
app.include_router(analyses.router)
app.include_router(eval_api.router)
