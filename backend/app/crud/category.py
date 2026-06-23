from app.models import Category
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_all_categories(db: AsyncSession):
    stmt = select(Category).order_by(Category.name)
    result = await db.scalars(stmt)
    return result.all()


async def get_category_by_slug(db: AsyncSession, slug: str) -> Category | None:
    stmt = select(Category).where(Category.slug == slug)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
