import math
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CategoryNotFoundException, ProductNotFoundException
from app.core.settings import settings
from app.crud import category as category_crud
from app.crud import product as product_crud
from app.services.pricing import compute_unit, resolve_company_pct


async def fetch_categories_for_menu(db: AsyncSession):
    return await category_crud.get_all_categories(db)


async def fetch_products_for_catalog(
    db: AsyncSession,
    category_slug: str | None = None,
    search_query: str | None = None,
    page: int = 1,
    size: int = 24,
    user=None,
):
    if category_slug:
        category = await category_crud.get_category_by_slug(db, category_slug)
        if not category:
            raise CategoryNotFoundException()

    skip = (page - 1) * size
    items, total = await product_crud.get_active_products(
        db, category_slug, search_query, skip, size
    )

    # Compute company discount once and apply to every product in this page.
    # "COMPANY" here means: always precompute the company price so the frontend
    # can decide whether to show it based on client-side purchase mode.
    company_pct = await resolve_company_pct(db, user, "COMPANY")
    cap = settings.MAX_TOTAL_DISCOUNT_PERCENT

    enriched = []
    for product in items:
        row: dict = {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "sku": product.sku,
            "base_price": product.base_price,
            "stock_quantity": product.stock_quantity,
            "main_image_url": product.main_image_url,
            "is_b2b_only": product.is_b2b_only,
            "company_discount_percentage": None,
            "company_unit_price": None,
        }
        if company_pct > Decimal("0"):
            computed = compute_unit(product.base_price, company_pct, Decimal("0"), cap)
            row["company_discount_percentage"] = company_pct
            row["company_unit_price"] = computed["final_unit"]
        enriched.append(row)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
    }


async def fetch_product_details(db: AsyncSession, product_slug: str):
    product = await product_crud.get_product_by_slug(db, product_slug)

    if not product:
        raise ProductNotFoundException()

    return product
