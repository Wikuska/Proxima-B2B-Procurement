from uuid import UUID

from app.models import Product
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession


async def get_active_products(
    db: AsyncSession, category_id: UUID | None = None, skip: int = 0, limit: int = 24
):
    stmt = select(Product).where(Product.is_active)
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt) or 0

    stmt = stmt.order_by(Product.name).offset(skip).limit(limit)
    result = await db.scalars(stmt)
    items = result.all()

    return items, total
