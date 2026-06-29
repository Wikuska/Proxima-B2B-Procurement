import uuid

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.cart import CartItemIn, CartItemOut, CartItemUpdate, CartMergeItem
from app.schemas.common import MessageOut
from app.services import cart as cart_service
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("", response_model=list[CartItemOut])
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cart_service.get_cart(db, current_user)


@router.post("/items", response_model=list[CartItemOut])
async def add_item(
    payload: CartItemIn,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cart_service.add_item(db, current_user, payload.product_id, payload.quantity)


@router.patch("/items/{product_id}", response_model=list[CartItemOut])
async def set_item_quantity(
    product_id: uuid.UUID,
    payload: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cart_service.set_item_quantity(db, current_user, product_id, payload.quantity)


@router.delete("/items/{product_id}", response_model=MessageOut)
async def remove_item(
    product_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await cart_service.remove_item(db, current_user, product_id)
    return {"message": "Item removed from cart"}


@router.post("/merge", response_model=list[CartItemOut])
async def merge_cart(
    items: list[CartMergeItem],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await cart_service.merge_guest_cart(db, current_user, items)


@router.delete("", response_model=MessageOut)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    await cart_service.clear_cart(db, current_user)
    return {"message": "Cart cleared"}
