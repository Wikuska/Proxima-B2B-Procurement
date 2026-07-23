import uuid
from datetime import datetime
from decimal import Decimal

from app.models.enums import DeliveryMethod, DocumentType, OrderStatus, PaymentMethod, PurchaseType
from app.schemas.address import AddressIn
from pydantic import BaseModel, ConfigDict, model_validator


class BillingDocumentIn(BaseModel):
    document_type: DocumentType

    # COMPANY_INVOICE fields (manual entry for PRIVATE mode; ignored in COMPANY mode)
    company_name: str | None = None
    company_nip: str | None = None

    # PERSONAL_INVOICE fields
    first_name: str | None = None
    last_name: str | None = None

    # Billing address (RECEIPT → empty; PERSONAL/COMPANY invoice → required in PRIVATE mode)
    billing_street: str | None = None
    billing_city: str | None = None
    billing_postal_code: str | None = None
    billing_country: str | None = None

    @model_validator(mode="after")
    def validate_consistency(self) -> "BillingDocumentIn":
        if self.document_type == DocumentType.COMPANY_INVOICE:
            has_name = bool(self.company_name)
            has_nip = bool(self.company_nip)
            if has_name != has_nip:
                raise ValueError("company_name and company_nip must be provided together")
        if self.document_type == DocumentType.PERSONAL_INVOICE:
            has_first = bool(self.first_name)
            has_last = bool(self.last_name)
            if has_first != has_last:
                raise ValueError("first_name and last_name must be provided together")
        return self


class BillingDocumentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_type: DocumentType
    document_number: str | None
    company_name: str | None
    company_nip: str | None
    first_name: str | None
    last_name: str | None
    billing_street: str | None
    billing_city: str | None
    billing_postal_code: str | None
    billing_country: str | None
    pdf_url: str | None
    issued_at: datetime | None
    created_at: datetime


class OrderCreate(BaseModel):
    product_ids: list[uuid.UUID]
    purchase_type: PurchaseType
    document: BillingDocumentIn
    address_id: uuid.UUID | None = None
    shipping_address: AddressIn | None = None
    save_address: bool = False

    delivery_method: DeliveryMethod
    payment_method: PaymentMethod
    recipient_name: str
    recipient_phone: str
    recipient_email: str | None = None
    note: str | None = None


class ShipmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    delivery_method: DeliveryMethod
    shipping_cost: Decimal
    recipient_name: str
    recipient_phone: str
    recipient_email: str | None
    shipping_street: str
    shipping_city: str
    shipping_postal_code: str
    shipping_country: str
    created_at: datetime


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
    company_id: uuid.UUID | None = None
    payment_method: PaymentMethod
    total_amount: Decimal
    note: str | None
    created_at: datetime

    billing_document: BillingDocumentOut
    shipment: ShipmentOut

    items: list[OrderItemOut]


class OrderSummaryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    status: OrderStatus
    purchase_type: PurchaseType
    company_id: uuid.UUID | None = None
    total_amount: Decimal
    created_at: datetime
    item_count: int


class DeliveryOptionOut(BaseModel):
    delivery_method: DeliveryMethod
    cost: Decimal


class PaymentOptionOut(BaseModel):
    payment_method: PaymentMethod
    b2b_only: bool


class CheckoutOptionsOut(BaseModel):
    delivery_methods: list[DeliveryOptionOut]
    payment_methods: list[PaymentOptionOut]


class MockPaymentIn(BaseModel):
    success: bool
