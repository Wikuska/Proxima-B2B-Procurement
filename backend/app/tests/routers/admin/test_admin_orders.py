"""Platform admin order list / detail / advance-status."""

from decimal import Decimal

import pytest
import pytest_asyncio
from app.models.enums import UserRole
from app.models.order import CartItem
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

_SHIPPING_DEFAULTS = {
    "delivery_method": "COURIER",
    "payment_method": "CASH_ON_DELIVERY",
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
    db.add(CartItem(user_id=user_id, product_id=product_id, quantity=qty))
    await db.commit()


@pytest_asyncio.fixture
async def b2c_user(user_factory):
    return await user_factory(
        email="admin-orders-b2c@example.com",
        first_name="Ada",
        last_name="Buyer",
        is_verified=True,
        role=UserRole.CUSTOMER,
    )


@pytest_asyncio.fixture
async def product_b2c(product_factory):
    return await product_factory(
        name="Admin Orders Product",
        base_price=Decimal("50.00"),
        stock_quantity=20,
        is_active=True,
        is_b2b_only=False,
    )


async def _create_cod_order(async_client, db_session, user, product, auth_headers):
    await _add_to_cart(db_session, user.id, product.id, 1)
    resp = await async_client.post(
        "/orders",
        json={
            "product_ids": [str(product.id)],
            "purchase_type": "B2C",
            "document": {"document_type": "RECEIPT"},
            "shipping_address": _INLINE_ADDR,
            **_SHIPPING_DEFAULTS,
        },
        headers=auth_headers(user),
    )
    assert resp.status_code == 201
    return resp.json()


@pytest.mark.asyncio
async def test_list_admin_orders_requires_admin(
    async_client: AsyncClient, b2c_user, auth_headers
):
    resp = await async_client.get(
        "/admin/orders", headers=auth_headers(b2c_user)
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_list_admin_orders_includes_all(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    admin = await user_factory(
        email="admin-orders-list@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    created = await _create_cod_order(
        async_client, db_session, b2c_user, product_b2c, auth_headers
    )

    resp = await async_client.get(
        "/admin/orders", headers=auth_headers(admin)
    )
    assert resp.status_code == 200
    data = resp.json()
    ids = {row["id"] for row in data}
    assert created["id"] in ids
    row = next(r for r in data if r["id"] == created["id"])
    assert row["status"] == "PREPARING"
    assert row["placed_by"]["email"] == b2c_user.email
    assert row["item_count"] == 1


@pytest.mark.asyncio
async def test_get_admin_order_detail(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    admin = await user_factory(
        email="admin-orders-detail@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    created = await _create_cod_order(
        async_client, db_session, b2c_user, product_b2c, auth_headers
    )

    resp = await async_client.get(
        f"/admin/orders/{created['id']}",
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == created["id"]
    assert data["billing_document"]["document_type"] == "RECEIPT"
    assert data["shipment"]["recipient_name"] == "Jan Kowalski"
    assert len(data["items"]) == 1
    assert data["placed_by"]["email"] == b2c_user.email


@pytest.mark.asyncio
async def test_admin_advance_status_via_admin_route(
    async_client: AsyncClient,
    db_session: AsyncSession,
    b2c_user,
    product_b2c,
    auth_headers,
    user_factory,
):
    admin = await user_factory(
        email="admin-orders-advance@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    created = await _create_cod_order(
        async_client, db_session, b2c_user, product_b2c, auth_headers
    )
    assert created["status"] == "PREPARING"

    resp = await async_client.post(
        f"/admin/orders/{created['id']}/advance-status",
        headers=auth_headers(admin),
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "SHIPPED"
    assert resp.json()["placed_by"]["email"] == b2c_user.email


@pytest.mark.asyncio
async def test_get_admin_order_not_found(
    async_client: AsyncClient, auth_headers, user_factory
):
    admin = await user_factory(
        email="admin-orders-404@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    missing = "00000000-0000-0000-0000-000000000099"
    resp = await async_client.get(
        f"/admin/orders/{missing}",
        headers=auth_headers(admin),
    )
    assert resp.status_code == 404
