import math

from app.core.exceptions import CategoryNotFoundException
from app.crud import category as category_crud
from app.crud import product as product_crud
from sqlalchemy.ext.asyncio import AsyncSession


async def fetch_categories_for_menu(db: AsyncSession):
    return await category_crud.get_all_categories(db)


async def fetch_products_for_catalog(
    db: AsyncSession,
    category_slug: str | None = None,
    search_query: str | None = None,
    page: int = 1,
    size: int = 24,
):
    if category_slug:
        category = await category_crud.get_category_by_slug(db, category_slug)
        if not category:
            raise CategoryNotFoundException()

    # Calculate database offset based on page number
    skip = (page - 1) * size
    items, total = await product_crud.get_active_products(
        db, category_slug, search_query, skip, size
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
    }
