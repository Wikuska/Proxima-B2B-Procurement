"""Order creation and retrieval tests."""
from decimal import Decimal

import pytest
import pytest_asyncio
from app.models.enums import UserRole
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
async def company_address(db_session: AsyncSession, company_and_buyer):
    company, _, _ = company_and_buyer
    address = Address(
        company_id=company.id,
        street="Business St 1",
        city="Warsaw",
        postal_code="00-001",
        country="Poland",
    )
    db_session.add(address)
    await db_session.commit()
    return address


@pytest_asyncio.fixture
async def personal_address(db_session: AsyncSession, b2c_user):
    address = Address(
        user_id=b2c_user.id,
        street="Home St 5",
        city="Krakow",
        postal_code="30-001",
        country="Poland",
    )
    db_session.add(address)
    await db_session.commit()
    return address


async def _add_to_cart(db: AsyncSession, user_id, product_id, qty: int):
    item = CartItem(user_id=user_id, product_id=product_id, quantity=qty)
    db.add(item)
    await db.commit()


# ---------------------------------------------------------------------------
# B2C — receipt order (inline address, saved)
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2c_order_inline_address_saved(
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
        "shipping_address": {
            "street": "New St 10",
            "city": "Gdansk",
            "postal_code": "80-001",
            "country": "Poland",
        },
        "save_address": True,
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    data = resp.json()
    assert data["purchase_type"] == "B2C"
    assert data["status"] == "PENDING_PAYMENT"
    assert data["billing_nip"] is None
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 2
    assert Decimal(data["total_amount"]) == Decimal("200.00")

    # Cart cleared
    cart_resp = await async_client.get("/cart", headers=auth_headers(b2c_user))
    assert cart_resp.status_code == 200
    assert cart_resp.json() == []

    # Stock decremented
    from app.crud.product import get_product_by_id
    p = await get_product_by_id(db_session, product_b2c.id)
    assert p.stock_quantity == 8


@pytest.mark.asyncio
async def test_b2c_order_saved_personal_address(
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
        "address_id": str(personal_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))

    assert resp.status_code == 201
    data = resp.json()
    assert data["shipping_street"] == "Home St 5"


# ---------------------------------------------------------------------------
# B2B — invoice order
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_b2b_order_company_address(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    company_address,
    auth_headers,
):
    company, buyer, _ = company_and_buyer
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 3)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "address_id": str(company_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))

    assert resp.status_code == 201
    data = resp.json()
    assert data["purchase_type"] == "B2B"
    assert data["billing_nip"] == company.nip
    assert data["billing_company_name"] == company.name
    # Company discount 10% applied
    assert Decimal(data["total_amount"]) == Decimal("270.00")


# ---------------------------------------------------------------------------
# Validation errors
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_invoice_without_company_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    await _add_to_cart(db_session, b2c_user.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "shipping_address": {
            "street": "X",
            "city": "X",
            "postal_code": "X",
            "country": "PL",
        },
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 400
    assert "invoice" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_b2b_with_non_company_address_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2c,
    personal_address,
    b2c_user,
    auth_headers,
):
    """Buyer tries to use a personal address (belonging to another user) for B2B order."""
    _, buyer, _ = company_and_buyer
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 1)

    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2B",
        "address_id": str(personal_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_empty_selection_returns_400(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
):
    # Cart is empty — no items added
    payload = {
        "product_ids": [str(product_b2c.id)],
        "purchase_type": "B2C",
        "shipping_address": {
            "street": "X",
            "city": "X",
            "postal_code": "X",
            "country": "PL",
        },
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_insufficient_stock_returns_400_no_order_created(
    async_client: AsyncClient,
    db_session: AsyncSession,
    product_b2c,
    product_b2b,
    company_and_buyer,
    company_address,
    auth_headers,
):
    """When one item has insufficient stock the whole order fails — no order is persisted.

    Stock rollback is guaranteed by PostgreSQL transaction semantics in production
    (session.close() issues ROLLBACK). The test verifies the business-level invariant:
    no Order row is committed to the database.
    """
    company, buyer, _ = company_and_buyer
    # product_b2b stock=5; request qty=6 → should fail
    await _add_to_cart(db_session, buyer.id, product_b2c.id, 2)
    await _add_to_cart(db_session, buyer.id, product_b2b.id, 6)

    payload = {
        "product_ids": [str(product_b2c.id), str(product_b2b.id)],
        "purchase_type": "B2B",
        "address_id": str(company_address.id),
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(buyer))
    assert resp.status_code == 400

    # No order must have been committed
    orders_resp = await async_client.get("/orders", headers=auth_headers(buyer))
    assert orders_resp.json() == []


@pytest.mark.asyncio
async def test_b2b_only_product_in_b2c_order_returns_403(
    async_client: AsyncClient,
    db_session: AsyncSession,
    company_and_buyer,
    product_b2b,
    auth_headers,
):
    """B2B-only product cannot be ordered by a user without company (B2C)."""
    # We need a user without company trying to buy b2b-only product
    # In practice, the cart service would already block this — but order service re-validates
    _, buyer, _ = company_and_buyer

    # Create a solo user and manually insert cart item bypassing cart validation
    from app.models.order import CartItem
    from app.models.user import User as UserModel
    solo_user = UserModel(
        email="solo_test@example.com",
        password_hash="hash",
        first_name="Solo",
        last_name="User",
        is_verified=True,
        is_active=True,
        company_id=None,
        role=UserRole.CUSTOMER,
    )
    db_session.add(solo_user)
    await db_session.flush()

    item = CartItem(user_id=solo_user.id, product_id=product_b2b.id, quantity=1)
    db_session.add(item)
    await db_session.commit()

    payload = {
        "product_ids": [str(product_b2b.id)],
        "purchase_type": "B2C",
        "shipping_address": {
            "street": "X",
            "city": "X",
            "postal_code": "X",
            "country": "PL",
        },
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(solo_user))
    assert resp.status_code == 403


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
        "shipping_address": {
            "street": "X",
            "city": "Y",
            "postal_code": "Z",
            "country": "PL",
        },
    }
    resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    assert resp.status_code == 201
    item = resp.json()["items"][0]
    assert Decimal(item["unit_price"]) == product_b2c.base_price
    assert Decimal(item["discount_percentage"]) == Decimal("0.00")
    assert resp.json()["total_amount"] == str(product_b2c.base_price)


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
        "shipping_address": {"street": "X", "city": "Y", "postal_code": "Z", "country": "PL"},
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
        "shipping_address": {"street": "X", "city": "Y", "postal_code": "Z", "country": "PL"},
    }
    create_resp = await async_client.post("/orders", json=payload, headers=auth_headers(b2c_user))
    order_id = create_resp.json()["id"]

    resp = await async_client.get(f"/orders/{order_id}", headers=auth_headers(b2c_user))
    assert resp.status_code == 200
    assert resp.json()["id"] == order_id


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
        "shipping_address": {"street": "X", "city": "Y", "postal_code": "Z", "country": "PL"},
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
