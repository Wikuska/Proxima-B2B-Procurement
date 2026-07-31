import uuid

from app.models.enums import OrderStatus, PurchaseType
from app.models.order import BillingDocument, Order, OrderItem, Shipment
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


def _order_detail_options(*extra: object):
    """Items include live Product so OrderItemOut can resolve current slug."""
    return (
        selectinload(Order.items).selectinload(OrderItem.product),
        selectinload(Order.billing_document),
        selectinload(Order.shipment),
        *extra,
    )


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


async def update_order_status(
    db: AsyncSession, order_id: uuid.UUID, status: OrderStatus
) -> Order:
    stmt = select(Order).where(Order.id == order_id)
    result = await db.execute(stmt)
    order = result.scalar_one()
    order.status = status
    await db.flush()
    await db.refresh(order, ["items", "billing_document", "shipment"])
    return order


async def get_order_by_id(db: AsyncSession, order_id: uuid.UUID) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(*_order_detail_options())
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_order(db: AsyncSession, order_id: uuid.UUID, user_id: uuid.UUID) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.user_id == user_id)
        .options(*_order_detail_options())
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_orders_for_company(
    db: AsyncSession,
    company_id: uuid.UUID,
    status: OrderStatus | None = None,
) -> list[Order]:
    stmt = (
        select(Order)
        .where(Order.company_id == company_id)
        .options(
            selectinload(Order.items),
            selectinload(Order.user),
            selectinload(Order.billing_document),
            selectinload(Order.shipment),
        )
        .order_by(Order.created_at.desc())
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    result = await db.scalars(stmt)
    return list(result.all())


async def get_order_for_company(
    db: AsyncSession, order_id: uuid.UUID, company_id: uuid.UUID
) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id, Order.company_id == company_id)
        .options(*_order_detail_options(selectinload(Order.user)))
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def get_all_orders_for_admin(
    db: AsyncSession,
    status: OrderStatus | None = None,
) -> list[Order]:
    """All platform orders (B2B + B2C), newest first, with placer and company."""
    stmt = (
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.user),
            selectinload(Order.company),
            selectinload(Order.billing_document),
            selectinload(Order.shipment),
        )
        .order_by(Order.created_at.desc())
    )
    if status is not None:
        stmt = stmt.where(Order.status == status)
    result = await db.scalars(stmt)
    return list(result.all())


async def get_order_for_admin(
    db: AsyncSession, order_id: uuid.UUID
) -> Order | None:
    stmt = (
        select(Order)
        .where(Order.id == order_id)
        .options(
            *_order_detail_options(
                selectinload(Order.user),
                selectinload(Order.company),
            )
        )
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
