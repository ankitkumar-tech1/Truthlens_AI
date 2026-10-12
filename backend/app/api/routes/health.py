from datetime import datetime, timezone
from fastapi import APIRouter
from app.core.config import settings
from app.schemas.analysis import HealthResponse

router = APIRouter()

@router.get("/health", response_model=HealthResponse)
def get_health():
    is_configured = bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY.strip())
    return HealthResponse(
        status="ok",
        backend="online",
        gemini_configured=is_configured,
        gemini_model=settings.GEMINI_MODEL,
        timestamp=datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    )
