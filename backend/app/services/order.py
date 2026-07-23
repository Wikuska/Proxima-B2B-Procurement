import types
import uuid
from decimal import Decimal

from app.core.exceptions import (
    B2BRestrictedException,
    CompanyBillingAddressMissingException,
    EmptyOrderException,
    InsufficientStockException,
    InvalidBillingDataException,
    InvalidPaymentMethodException,
    InvalidShippingAddressException,
    OrderNotFoundException,
    ProductUnavailableException,
)
from app.crud import address as address_crud
from app.crud import cart as cart_crud
from app.crud import order as order_crud
from app.crud import product as product_crud
from app.models.enums import DeliveryMethod, DocumentType, PaymentMethod, PurchaseType
from app.models.order import BillingDocument, Order, OrderItem, Shipment
from app.models.user import User
from app.schemas.order import BillingDocumentIn, CheckoutOptionsOut, DeliveryOptionOut, OrderCreate, PaymentOptionOut
from app.services import payment, pricing
from sqlalchemy.ext.asyncio import AsyncSession

SHIPPING_COSTS: dict[DeliveryMethod, Decimal] = {
    DeliveryMethod.COURIER: Decimal("15.00"),
    DeliveryMethod.COURIER_EXPRESS: Decimal("25.00"),
    DeliveryMethod.INPOST_LOCKER: Decimal("12.00"),
    DeliveryMethod.PICKUP: Decimal("0.00"),
}


def _resolve_shipping_cost(delivery_method: DeliveryMethod) -> Decimal:
    return SHIPPING_COSTS[delivery_method]


async def create_order(db: AsyncSession, user: User, payload: OrderCreate) -> Order:
    mode = "COMPANY" if payload.purchase_type == PurchaseType.B2B else "PRIVATE"

    # 1. B2B purchase type requires company membership
    if payload.purchase_type == PurchaseType.B2B and user.company_id is None:
        from app.core.exceptions import NotInCompanyException
        raise NotInCompanyException()

    # DEFERRED payment is only available for B2B orders
    if payload.payment_method == PaymentMethod.DEFERRED and payload.purchase_type != PurchaseType.B2B:
        raise InvalidPaymentMethodException()

    # 3. Intersect requested product_ids with the user's actual cart items
    cart_items = await cart_crud.get_cart_items(db, user.id)
    requested = set(payload.product_ids)
    items_to_order = [ci for ci in cart_items if ci.product_id in requested]
    if not items_to_order:
        raise EmptyOrderException()

    # 2. Resolve shipping address + recipient → Shipment snapshot
    shipment = await _resolve_shipping(db, user, payload)

    # 4. Compute authoritative prices
    pricing_req = types.SimpleNamespace(mode=mode, items=items_to_order)
    quote = await pricing.process_quote(db, pricing_req, user)
    lines_by_pid = {line["product_id"]: line for line in quote["lines"]}

    # 5. Load product metadata, validate b2b_only restriction, atomically decrement stock
    product_ids = [ci.product_id for ci in items_to_order]
    products = await product_crud.get_products_by_ids(db, product_ids)
    products_map = {p.id: p for p in products}

    order_items: list[OrderItem] = []
    for ci in items_to_order:
        product = products_map.get(ci.product_id)
        if product is None or not product.is_active:
            raise ProductUnavailableException()

        # B2B-only products are hard-blocked in B2C (even for company members)
        if product.is_b2b_only and payload.purchase_type == PurchaseType.B2C:
            raise B2BRestrictedException()

        ok = await product_crud.try_decrement_stock(db, ci.product_id, ci.quantity)
        if not ok:
            raise InsufficientStockException()

        line = lines_by_pid[ci.product_id]
        order_items.append(
            OrderItem(
                product_id=ci.product_id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=ci.quantity,
                unit_price=line["final_unit_price"],
                discount_percentage=line["effective_pct"],
            )
        )

    # 6. Build BillingDocument snapshot
    billing_document = await _build_billing_document(db, user, payload, mode)

    order = Order(
        user_id=user.id,
        company_id=(
            user.company_id if payload.purchase_type == PurchaseType.B2B else None
        ),
        purchase_type=payload.purchase_type,
        status=payment.resolve_initial_status(payload.payment_method),
        payment_method=payload.payment_method,
        total_amount=quote["grand_total"] + shipment.shipping_cost,
        note=payload.note,
    )

    # 7. Persist order + items + billing document + shipment, clear ordered cart items
    created = await order_crud.create_order(db, order, order_items, billing_document, shipment)
    for ci in items_to_order:
        await db.delete(ci)

    await db.commit()
    await db.refresh(created, ["items", "billing_document", "shipment"])
    return created


async def list_orders(
    db: AsyncSession, user: User, purchase_type: PurchaseType | None = None
) -> list[Order]:
    return await order_crud.get_orders_for_user(db, user.id, purchase_type)


async def get_order(db: AsyncSession, user: User, order_id: uuid.UUID) -> Order:
    order = await order_crud.get_order(db, order_id, user.id)
    if order is None:
        raise OrderNotFoundException()
    return order


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


def _uses_profile_billing(payload: OrderCreate) -> bool:
    """Snapshot from company profile only when B2B + empty COMPANY_INVOICE document."""
    if payload.purchase_type != PurchaseType.B2B:
        return False
    doc = payload.document
    return (
        doc.document_type == DocumentType.COMPANY_INVOICE
        and not doc.company_name
        and not doc.company_nip
    )


async def _build_billing_document(
    db: AsyncSession, user: User, payload: OrderCreate, mode: str
) -> BillingDocument:
    """
    Profile billing → force COMPANY_INVOICE, snapshot from DB (company + billing address).
    Manual billing → validate required fields per document_type, use input data.
    """
    if _uses_profile_billing(payload):
        from app.crud import company as company_crud

        company = await company_crud.get_company_by_id(db, user.company_id)
        billing_addr = await address_crud.get_company_billing_address(db, user.company_id)
        if billing_addr is None:
            raise CompanyBillingAddressMissingException()

        return BillingDocument(
            document_type=DocumentType.COMPANY_INVOICE,
            company_name=company.name,
            company_nip=company.nip,
            billing_street=billing_addr.street,
            billing_city=billing_addr.city,
            billing_postal_code=billing_addr.postal_code,
            billing_country=billing_addr.country,
        )

    # PRIVATE mode
    doc = payload.document
    _validate_private_billing(doc)

    return BillingDocument(
        document_type=doc.document_type,
        company_name=doc.company_name,
        company_nip=doc.company_nip,
        first_name=doc.first_name,
        last_name=doc.last_name,
        billing_street=doc.billing_street,
        billing_city=doc.billing_city,
        billing_postal_code=doc.billing_postal_code,
        billing_country=doc.billing_country,
    )


def _validate_private_billing(doc: BillingDocumentIn) -> None:
    """Raises InvalidBillingDataException if required fields are missing for the document type."""
    if doc.document_type == DocumentType.RECEIPT:
        return

    if doc.document_type == DocumentType.PERSONAL_INVOICE:
        missing = not doc.first_name or not doc.last_name
        if missing:
            raise InvalidBillingDataException()

    if doc.document_type == DocumentType.COMPANY_INVOICE:
        missing = not doc.company_name or not doc.company_nip
        if missing:
            raise InvalidBillingDataException()

    # PERSONAL_INVOICE and COMPANY_INVOICE both require billing address
    address_fields = [
        doc.billing_street,
        doc.billing_city,
        doc.billing_postal_code,
        doc.billing_country,
    ]
    if not all(address_fields):
        raise InvalidBillingDataException()


async def _resolve_shipping(db: AsyncSession, user: User, payload: OrderCreate) -> Shipment:
    """Resolves the shipping address and builds the Shipment snapshot (unsaved)."""
    if payload.purchase_type == PurchaseType.B2B:
        if payload.address_id is None:
            raise InvalidShippingAddressException()
        address = await address_crud.get_address(db, payload.address_id)
        # Must be a SHIPPING address belonging to the user's company
        from app.models.enums import AddressType

        if (
            address is None
            or address.company_id is None
            or address.company_id != user.company_id
            or address.address_type != AddressType.SHIPPING
        ):
            raise InvalidShippingAddressException()
    else:
        # B2C: address_id (personal) or inline shipping_address
        if payload.address_id is not None:
            address = await address_crud.get_address(db, payload.address_id)
            if address is None or address.user_id != user.id:
                raise InvalidShippingAddressException()
        elif payload.shipping_address is not None:
            if payload.save_address:
                address = await address_crud.create_address(
                    db, payload.shipping_address, user_id=user.id
                )
            else:
                from app.models.order import Address

                address = Address(
                    user_id=user.id,
                    street=payload.shipping_address.street,
                    city=payload.shipping_address.city,
                    postal_code=payload.shipping_address.postal_code,
                    country=payload.shipping_address.country,
                )
        else:
            raise InvalidShippingAddressException()

    shipping_cost = _resolve_shipping_cost(payload.delivery_method)
    return Shipment(
        delivery_method=payload.delivery_method,
        shipping_cost=shipping_cost,
        recipient_name=payload.recipient_name,
        recipient_phone=payload.recipient_phone,
        recipient_email=payload.recipient_email,
        shipping_street=address.street,
        shipping_city=address.city,
        shipping_postal_code=address.postal_code,
        shipping_country=address.country,
    )


async def advance_order_status(db: AsyncSession, order_id: uuid.UUID) -> Order:
    return await payment.advance_order_status(db, order_id)


async def get_checkout_options() -> CheckoutOptionsOut:
    return CheckoutOptionsOut(
        delivery_methods=[
            DeliveryOptionOut(delivery_method=method, cost=cost)
            for method, cost in SHIPPING_COSTS.items()
        ],
        payment_methods=[
            PaymentOptionOut(
                payment_method=method,
                b2b_only=method == PaymentMethod.DEFERRED,
            )
            for method in PaymentMethod
        ],
    )
