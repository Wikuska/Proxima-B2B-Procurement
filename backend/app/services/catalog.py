import math
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import CategoryNotFoundException, ProductNotFoundException
from app.core.settings import settings
from app.crud import category as category_crud
from app.crud import product as product_crud
from app.models.enums import ProductSortBy
from app.services.embedding import embedding_service
from app.services.pricing import compute_unit, resolve_company_pct


async def fetch_categories_for_menu(db: AsyncSession):
    return await category_crud.get_all_categories(db)


def _enrich_product_rows(
    products: list, company_pct: Decimal, cap: Decimal
) -> list[dict]:
    """Builds ProductListOut-shaped rows, precomputing the company price when applicable.

    "COMPANY" here means: always precompute the company price so the frontend
    can decide whether to show it based on client-side purchase mode.
    """
    enriched = []
    for product in products:
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
    return enriched


async def fetch_products_for_catalog(
    db: AsyncSession,
    category_slug: str | None = None,
    search_query: str | None = None,
    page: int = 1,
    size: int = 24,
    sort_by: ProductSortBy | None = None,
    user=None,
):
    if category_slug:
        category = await category_crud.get_category_by_slug(db, category_slug)
        if not category:
            raise CategoryNotFoundException()

    skip = (page - 1) * size
    normalized_query = search_query.strip() if search_query else None
    if normalized_query == "":
        normalized_query = None

    effective_sort = product_crud.resolve_effective_sort(sort_by, normalized_query)
    search_mode = "fts"

    use_hybrid = (
        normalized_query is not None
        and effective_sort == ProductSortBy.RELEVANCE
        and embedding_service.is_available()
        and await product_crud.has_any_product_embeddings(db)
    )

    if use_hybrid:
        assert normalized_query is not None
        query_embedding = embedding_service.embed_query(normalized_query)
        items, total = await product_crud.get_active_products_hybrid(
            db,
            search_query=normalized_query,
            query_embedding=query_embedding,
            category_slug=category_slug,
            skip=skip,
            limit=size,
            candidate_limit=settings.SEMANTIC_SEARCH_CANDIDATE_LIMIT,
            max_distance=settings.SEMANTIC_SEARCH_MAX_DISTANCE,
        )
        search_mode = "hybrid"
    else:
        items, total = await product_crud.get_active_products(
            db, category_slug, search_query, skip, size, sort_by
        )

    company_pct = await resolve_company_pct(db, user, "COMPANY")
    cap = settings.MAX_TOTAL_DISCOUNT_PERCENT
    enriched = _enrich_product_rows(items, company_pct, cap)

    return {
        "items": enriched,
        "total": total,
        "page": page,
        "size": size,
        "pages": math.ceil(total / size) if total > 0 else 0,
        "search_mode": search_mode,
    }


async def fetch_product_details(db: AsyncSession, product_slug: str):
    product = await product_crud.get_product_by_slug(db, product_slug)

    if not product:
        raise ProductNotFoundException()

    return product


async def fetch_related_products(
    db: AsyncSession, product_slug: str, user=None, limit: int = 8
):
    """Returns other active products from the same category as the given product."""
    product = await product_crud.get_product_by_slug(db, product_slug)
    if not product:
        raise ProductNotFoundException()

    related = await product_crud.get_related_products(
        db, product.category_id, product.id, limit
    )

    company_pct = await resolve_company_pct(db, user, "COMPANY")
    cap = settings.MAX_TOTAL_DISCOUNT_PERCENT
    return _enrich_product_rows(related, company_pct, cap)
