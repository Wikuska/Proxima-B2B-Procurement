from app.models import Company
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_active_by_domain(db: AsyncSession, domain: str) -> Company | None:
    """Fetches an active company by email domain for Fast Track assignment."""
    result = await db.execute(
        select(Company).where(Company.email_domain == domain, Company.is_active)
    )
    return result.scalar_one_or_none()
