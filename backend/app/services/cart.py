import uuid

from app.core.exceptions import (
    B2BRestrictedException,
    InsufficientStockException,
    ProductNotFoundException,
    ProductUnavailableException,
)
from app.crud import cart as cart_crud
from app.crud import product as product_crud
from app.models.order import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartMergeItem
from sqlalchemy.ext.asyncio import AsyncSession


def _validate(product: Product, total_qty: int, user: User) -> None:
    if not product.is_active:
        raise ProductUnavailableException()
    if product.is_b2b_only and user.company_id is None:
        raise B2BRestrictedException()
    if total_qty > product.stock_quantity:
        raise InsufficientStockException()


async def get_cart(db: AsyncSession, user: User) -> list[CartItem]:
    return await cart_crud.get_cart_items(db, user.id)


async def add_item(
    db: AsyncSession, user: User, product_id: uuid.UUID, qty: int
) -> list[CartItem]:
    product = await product_crud.get_product_by_id(db, product_id)
    if product is None:
        raise ProductNotFoundException()

    existing = await cart_crud.get_cart_item(db, user.id, product_id)
    total = (existing.quantity if existing else 0) + qty

    _validate(product, total, user)
    await cart_crud.upsert_item(db, user.id, product_id, total)
    return await cart_crud.get_cart_items(db, user.id)


async def set_item_quantity(
    db: AsyncSession, user: User, product_id: uuid.UUID, qty: int
) -> list[CartItem]:
    product = await product_crud.get_product_by_id(db, product_id)
    if product is None:
        raise ProductNotFoundException()

    _validate(product, qty, user)
    await cart_crud.upsert_item(db, user.id, product_id, qty)
    return await cart_crud.get_cart_items(db, user.id)


async def remove_item(
    db: AsyncSession, user: User, product_id: uuid.UUID
) -> None:
    await cart_crud.remove_item(db, user.id, product_id)


async def clear_cart(db: AsyncSession, user: User) -> None:
    await cart_crud.clear_cart(db, user.id)


async def merge_guest_cart(
    db: AsyncSession, user: User, items: list[CartMergeItem]
) -> list[CartItem]:
    for item in items:
        product = await product_crud.get_product_by_id(db, item.product_id)
        if product is None or not product.is_active:
            continue
        if product.is_b2b_only and user.company_id is None:
            continue

        existing = await cart_crud.get_cart_item(db, user.id, item.product_id)
        current_qty = existing.quantity if existing else 0
        target_qty = min(current_qty + item.quantity, product.stock_quantity)

        if target_qty > 0:
            await cart_crud.upsert_item(db, user.id, item.product_id, target_qty)

    return await cart_crud.get_cart_items(db, user.id)
