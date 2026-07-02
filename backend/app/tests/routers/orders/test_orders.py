"""Order creation and retrieval tests — Phase 2 (BillingDocument)."""
from decimal import Decimal

import pytest
import pytest_asyncio
from app.models.enums import AddressType, UserRole
from app.models.order import Address, CartItem
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest_asyncio.fixture
async def b2c_user(user_factory):
    return await user_factory(
        email="b2c@example.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
    )


@pytest_asyncio.fixture
async def company_and_buyer(user_factory, company_factory):
    company = await company_factory(
        name="Acme Labs",
        nip="1234567890",
        discount_percentage=Decimal("10.00"),
    )
    buyer = await user_factory(
        email="buyer@acmelabs.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
        company_id=company.id,
    )
    manager = await user_factory(
        email="manager@acmelabs.com",
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
        stock_quantity=10,
        is_active=True,
        is_b2b_only=False,
    )


@pytest_asyncio.fixture
async def product_b2b(product_factory):
    return await product_factory(
        name="B2B Product",
        base_price=Decimal("200.00"),
        stock_quantity=5,
        is_active=True,
        is_b2b_only=True,
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


@pytest_asyncio.fixture
async def personal_address(db_session: AsyncSession, b2c_user):
    address = Address(
        user_id=b2c_user.id,
        address_type=AddressType.SHIPPING,
        street="Home St 5",
        city="Krakow",
        postal_code="30-001",
        country="Poland",
    )
    db_session.add(address)
    await db_session.commit()
    return address


_INLINE_ADDR = {
    "street": "New St 10",
    "city": "Gdansk",
    "postal_code": "80-001",
    "country": "Poland",
}

_INLINE_BILLING_ADDR = {
    "billing_street": "Billing Rd 3",
    "billing_city": "Poznan",
    "billing_postal_code": "60-001",
    "billing_country": "Poland",
}


async def _add_to_cart(db: AsyncSession, user_id, product_id, qty: int):
    item = CartItem(user_id=user_id, product_id=product_id, quantity=qty)
    db.add(item)
    await db.commit()


# ---------------------------------------------------------------------------
# B2C — RECEIPT
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2c_receipt_order_inline_address(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 2)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
        "save_address": True,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    data = resp.json()
    assert data["purchase_type"] == "B2C"
    assert data["status"] == "PENDING_PAYMENT"
    assert data["billing_document"]["document_type"] == "RECEIPT"
    assert data["billing_document"]["company_nip"] is None
    assert data["billing_document"]["first_name"] is None
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert Decimal(data["total_amount"]) == Decimal("200.00")

    # Cart cleared
    cart_resp = await async_client.get("/cart", headers=auth_headers(b2c_user))
    assert cart_resp.json() == []

    # Stock decremented
    from app.crud.product import get_product_by_id
    p = await get_product_by_id(db_session, product_b2c.id)
    assert p.stock_quantity == 8


@pytest.mark.asyncio
async def test_b2c_receipt_order_saved_personal_address(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    personal_address,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "address_id": str(personal_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    assert resp.json()["shipping_street"] == "Home St 5"


# ---------------------------------------------------------------------------
# B2C — PERSONAL_INVOICE
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2c_personal_invoice_order(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {
            "document_type": "PERSONAL_INVOICE",
            "first_name": "Anna",
            "last_name": "Nowak",
            **_INLINE_BILLING_ADDR,
        },
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    doc = resp.json()["billing_document"]
    assert doc["document_type"] == "PERSONAL_INVOICE"
    assert doc["first_name"] == "Anna"
    assert doc["last_name"] == "Nowak"
    assert doc["billing_city"] == "Poznan"
    assert doc["company_nip"] is None


# ---------------------------------------------------------------------------
# B2C — COMPANY_INVOICE (manual, no B2B access)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2c_company_invoice_manual_data(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {
            "document_type": "COMPANY_INVOICE",
            "company_name": "External Corp",
            "company_nip": "9999999999",
            **_INLINE_BILLING_ADDR,
        },
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    doc = resp.json()["billing_document"]
    assert doc["document_type"] == "COMPANY_INVOICE"
    assert doc["company_name"] == "External Corp"
    assert doc["company_nip"] == "9999999999"
    # No B2B discount — base price only
    assert Decimal(resp.json()["total_amount"]) == Decimal("100.00")


# ---------------------------------------------------------------------------
# B2B (COMPANY mode) — COMPANY_INVOICE forced from company data
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_company_mode_order_forces_company_invoice(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    company, buyer, _ = company_and_buyer
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 3)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "RECEIPT"},  # ignored — forced to COMPANY_INVOICE
        "address_id": str(company_shipping_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))

    assert resp.status_code == 201
    data = resp.json()
    assert data["purchase_type"] == "B2B"
    doc = data["billing_document"]
    assert doc["document_type"] == "COMPANY_INVOICE"
    assert doc["company_nip"] == company.nip
    assert doc["company_name"] == company.name
    assert doc["billing_street"] == "HQ Ave 10"
    # Company 10% discount applied
    assert Decimal(data["total_amount"]) == Decimal("270.00")


# ---------------------------------------------------------------------------
# B2B-only product restrictions
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2b_only_product_in_b2c_returns_403(
    async_client: AsyncClient,
    db_session: AsyncSession,
    product_b2b,
    auth_headers,
    user_factory,
):
    solo_user = await user_factory(
        email="solo@example.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
    )
    await _add_to_cart(db_session, solo_user.id, product_b2b.id, 1)

    payload = {
        "product_ids": [str(product_b2b.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(solo_user))
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_b2b_only_product_in_company_mode_ok(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2b,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    await _add_to_cart(db_session, buyer.id, product_b2b.id, 1)

    payload = {
        "product_ids": [str(product_b2b.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "COMPANY_INVOICE"},
        "address_id": str(company_shipping_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 201


# ---------------------------------------------------------------------------
# Billing validation errors
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_personal_invoice_missing_name_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {
            "document_type": "PERSONAL_INVOICE",
            # missing first_name and last_name
            **_INLINE_BILLING_ADDR,
        },
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_company_invoice_missing_billing_address_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {
            "document_type": "COMPANY_INVOICE",
            "company_name": "Some Corp",
            "company_nip": "1111111111",
            # missing billing address
        },
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_company_mode_no_billing_address_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    # intentionally no company_billing_address fixture
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "COMPANY_INVOICE"},
        "address_id": str(company_shipping_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# Snapshot integrity
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_order_snapshot_prices_correct(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 201
    item = resp.json()["items"][0]
    assert Decimal(item["unit_price"]) == product_b2c.base_price
    assert Decimal(item["discount_percentage"]) == Decimal("0.00")
    assert Decimal(resp.json()["total_amount"]) == product_b2c.base_price

    # Every order has exactly one BillingDocument
    assert resp.json()["billing_document"] is not None
    assert resp.json()["billing_document"]["id"] is not None


# ---------------------------------------------------------------------------
# Insufficient stock
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_insufficient_stock_returns_400_no_order_created(
    async_client: AsyncClient,
    db_session: AsyncSession,
    product_b2c,
    product_b2b,
    company_and_buyer,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    _, buyer, _ = company_and_buyer
    # product_b2b stock=5; request qty=6 → should fail
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 2)
    await _add_to_cart(db_session, buyer.id, product_b2b.id, 6)

    payload = {
        "product_ids": [str(product_b2c.id), str(product_b2b.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "COMPANY_INVOICE"},
        "address_id": str(company_shipping_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 400

    # No order must have been committed
    orders_resp = await async_client.get("/orders", headers=auth_headers(buyer))
    assert orders_resp.json() == []


# ---------------------------------------------------------------------------
# List / detail — access control
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_list_orders_returns_own_only(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    other = await user_factory(email="other@example.com", is_verified=True)
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    resp = await async_client.get("/orders", headers=auth_headers(other))
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_get_order_detail_own(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)
    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    create_resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    order_id = create_resp.json()["id"]

    resp = await async_client.get(f"/orders/{order_id}", headers=auth_headers(b2c_user))
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id
    assert resp.json()["billing_document"] is not None


@pytest.mark.asyncio
async def test_get_order_detail_other_user_returns_404(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    other = await user_factory(email="intruder@example.com", is_verified=True)
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)
    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    create_resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    order_id = create_resp.json()["id"]

    resp = await async_client.get(f"/orders/{order_id}", headers=auth_headers(other))
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_orders_require_auth(async_client: AsyncClient):
    resp = await async_client.get("/orders")
    assert resp.status_code == 401

    resp = await async_client.post("/orders", json={})
    assert resp.status_code == 401


# ---------------------------------------------------------------------------
# GET /orders?purchase_type= filtering
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_orders_filter_by_purchase_type(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_shipping_address,
    company_billing_address,
    auth_headers,
):
    """B2C and B2B orders are created; ?purchase_type= returns only matching ones."""
    _, buyer, _ = company_and_buyer

    # Place a B2C order
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 1)
    b2c_payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    await async_client.post("/orders", json=b2c_payload, headers=auth_headers(buyer))

    # Place a B2B order
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 1)
    b2b_payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "document": {"document_type": "COMPANY_INVOICE"},
        "address_id": str(company_shipping_address.id),
    }
    await async_client.post("/orders", json=b2b_payload, headers=auth_headers(buyer))

    # No filter → both orders
    all_resp = await async_client.get("/orders", headers=auth_headers(buyer))
    assert all_resp.status_code == 200
    assert len(all_resp.json()) == 2

    # Filter B2C
    b2c_resp = await async_client.get("/orders?purchase_type=B2C", headers=auth_headers(buyer))
    assert b2c_resp.status_code == 200
    b2c_orders = b2c_resp.json()
    assert len(b2c_orders) == 1
    assert b2c_orders[0]["purchase_type"] == "B2C"

    # Filter B2B
    b2b_resp = await async_client.get("/orders?purchase_type=B2B", headers=auth_headers(buyer))
    assert b2b_resp.status_code == 200
    b2b_orders = b2b_resp.json()
    assert len(b2b_orders) == 1
    assert b2b_orders[0]["purchase_type"] == "B2B"


@pytest.mark.asyncio
async def test_get_orders_filter_returns_own_only(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    """Filtered results still respect user ownership."""
    other = await user_factory(email="other2@example.com", is_verified=True)
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)
    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "document": {"document_type": "RECEIPT"},
        "shipping_address": _INLINE_ADDR,
    }
    await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    resp = await async_client.get("/orders?purchase_type=B2C", headers=auth_headers(other))
    assert resp.status_code == 200
    assert resp.json() == []
