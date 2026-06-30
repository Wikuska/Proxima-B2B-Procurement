import types
import uuid

from app.core.exceptions import (
    B2BRestrictedException,
    EmptyOrderException,
    InsufficientStockException,
    InvalidShippingAddressException,
    InvoiceRequiresCompanyException,
    OrderNotFoundException,
    ProductUnavailableException,
)
from app.crud import address as address_crud
from app.crud import cart as cart_crud
from app.crud import order as order_crud
from app.crud import product as product_crud
from app.models.enums import OrderStatus, PurchaseType
from app.models.order import Order, OrderItem
from app.models.user import User
from app.schemas.order import OrderCreate
from app.services import pricing
from sqlalchemy.ext.asyncio import AsyncSession


async def create_order(db: AsyncSession, user: User, payload: OrderCreate) -> Order:
    # 1. B2B requires a company account
    if payload.purchase_type == PurchaseType.B2B and user.company_id is None:
        raise InvoiceRequiresCompanyException()

    # 2. Intersect requested product_ids with the user's actual cart items
    cart_items = await cart_crud.get_cart_items(db, user.id)
    requested = set(payload.product_ids)
    items_to_order = [ci for ci in cart_items if ci.product_id in requested]
    if not items_to_order:
        raise EmptyOrderException()

    # 3. Resolve shipping address → snapshot fields
    shipping = await _resolve_shipping(db, user, payload)

    # 4. Compute authoritative prices
    mode = "COMPANY" if payload.purchase_type == PurchaseType.B2B else "PRIVATE"
    pricing_req = types.SimpleNamespace(mode=mode, items=items_to_order)
    quote = await pricing.process_quote(db, pricing_req, user)
    lines_by_pid = {line["product_id"]: line for line in quote["lines"]}

    # 5. Load product metadata and validate each line; atomically decrement stock
    product_ids = [ci.product_id for ci in items_to_order]
    products = await product_crud.get_products_by_ids(db, product_ids)
    products_map = {p.id: p for p in products}

    order_items: list[OrderItem] = []
    for ci in items_to_order:
        product = products_map.get(ci.product_id)
        if product is None or not product.is_active:
            raise ProductUnavailableException()
        if product.is_b2b_only and user.company_id is None:
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

    # 6. Build billing snapshot (B2B only)
    billing_nip = None
    billing_company_name = None
    if payload.purchase_type == PurchaseType.B2B and user.company_id is not None:
        from app.crud import company as company_crud
        company = await company_crud.get_company_by_id(db, user.company_id)
        if company is not None:
            billing_nip = company.nip
            billing_company_name = company.name

    order = Order(
        user_id=user.id,
        purchase_type=payload.purchase_type,
        status=OrderStatus.PENDING_PAYMENT,
        total_amount=quote["grand_total"],
        billing_nip=billing_nip,
        billing_company_name=billing_company_name,
        **shipping,
    )

    # 7. Persist order + items, clear ordered cart items — single commit
    created = await order_crud.create_order(db, order, order_items)
    for ci in items_to_order:
        await db.delete(ci)

    await db.commit()
    await db.refresh(created, ["items"])
    return created


async def list_orders(db: AsyncSession, user: User) -> list[Order]:
    return await order_crud.get_orders_for_user(db, user.id)


async def get_order(db: AsyncSession, user: User, order_id: uuid.UUID) -> Order:
    order = await order_crud.get_order(db, order_id, user.id)
    if order is None:
        raise OrderNotFoundException()
    return order


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------


async def _resolve_shipping(
    db: AsyncSession, user: User, payload: OrderCreate
) -> dict:
    """Returns a dict of shipping_* fields ready to unpack into Order()."""
    if payload.purchase_type == PurchaseType.B2B:
        if payload.address_id is None:
            raise InvalidShippingAddressException()
        address = await address_crud.get_address(db, payload.address_id)
        if address is None or address.company_id != user.company_id:
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
                # Ephemeral — construct an unsaved object just to read fields
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

    return {
        "shipping_street": address.street,
        "shipping_city": address.city,
        "shipping_postal_code": address.postal_code,
        "shipping_country": address.country,
    }
