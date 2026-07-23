"""Company-scoped order history for company admins."""

from decimal import Decimal

import pytest
import pytest_asyncio
from app.models.enums import AddressType, UserRole
from app.models.order import Address, CartItem
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

_SHIPPING_DEFAULTS = {
    "delivery_method": "COURIER",
    "payment_method": "BANK_TRANSFER",
    "recipient_name": "Jan Kowalski",
    "recipient_phone": "+48123456789",
}

_INLINE_ADDR = {
    "street": "New St 10",
    "city": "Gdansk",
    "postal_code": "80-001",
    "country": "Poland",
}


async def _add_to_cart(db: AsyncSession, user_id, product_id, qty: int = 1):
    item = CartItem(user_id=user_id, product_id=product_id, quantity=qty)
    db.add(item)
    await db.commit()


@pytest_asyncio.fixture
async def company_and_buyer(user_factory, company_factory):
    company = await company_factory(
        name="Acme Labs",
        nip="1234567890",
        discount_percentage=Decimal("10.00"),
    )
    buyer = await user_factory(
        email="buyer@acmelabs.com",
        first_name="Buyer",
        last_name="One",
        is_verified=True,
        role=UserRole.CUSTOMER,
        company_id=company.id,
    )
    manager = await user_factory(
        email="manager@acmelabs.com",
        first_name="Manager",
        last_name="Admin",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
        company_id=company.id,
    )
    return company, buyer, manager


@pytest_asyncio.fixture
async def product_b2c(product_factory):
    return await product_factory(
        name="B2C Product",
        base_price=Decimal("100.00"),
        stock_quantity=20,
        is_active=True,
        is_b2b_only=False,
    )


@pytest_asyncio.fixture
async def company_shipping_address(db_session: AsyncSession, company_and_buyer):
    company, _, _ = company_and_buyer
    address = Address(
        company_id=company.id,
        address_type=AddressType.SHIPPING,
        street="Business St 1",
        city="Warsaw",
        postal_code="00-001",
        country="Poland",
    )
    db_session.add(address)
    await db_session.commit()
    return address


@pytest_asyncio.fixture
async def company_billing_address(db_session: AsyncSession, company_and_buyer):
    company, _, _ = company_and_buyer
    address = Address(
        company_id=company.id,
        address_type=AddressType.BILLING,
        street="HQ Ave 10",
        city="Warsaw",
        postal_code="00-555",
        country="Poland",
    )
    db_session.add(address)
    await db_session.commit()
    return address


async def _place_b2b_order(
    async_client: AsyncClient,
    db_session: AsyncSession,
    buyer,
    product,
    shipping_address,
    auth_headers,
):
    await _add_to_cart(db_session, buyer.id, product.id, 1)
    payload = {
        "product_ids": [str(product.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "COMPANY_INVOICE"},
        "address_id": str(shipping_address.id),
        **_SHIPPING_DEFAULTS,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 201, resp.text
    return resp.json()


async def _place_b2c_order(
    async_client: AsyncClient,
    db_session: AsyncSession,
    user,
    product,
    auth_headers,
):
    await _add_to_cart(db_session, user.id, product.id, 1)
    payload = {
        "product_ids": [str(product.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
        **_SHIPPING_DEFAULTS,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(user))
    assert resp.status_code == 201, resp.text
    return resp.json()


@pytest.mark.asyncio
async def test_b2b_order_snapshots_company_id(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    company, buyer, _ = company_and_buyer
    data = await _place_b2b_order(
        async_client,
        db_session,
        buyer,
        product_b2c,
        company_shipping_address,
        auth_headers,
    )
    assert data["company_id"] == str(company.id)
    assert data["purchase_type"] == "B2B"


@pytest.mark.asyncio
async def test_b2c_order_has_null_company_id(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    data = await _place_b2c_order(
        async_client, db_session, buyer, product_b2c, auth_headers
    )
    assert data["company_id"] is None
    assert data["purchase_type"] == "B2C"


@pytest.mark.asyncio
async def test_list_company_orders_returns_company_b2b_only(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    user_factory,
    company_factory,
    auth_headers,
):
    company, buyer, manager = company_and_buyer
    other = await company_factory(nip="9999999999", name="Other Co")
    other_admin = await user_factory(
        email="other-admin@test.com",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
        company_id=other.id,
    )
    other_ship = Address(
        company_id=other.id,
        address_type=AddressType.SHIPPING,
        street="Other St",
        city="Lodz",
        postal_code="90-001",
        country="Poland",
    )
    other_bill = Address(
        company_id=other.id,
        address_type=AddressType.BILLING,
        street="Other HQ",
        city="Lodz",
        postal_code="90-002",
        country="Poland",
    )
    db_session.add_all([other_ship, other_bill])
    await db_session.commit()

    own = await _place_b2b_order(
        async_client,
        db_session,
        buyer,
        product_b2c,
        company_shipping_address,
        auth_headers,
    )
    await _place_b2c_order(async_client, db_session, buyer, product_b2c, auth_headers)
    await _place_b2b_order(
        async_client, db_session, other_admin, product_b2c, other_ship, auth_headers
    )

    resp = await async_client.get(
        "/companies/orders", headers=auth_headers(manager)
    )
    assert resp.status_code == 200
    orders = resp.json()
    assert len(orders) == 1
    assert orders[0]["id"] == own["id"]
    assert orders[0]["placed_by"]["email"] == buyer.email
    assert orders[0]["placed_by"]["first_name"] == "Buyer"
    assert orders[0]["company_id"] == str(company.id)


@pytest.mark.asyncio
async def test_list_company_orders_customer_forbidden(
    async_client: AsyncClient,
    company_and_buyer,
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    resp = await async_client.get("/companies/orders", headers=auth_headers(buyer))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_get_company_order_detail(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    _, buyer, manager = company_and_buyer
    created = await _place_b2b_order(
        async_client,
        db_session,
        buyer,
        product_b2c,
        company_shipping_address,
        auth_headers,
    )

    resp = await async_client.get(
        f"/companies/orders/{created['id']}", headers=auth_headers(manager)
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == created["id"]
    assert data["placed_by"]["email"] == buyer.email
    assert len(data["items"]) == 1
    assert data["billing_document"]["document_type"] == "COMPANY_INVOICE"


@pytest.mark.asyncio
async def test_get_company_order_other_company_not_found(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    user_factory,
    company_factory,
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    other = await company_factory(nip="8888888888", name="Stranger Co")
    other_admin = await user_factory(
        email="stranger-admin@test.com",
        is_verified=True,
        role=UserRole.COMPANY_ADMIN,
        company_id=other.id,
    )
    created = await _place_b2b_order(
        async_client,
        db_session,
        buyer,
        product_b2c,
        company_shipping_address,
        auth_headers,
    )

    resp = await async_client.get(
        f"/companies/orders/{created['id']}", headers=auth_headers(other_admin)
    )
    assert resp.status_code == 404
