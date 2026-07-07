import uuid

from app.models.enums import PurchaseType
from app.models.order import BillingDocument, Order, OrderItem, Shipment
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def create_order(
    db: AsyncSession,
    order: Order,
    items: list[OrderItem],
    billing_document: BillingDocument,
    shipment: Shipment,
) -> Order:
    db.add(order)
    await db.flush()
    for item in items:
        item.order_id = order.id
        db.add(item)
    billing_document.order_id = order.id
    db.add(billing_document)
    shipment.order_id = order.id
    db.add(shipment)
    await db.flush()
    await db.refresh(order, ["items", "billing_document", "shipment"])
    return order


async def get_orders_for_user(
    db: AsyncSession,
    user_id: uuid.UUID,
    purchase_type: PurchaseType | None = None,
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.user_id == user_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.billing_document),
            selectinload(Order.shipment),
        )
        .order_by(Order.created_at.desc())
    )
    if purchase_type is not None:
        stmt = stmt.where(Order.purchase_type == purchase_type)
    result = await db.scalars(stmt)
    return list(result.all())


async def get_order(db: AsyncSession, order_id: uuid.UUID, user_id: uuid.UUID) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.billing_document),
            selectinload(Order.shipment),
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
