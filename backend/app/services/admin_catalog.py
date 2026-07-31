import logging
import uuid
from decimal import Decimal
from uuid import UUID

from slugify import slugify
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.embedding import build_product_embedding_text, embedding_service
from app.core.exceptions import (
    CategoryNotFoundException,
    DuplicateProductSkuException,
    ProductNotFoundException,
)
from app.crud import category as category_crud
from app.crud import product as product_crud
from app.models import Category, Product
from app.schemas.admin_catalog import AdminProductWriteIn, AdminVolumeDiscountIn

logger = logging.getLogger(__name__)


async def list_products_for_admin(db: AsyncSession):
    return await product_crud.get_all_products_for_admin(db)


async def get_product_for_admin(db: AsyncSession, product_id: UUID):
    product = await product_crud.get_product_for_admin(db, product_id)
    if product is None:
        raise ProductNotFoundException()
    return product


async def create_product_for_admin(
    db: AsyncSession, data: AdminProductWriteIn
) -> Product:
    category = await _get_category_or_raise(db, data.category_id)
    await _ensure_sku_available(db, data.sku)

    name = data.name.strip()
    slug = await _unique_slug_from_name(db, name)

    product = await product_crud.create_product(
        db,
        category_id=data.category_id,
        name=name,
        slug=slug,
        sku=data.sku.strip(),
        description=_normalize_optional_text(data.description),
        base_price=data.base_price,
        stock_quantity=data.stock_quantity,
        main_image_url=_normalize_optional_text(data.main_image_url),
        is_active=data.is_active,
        is_b2b_only=data.is_b2b_only,
    )
    await product_crud.replace_volume_discounts(
        db, product, _tiers_as_tuples(data.volume_discounts)
    )
    _sync_product_embedding(product, category_name=category.name)
    await db.commit()
    db.expire(product, ["volume_discounts"])
    return await get_product_for_admin(db, product.id)


async def update_product_for_admin(
    db: AsyncSession, product_id: UUID, data: AdminProductWriteIn
) -> Product:
    product = await product_crud.get_product_for_admin(db, product_id)
    if product is None:
        raise ProductNotFoundException()

    category = await _get_category_or_raise(db, data.category_id)
    await _ensure_sku_available(db, data.sku, exclude_id=product.id)

    name = data.name.strip()
    sku = data.sku.strip()
    description = _normalize_optional_text(data.description)

    # Regenerate slug only when the name changes — keeps storefront URLs stable.
    if name != product.name:
        slug = await _unique_slug_from_name(db, name, exclude_id=product.id)
    else:
        slug = product.slug

    embedding_inputs_changed = (
        name != product.name
        or sku != product.sku
        or data.category_id != product.category_id
        or description != product.description
    )

    await product_crud.update_product(
        db,
        product,
        category_id=data.category_id,
        name=name,
        slug=slug,
        sku=sku,
        description=description,
        base_price=data.base_price,
        stock_quantity=data.stock_quantity,
        main_image_url=_normalize_optional_text(data.main_image_url),
        is_active=data.is_active,
        is_b2b_only=data.is_b2b_only,
    )
    await product_crud.replace_volume_discounts(
        db, product, _tiers_as_tuples(data.volume_discounts)
    )
    if embedding_inputs_changed:
        _sync_product_embedding(product, category_name=category.name)
    await db.commit()
    db.expire(product, ["volume_discounts"])
    return await get_product_for_admin(db, product.id)


def _tiers_as_tuples(
    tiers: list[AdminVolumeDiscountIn],
) -> list[tuple[int, Decimal]]:
    return [(tier.min_quantity, tier.discount_percentage) for tier in tiers]


def _sync_product_embedding(
    product: Product, *, category_name: str | None
) -> None:
    """Refresh product.embedding when semantic search is on; otherwise clear it.

    Never raises — product writes must succeed even if the local model fails.
    """
    if not embedding_service.is_available():
        product.embedding = None
        return

    try:
        text = build_product_embedding_text(product, category_name=category_name)
        product.embedding = embedding_service.embed_texts([text])[0]
    except Exception:
        logger.warning(
            "Failed to embed product sku=%s; leaving embedding unset",
            product.sku,
            exc_info=True,
        )
        product.embedding = None


async def _get_category_or_raise(
    db: AsyncSession, category_id: UUID
) -> Category:
    category = await category_crud.get_category_by_id(db, category_id)
    if category is None:
        raise CategoryNotFoundException()
    return category


async def _ensure_sku_available(
    db: AsyncSession, sku: str, exclude_id: UUID | None = None
) -> None:
    existing = await product_crud.get_product_by_sku(db, sku.strip())
    if existing is not None and existing.id != exclude_id:
        raise DuplicateProductSkuException()


async def _unique_slug_from_name(
    db: AsyncSession, name: str, exclude_id: UUID | None = None
) -> str:
    """Build a unique URL slug from the product name (not editable by clients)."""
    base = slugify(name) or "product"
    candidate = base
    existing = await product_crud.get_product_by_slug(db, candidate)
    if existing is None or existing.id == exclude_id:
        return candidate
    return f"{base}-{uuid.uuid4().hex[:8]}"


def _normalize_optional_text(value: str | None) -> str | None:
    if value is None:
        return None
    stripped = value.strip()
    return stripped or None
