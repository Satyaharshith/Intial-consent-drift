import os

# Disable SQLAlchemy C extensions to ensure pure-Python execution under strict Windows Application Control
os.environ["DISABLE_SQLALCHEMY_CEXT"] = "1"

from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent.parent / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")
LLM_API_KEY = os.getenv("LLM_API_KEY", "").strip()
LLM_MODEL = os.getenv("LLM_MODEL", "gpt-4o-mini").strip()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./consentdrift.db")
