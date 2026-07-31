import uuid
from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy import Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base
from .enums import (
    AddressType,
    DeliveryMethod,
    DocumentType,
    OrderStatus,
    PaymentMethod,
    PurchaseType,
)

if TYPE_CHECKING:
    from .company import Company
    from .product import Product
    from .user import User


class Address(Base):
    __tablename__ = "addresses"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=True
    )
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"), nullable=True
    )

    address_type: Mapped[AddressType] = mapped_column(
        SQLEnum(AddressType), default=AddressType.SHIPPING, nullable=False
    )
    label: Mapped[str | None] = mapped_column(String(100))
    street: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)

    # Relations
    user: Mapped["User | None"] = relationship(back_populates="addresses")
    company: Mapped["Company | None"] = relationship(back_populates="addresses")

    __table_args__ = (
        CheckConstraint(
            "(user_id IS NOT NULL)::int + (company_id IS NOT NULL)::int = 1",
            name="ck_address_owner",
        ),
        Index(
            "ix_addresses_company_billing",
            "company_id",
            unique=True,
            postgresql_where="address_type='BILLING'",
        ),
    )


class CartItem(Base):
    __tablename__ = "cart_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=False
    )
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="cart_items")
    product: Mapped["Product"] = relationship()

    __table_args__ = (
        UniqueConstraint("user_id", "product_id", name="uq_cart_user_product"),
    )


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    company_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("companies.id", ondelete="RESTRICT"),
        nullable=True,
        index=True,
    )

    purchase_type: Mapped[PurchaseType] = mapped_column(
        SQLEnum(PurchaseType), nullable=False
    )
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus), default=OrderStatus.PENDING_PAYMENT, nullable=False
    )
    payment_method: Mapped[PaymentMethod] = mapped_column(
        SQLEnum(PaymentMethod), nullable=False
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relations
    user: Mapped["User"] = relationship(back_populates="orders")
    company: Mapped["Company | None"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(back_populates="order")
    billing_document: Mapped["BillingDocument"] = relationship(
        back_populates="order", cascade="all, delete-orphan", uselist=False
    )
    shipment: Mapped["Shipment"] = relationship(
        back_populates="order", cascade="all, delete-orphan", uselist=False
    )

    __table_args__ = (
        CheckConstraint(
            "("
            "CAST(purchase_type AS TEXT) = 'B2B' AND company_id IS NOT NULL"
            ") OR ("
            "CAST(purchase_type AS TEXT) = 'B2C' AND company_id IS NULL"
            ")",
            name="ck_orders_purchase_type_company_id",
        ),
    )

    @property
    def item_count(self) -> int:
        return len(self.items)


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("orders.id"), nullable=False)
    product_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("products.id"), nullable=False
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    discount_percentage: Mapped[Decimal] = mapped_column(
        Numeric(5, 2), default=Decimal("0.00")
    )

    product_name: Mapped[str] = mapped_column(String(255), nullable=False)
    product_sku: Mapped[str] = mapped_column(String(100), nullable=False)
    # Legacy column — no longer written. OrderItemOut resolves live Product.slug.
    product_slug: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Relations
    order: Mapped["Order"] = relationship(back_populates="items")
    product: Mapped["Product"] = relationship()


class BillingDocument(Base):
    __tablename__ = "billing_documents"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    document_type: Mapped[DocumentType] = mapped_column(
        SQLEnum(DocumentType), nullable=False
    )
    document_number: Mapped[str | None] = mapped_column(
        String(100), unique=True, nullable=True
    )

    # Company invoice fields
    company_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    company_nip: Mapped[str | None] = mapped_column(String(20), nullable=True)

    # Personal invoice fields
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Billing address (nullable — RECEIPT has none)
    billing_street: Mapped[str | None] = mapped_column(String(255), nullable=True)
    billing_city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    billing_postal_code: Mapped[str | None] = mapped_column(String(20), nullable=True)
    billing_country: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Forward-looking fields (populated when invoice is generated)
    pdf_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    issued_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relations
    order: Mapped["Order"] = relationship(back_populates="billing_document")


class Shipment(Base):
    __tablename__ = "shipments"

    id: Mapped[uuid.UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    order_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("orders.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    delivery_method: Mapped[DeliveryMethod] = mapped_column(
        SQLEnum(DeliveryMethod), nullable=False
    )
    shipping_cost: Mapped[Decimal] = mapped_column(
        Numeric(10, 2), nullable=False, default=Decimal("0.00")
    )

    recipient_name: Mapped[str] = mapped_column(String(200), nullable=False)
    recipient_phone: Mapped[str] = mapped_column(String(30), nullable=False)
    recipient_email: Mapped[str | None] = mapped_column(String(255), nullable=True)

    shipping_street: Mapped[str] = mapped_column(String(255), nullable=False)
    shipping_city: Mapped[str] = mapped_column(String(100), nullable=False)
    shipping_postal_code: Mapped[str] = mapped_column(String(20), nullable=False)
    shipping_country: Mapped[str] = mapped_column(String(100), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relations
    order: Mapped["Order"] = relationship(back_populates="shipment")
