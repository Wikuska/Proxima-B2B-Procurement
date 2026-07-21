import uuid

from app.models import Category, Product
from app.models.enums import ProductSortBy
from app.ai.hybrid_search import reciprocal_rank_fusion
from sqlalchemy import desc, func, or_, select, text, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


def resolve_effective_sort(
    sort_by: ProductSortBy | None,
    search_query: str | None,
) -> ProductSortBy:
    if sort_by is None:
        return ProductSortBy.RELEVANCE if search_query else ProductSortBy.NAME_ASC
    if sort_by == ProductSortBy.RELEVANCE and not search_query:
        return ProductSortBy.NAME_ASC
    return sort_by


def _apply_search_filter(stmt, search_query: str):
    return stmt.where(
        or_(
            text(
                "products.search_vector @@ websearch_to_tsquery('simple', :search_q)"
            ).bindparams(search_q=search_query),
            Product.sku.ilike(f"{search_query}%"),
        )
    )


def _apply_sort(stmt, effective_sort: ProductSortBy, search_query: str | None):
    if effective_sort == ProductSortBy.RELEVANCE:
        ts_query = func.websearch_to_tsquery("simple", search_query)
        rank = func.ts_rank(text("products.search_vector"), ts_query)
        return stmt.order_by(desc(rank), Product.name.asc())

    if effective_sort == ProductSortBy.PRICE_ASC:
        return stmt.order_by(Product.base_price.asc(), Product.name.asc())

    if effective_sort == ProductSortBy.PRICE_DESC:
        return stmt.order_by(Product.base_price.desc(), Product.name.asc())

    return stmt.order_by(Product.name.asc())


async def has_any_product_embeddings(db: AsyncSession) -> bool:
    stmt = (
        select(Product.id)
        .where(Product.is_active, Product.embedding.isnot(None))
        .limit(1)
    )
    return (await db.scalar(stmt)) is not None


async def get_active_products(
    db: AsyncSession,
    category_slug: str | None = None,
    search_query: str | None = None,
    skip: int = 0,
    limit: int = 24,
    sort_by: ProductSortBy | None = None,
):
    normalized_query = search_query.strip() if search_query else None
    if normalized_query == "":
        normalized_query = None

    effective_sort = resolve_effective_sort(sort_by, normalized_query)

    stmt = select(Product).where(Product.is_active)
    if category_slug:
        stmt = stmt.join(Product.category).where(Category.slug == category_slug)

    if normalized_query:
        stmt = _apply_search_filter(stmt, normalized_query)

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = await db.scalar(count_stmt) or 0

    stmt = _apply_sort(stmt, effective_sort, normalized_query).offset(skip).limit(limit)
    result = await db.scalars(stmt)
    items = result.all()

    return items, total


async def get_active_products_hybrid(
    db: AsyncSession,
    search_query: str,
    query_embedding: list[float],
    category_slug: str | None = None,
    skip: int = 0,
    limit: int = 24,
    candidate_limit: int = 50,
    max_distance: float = 0.55,
) -> tuple[list[Product], int]:
    """FTS + vector candidates fused with RRF, then paginated.

    Vector hits must be within ``max_distance`` (cosine). FTS hits are kept
    regardless so exact SKU / name matches never disappear.
    """
    fts_stmt = select(Product.id).where(Product.is_active)
    if category_slug:
        fts_stmt = fts_stmt.join(Product.category).where(Category.slug == category_slug)
    fts_stmt = _apply_search_filter(fts_stmt, search_query)
    ts_query = func.websearch_to_tsquery("simple", search_query)
    fts_rank = func.ts_rank(text("products.search_vector"), ts_query)
    fts_stmt = fts_stmt.order_by(desc(fts_rank), Product.name.asc()).limit(
        candidate_limit
    )
    fts_ids = list(await db.scalars(fts_stmt))

    distance = Product.embedding.cosine_distance(query_embedding)
    vector_stmt = select(Product.id).where(
        Product.is_active,
        Product.embedding.isnot(None),
        distance < max_distance,
    )
    if category_slug:
        vector_stmt = vector_stmt.join(Product.category).where(
            Category.slug == category_slug
        )
    vector_stmt = vector_stmt.order_by(distance).limit(candidate_limit)
    vector_ids = list(await db.scalars(vector_stmt))

    fused_ids = reciprocal_rank_fusion([fts_ids, vector_ids])
    total = len(fused_ids)
    page_ids = fused_ids[skip : skip + limit]
    if not page_ids:
        return [], total

    products = await get_products_by_ids(db, page_ids)
    by_id = {product.id: product for product in products}
    ordered = [by_id[pid] for pid in page_ids if pid in by_id]
    return ordered, total


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


async def try_decrement_stock(db: AsyncSession, product_id: uuid.UUID, qty: int) -> bool:
    """Atomically decrements stock only when sufficient quantity is available.

    Returns True on success, False when stock is insufficient (no partial update).
    """
    stmt = (
        update(Product)
        .where(Product.id == product_id, Product.stock_quantity >= qty)
        .values(stock_quantity=Product.stock_quantity - qty)
    )
    result = await db.execute(stmt)
    return result.rowcount > 0


async def get_related_products(
    db: AsyncSession,
    category_id: uuid.UUID,
    exclude_id: uuid.UUID,
    limit: int = 8,
) -> list[Product]:
    """Returns active products from the same category, excluding the given product."""
    stmt = (
        select(Product)
        .where(
            Product.category_id == category_id,
            Product.id != exclude_id,
            Product.is_active,
        )
        .order_by(Product.name)
        .limit(limit)
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
