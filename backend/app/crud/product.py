import uuid

from app.models import Category, Product
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def get_active_products(
    db: AsyncSession,
    category_slug: str | None = None,
    search_query: str | None = None,
    skip: int = 0,
    limit: int = 24,
):
    stmt = select(Product).where(Product.is_active)
    if category_slug:
        stmt = stmt.join(Product.category).where(Category.slug == category_slug)

    if search_query:
        search_term = f"%{search_query}%"
        stmt = stmt.where(
            or_(Product.name.ilike(search_term), Product.sku.ilike(search_term))
        )

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt) or 0

    stmt = stmt.order_by(Product.name).offset(skip).limit(limit)
    result = await db.scalars(stmt)
    items = result.all()

    return items, total


async def get_product_by_id(db: AsyncSession, product_id: uuid.UUID) -> Product | None:
    stmt = select(Product).where(Product.id == product_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_products_by_ids(
    db: AsyncSession, ids: list[uuid.UUID]
) -> list[Product]:
    if not ids:
        return []
    stmt = (
        select(Product)
        .where(Product.id.in_(ids))
        .options(selectinload(Product.volume_discounts))
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_product_by_slug(db: AsyncSession, slug: str) -> Product | None:
    stmt = (
        select(Product)
        .where(Product.slug == slug)
        .options(selectinload(Product.volume_discounts))
    )
    result = await db.execute(stmt)

    return result.scalar_one_or_none()
