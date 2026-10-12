import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from backend or root .env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
root_env = BASE_DIR.parent / ".env"
backend_env = BASE_DIR / ".env"

if backend_env.exists():
    load_dotenv(dotenv_path=backend_env)
if root_env.exists():
    load_dotenv(dotenv_path=root_env)

class Settings:
    PROJECT_NAME: str = "TruthLens AI Verification Engine"
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-1.5-flash")
    APP_URL: str = os.getenv("APP_URL", "http://localhost:3000")
    PORT: int = int(os.getenv("PORT", "8000"))

settings = Settings()
