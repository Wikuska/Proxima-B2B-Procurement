import uuid

from app.models.order import Order, OrderItem
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def create_order(db: AsyncSession, order: Order, items: list[OrderItem]) -> Order:
    db.add(order)
    await db.flush()
    for item in items:
        item.order_id = order.id
        db.add(item)
    await db.flush()
    await db.refresh(order, ["items"])
    return order


async def get_orders_for_user(db: AsyncSession, user_id: uuid.UUID) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    )
    result = await db.scalars(stmt)
    return list(result.all())


async def get_order(db: AsyncSession, order_id: uuid.UUID, user_id: uuid.UUID) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(selectinload(Order.items))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
