from app.models import Category
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_all_categories(db: AsyncSession):
    stmt = select(Category).order_by(Category.name)
    result = await db.scalars(stmt)
    return result.all()
