import uuid
from typing import Optional

from app.core.dependencies import get_current_user, require_admin
from app.database import get_db
from app.models.enums import PurchaseType
from app.models.user import User
from app.schemas.order import CheckoutOptionsOut, MockPaymentIn, OrderCreate, OrderOut, OrderSummaryOut
from app.services import order as order_service
from app.services import payment as payment_service
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post("", response_model=OrderOut, status_code=status.HTTP_201_CREATED)
async def create_order(
    payload: OrderCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.create_order(db, user, payload)


@router.get("/checkout-options", response_model=CheckoutOptionsOut)
async def get_checkout_options(
    user: User = Depends(get_current_user),
):
    return await order_service.get_checkout_options()


@router.get("", response_model=list[OrderSummaryOut])
async def list_orders(
    purchase_type: Optional[PurchaseType] = Query(default=None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.list_orders(db, user, purchase_type)


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.get_order(db, user, order_id)


@router.post("/{order_id}/payment/mock", response_model=OrderOut)
async def mock_payment(
    order_id: uuid.UUID,
    payload: MockPaymentIn,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.mock_payment_result(db, user, order_id, payload.success)


@router.post("/{order_id}/payment/confirm", response_model=OrderOut)
async def confirm_payment(
    order_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await payment_service.confirm_bank_transfer(db, user, order_id)


@router.post("/{order_id}/advance-status", response_model=OrderOut)
async def advance_order_status(
    order_id: uuid.UUID,
    admin: User = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    return await order_service.advance_order_status(db, order_id)
