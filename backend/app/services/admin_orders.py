from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import OrderNotFoundException
from app.crud import order as order_crud
from app.models import Order
from app.models.enums import OrderStatus
from app.schemas.admin_orders import AdminOrderDetailsOut, AdminOrderSummaryOut
from app.schemas.company import RequesterMini
from app.services import payment as payment_service


def _placed_by(order: Order) -> RequesterMini:
    return RequesterMini.model_validate(order.user)


def _to_summary(order: Order) -> AdminOrderSummaryOut:
    return AdminOrderSummaryOut(
        id=order.id,
        status=order.status,
        purchase_type=order.purchase_type,
        company_id=order.company_id,
        company_name=order.company.name if order.company else None,
        total_amount=order.total_amount,
        created_at=order.created_at,
        item_count=len(order.items),
        placed_by=_placed_by(order),
    )


def _to_details(order: Order) -> AdminOrderDetailsOut:
    return AdminOrderDetailsOut(
        id=order.id,
        status=order.status,
        purchase_type=order.purchase_type,
        company_id=order.company_id,
        company_name=order.company.name if order.company else None,
        payment_method=order.payment_method,
        total_amount=order.total_amount,
        note=order.note,
        created_at=order.created_at,
        billing_document=order.billing_document,
        shipment=order.shipment,
        items=order.items,
        placed_by=_placed_by(order),
    )


async def list_orders_for_admin(
    db: AsyncSession,
    status: OrderStatus | None = None,
) -> list[AdminOrderSummaryOut]:
    orders = await order_crud.get_all_orders_for_admin(db, status)
    return [_to_summary(order) for order in orders]


async def get_order_for_admin(
    db: AsyncSession, order_id: UUID
) -> AdminOrderDetailsOut:
    order = await order_crud.get_order_for_admin(db, order_id)
    if order is None:
        raise OrderNotFoundException()
    return _to_details(order)


async def advance_order_status_for_admin(
    db: AsyncSession, order_id: UUID
) -> AdminOrderDetailsOut:
    await payment_service.advance_order_status(db, order_id)
    return await get_order_for_admin(db, order_id)
