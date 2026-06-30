import uuid
from datetime import datetime
from decimal import Decimal

from app.models.enums import OrderStatus, PurchaseType
from app.schemas.address import AddressIn
from pydantic import BaseModel, ConfigDict


class OrderCreate(BaseModel):
    product_ids: list[uuid.UUID]
    purchase_type: PurchaseType
    address_id: uuid.UUID | None = None
    shipping_address: AddressIn | None = None
    save_address: bool = False


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    product_id: uuid.UUID
    product_name: str
    product_sku: str
    quantity: int
    unit_price: Decimal
    discount_percentage: Decimal


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    total_amount: Decimal
    created_at: datetime

    billing_nip: str | None
    billing_company_name: str | None

    shipping_street: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str

    items: list[OrderItemOut]


class OrderSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    total_amount: Decimal
    created_at: datetime
    item_count: int
