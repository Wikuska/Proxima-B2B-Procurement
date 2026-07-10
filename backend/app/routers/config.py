from app.core.settings import settings
from app.schemas.config import PublicConfigOut
from fastapi import APIRouter

router = APIRouter(prefix="/config", tags=["Config"])


@router.get("/public", response_model=PublicConfigOut)
async def get_public_config() -> PublicConfigOut:
    """Non-sensitive runtime flags for the frontend (single source of truth)."""
    return PublicConfigOut(
        portfolio_mode=settings.PORTFOLIO_MODE,
        portfolio_verification_code=(
            settings.PORTFOLIO_VERIFICATION_CODE
            if settings.PORTFOLIO_MODE
            else None
        ),
    )
