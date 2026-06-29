import uuid

from app.models.order import CartItem
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def get_cart_items(db: AsyncSession, user_id: uuid.UUID) -> list[CartItem]:
    stmt = (
        select(CartItem)
        .where(CartItem.user_id == user_id)
        .options(selectinload(CartItem.product))
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_cart_item(
    db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID
) -> CartItem | None:
    stmt = select(CartItem).where(
        CartItem.user_id == user_id, CartItem.product_id == product_id
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def upsert_item(
    db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID, quantity: int
) -> CartItem:
    item = await get_cart_item(db, user_id, product_id)
    if item is None:
        item = CartItem(user_id=user_id, product_id=product_id, quantity=quantity)
        db.add(item)
    else:
        item.quantity = quantity
    await db.commit()
    return item


async def remove_item(
    db: AsyncSession, user_id: uuid.UUID, product_id: uuid.UUID
) -> None:
    item = await get_cart_item(db, user_id, product_id)
    if item is not None:
        await db.delete(item)
        await db.commit()


async def clear_cart(db: AsyncSession, user_id: uuid.UUID) -> None:
    items = await get_cart_items(db, user_id)
    for item in items:
        await db.delete(item)
    await db.commit()
