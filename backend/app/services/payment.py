import uuid

from app.core.exceptions import (
    InvalidOrderStatusTransitionException,
    OrderNotFoundException,
    PaymentActionNotAllowedException,
)
from app.crud import order as order_crud
from app.models.enums import OrderStatus, PaymentMethod
from app.models.order import Order
from app.models.user import User
from sqlalchemy.ext.asyncio import AsyncSession

ALLOWED_TRANSITIONS: dict[OrderStatus, set[OrderStatus]] = {
    # Successful payment (card/BLIK/transfer) always enters fulfillment.
    OrderStatus.PENDING_PAYMENT: {OrderStatus.PROCESSING},
    # Legacy PAID rows can still be advanced into the fulfillment pipeline.
    OrderStatus.PAID: {OrderStatus.PROCESSING},
    OrderStatus.PROCESSING: {OrderStatus.SHIPPED},
    OrderStatus.SHIPPED: {OrderStatus.DELIVERED},
}

FULFILLMENT_TRANSITIONS: dict[OrderStatus, OrderStatus] = {
    OrderStatus.PAID: OrderStatus.PROCESSING,  # legacy
    OrderStatus.PROCESSING: OrderStatus.SHIPPED,
    OrderStatus.SHIPPED: OrderStatus.DELIVERED,
}


def resolve_initial_status(payment_method: PaymentMethod) -> OrderStatus:
    if payment_method in (PaymentMethod.CASH_ON_DELIVERY, PaymentMethod.DEFERRED):
        return OrderStatus.PROCESSING
    return OrderStatus.PENDING_PAYMENT


def _validate_transition(current: OrderStatus, target: OrderStatus) -> None:
    allowed = ALLOWED_TRANSITIONS.get(current, set())
    if target not in allowed:
        raise InvalidOrderStatusTransitionException()


async def _get_owned_order(
    db: AsyncSession, user: User, order_id: uuid.UUID
) -> Order:
    order = await order_crud.get_order(db, order_id, user.id)
    if order is None:
        raise OrderNotFoundException()
    return order


async def _transition_order(
    db: AsyncSession, order: Order, target: OrderStatus
) -> Order:
    _validate_transition(order.status, target)
    updated = await order_crud.update_order_status(db, order.id, target)
    await db.commit()
    await db.refresh(updated, ["items", "billing_document", "shipment"])
    return updated


async def mock_payment_result(
    db: AsyncSession, user: User, order_id: uuid.UUID, success: bool
) -> Order:
    order = await _get_owned_order(db, user, order_id)

    if order.payment_method not in (PaymentMethod.CARD, PaymentMethod.BLIK):
        raise PaymentActionNotAllowedException()
    if order.status != OrderStatus.PENDING_PAYMENT:
        raise PaymentActionNotAllowedException()

    if not success:
        return order

    return await _transition_order(db, order, OrderStatus.PROCESSING)


async def confirm_bank_transfer(
    db: AsyncSession, user: User, order_id: uuid.UUID
) -> Order:
    order = await _get_owned_order(db, user, order_id)

    if order.payment_method != PaymentMethod.BANK_TRANSFER:
        raise PaymentActionNotAllowedException()
    if order.status != OrderStatus.PENDING_PAYMENT:
        raise PaymentActionNotAllowedException()

    return await _transition_order(db, order, OrderStatus.PROCESSING)


async def advance_order_status(
    db: AsyncSession, order_id: uuid.UUID
) -> Order:
    order = await order_crud.get_order_by_id(db, order_id)
    if order is None:
        raise OrderNotFoundException()

    target = FULFILLMENT_TRANSITIONS.get(order.status)
    if target is None:
        raise InvalidOrderStatusTransitionException()

    return await _transition_order(db, order, target)
