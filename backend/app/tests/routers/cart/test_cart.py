from decimal import Decimal

import pytest
from app.models.product import Category, Product
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
async def setup_products(db_session: AsyncSession):
    category = Category(name="Lab", slug="lab")
    db_session.add(category)
    await db_session.flush()

    b2c = Product(
        name="B2C Product",
        slug="b2c-product",
        sku="B2C-001",
        category_id=category.id,
        base_price=Decimal("10.00"),
        stock_quantity=10,
        is_active=True,
        is_b2b_only=False,
    )
    b2b = Product(
        name="B2B Product",
        slug="b2b-product",
        sku="B2B-001",
        category_id=category.id,
        base_price=Decimal("50.00"),
        stock_quantity=5,
        is_active=True,
        is_b2b_only=True,
    )
    low_stock = Product(
        name="Low Stock Product",
        slug="low-stock-product",
        sku="LOW-001",
        category_id=category.id,
        base_price=Decimal("20.00"),
        stock_quantity=2,
        is_active=True,
        is_b2b_only=False,
    )
    inactive = Product(
        name="Inactive Product",
        slug="inactive-product",
        sku="INA-001",
        category_id=category.id,
        base_price=Decimal("15.00"),
        stock_quantity=100,
        is_active=False,
        is_b2b_only=False,
    )
    db_session.add_all([b2c, b2b, low_stock, inactive])
    await db_session.commit()

    return {"b2c": b2c, "b2b": b2b, "low_stock": low_stock, "inactive": inactive}


# ---------------------------------------------------------------------------
# GET /cart
# ---------------------------------------------------------------------------


async def test_get_cart_unauthenticated(async_client: AsyncClient):
    response = await async_client.get("/cart")
    assert response.status_code == 401


async def test_get_cart_empty(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    user = await user_factory(email="cart_empty@example.com", is_verified=True)
    response = await async_client.get("/cart", headers=auth_headers(user))
    assert response.status_code == 200
    assert response.json() == []


async def test_get_cart_returns_snapshots(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="cart_snap@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 2}, headers=headers)

    response = await async_client.get("/cart", headers=headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["quantity"] == 2
    assert data[0]["product"]["id"] == str(b2c.id)
    assert "is_active" in data[0]["product"]


# ---------------------------------------------------------------------------
# POST /cart/items
# ---------------------------------------------------------------------------


async def test_add_item_creates_new_entry(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="add_new@example.com", is_verified=True)
    b2c = setup_products["b2c"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(b2c.id), "quantity": 3},
        headers=auth_headers(user),
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["quantity"] == 3


async def test_add_item_increments_existing(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="add_incr@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 3}, headers=headers)
    response = await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 2}, headers=headers)

    assert response.status_code == 200
    assert response.json()[0]["quantity"] == 5


async def test_add_item_b2b_without_company_returns_403(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="b2b_no_co@example.com", is_verified=True, company_id=None)
    b2b = setup_products["b2b"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(b2b.id), "quantity": 1},
        headers=auth_headers(user),
    )
    assert response.status_code == 403
    assert "company" in response.json()["detail"].lower()


async def test_add_item_b2b_with_company_succeeds(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    company_factory,
    setup_products,
):
    company = await company_factory()
    user = await user_factory(email="b2b_with_co@example.com", is_verified=True, company_id=company.id)
    b2b = setup_products["b2b"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(b2b.id), "quantity": 1},
        headers=auth_headers(user),
    )
    assert response.status_code == 200


async def test_add_item_exceeds_stock_returns_400(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="exceed_stock@example.com", is_verified=True)
    low_stock = setup_products["low_stock"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(low_stock.id), "quantity": 99},
        headers=auth_headers(user),
    )
    assert response.status_code == 400
    assert "stock" in response.json()["detail"].lower()


async def test_add_item_inactive_product_returns_400(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="add_inactive@example.com", is_verified=True)
    inactive = setup_products["inactive"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(inactive.id), "quantity": 1},
        headers=auth_headers(user),
    )
    assert response.status_code == 400
    assert "not available" in response.json()["detail"].lower()


async def test_add_item_nonexistent_product_returns_404(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
):
    import uuid
    user = await user_factory(email="add_ghost@example.com", is_verified=True)

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(uuid.uuid4()), "quantity": 1},
        headers=auth_headers(user),
    )
    assert response.status_code == 404


async def test_add_item_quantity_less_than_1_returns_422(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="qty_zero@example.com", is_verified=True)
    b2c = setup_products["b2c"]

    response = await async_client.post(
        "/cart/items",
        json={"product_id": str(b2c.id), "quantity": 0},
        headers=auth_headers(user),
    )
    assert response.status_code == 422


# ---------------------------------------------------------------------------
# PATCH /cart/items/{product_id}
# ---------------------------------------------------------------------------


async def test_set_quantity_ok(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="set_qty@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 3}, headers=headers)
    response = await async_client.patch(f"/cart/items/{b2c.id}", json={"quantity": 7}, headers=headers)

    assert response.status_code == 200
    assert response.json()[0]["quantity"] == 7


async def test_set_quantity_exceeds_stock_returns_400(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="set_qty_stock@example.com", is_verified=True)
    headers = auth_headers(user)
    low_stock = setup_products["low_stock"]

    await async_client.post("/cart/items", json={"product_id": str(low_stock.id), "quantity": 1}, headers=headers)
    response = await async_client.patch(f"/cart/items/{low_stock.id}", json={"quantity": 99}, headers=headers)

    assert response.status_code == 400


async def test_set_quantity_less_than_1_returns_422(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="set_qty_zero@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 1}, headers=headers)
    response = await async_client.patch(f"/cart/items/{b2c.id}", json={"quantity": 0}, headers=headers)

    assert response.status_code == 422


# ---------------------------------------------------------------------------
# DELETE /cart/items/{product_id}
# ---------------------------------------------------------------------------


async def test_remove_item(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="remove_item@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 1}, headers=headers)
    response = await async_client.delete(f"/cart/items/{b2c.id}", headers=headers)

    assert response.status_code == 200
    assert response.json()["message"] == "Item removed from cart"

    cart = await async_client.get("/cart", headers=headers)
    assert cart.json() == []


# ---------------------------------------------------------------------------
# DELETE /cart
# ---------------------------------------------------------------------------


async def test_clear_cart(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="clear_cart@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]
    low_stock = setup_products["low_stock"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 1}, headers=headers)
    await async_client.post("/cart/items", json={"product_id": str(low_stock.id), "quantity": 1}, headers=headers)

    response = await async_client.delete("/cart", headers=headers)
    assert response.status_code == 200

    cart = await async_client.get("/cart", headers=headers)
    assert cart.json() == []


# ---------------------------------------------------------------------------
# POST /cart/merge
# ---------------------------------------------------------------------------


async def test_merge_sums_quantities(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="merge_sum@example.com", is_verified=True)
    headers = auth_headers(user)
    b2c = setup_products["b2c"]

    await async_client.post("/cart/items", json={"product_id": str(b2c.id), "quantity": 3}, headers=headers)
    response = await async_client.post(
        "/cart/merge",
        json=[{"product_id": str(b2c.id), "quantity": 4}],
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()[0]["quantity"] == 7


async def test_merge_clips_to_stock(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="merge_clip@example.com", is_verified=True)
    headers = auth_headers(user)
    low_stock = setup_products["low_stock"]  # stock=2

    response = await async_client.post(
        "/cart/merge",
        json=[{"product_id": str(low_stock.id), "quantity": 99}],
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json()[0]["quantity"] == 2


async def test_merge_skips_inactive(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="merge_inactive@example.com", is_verified=True)
    headers = auth_headers(user)
    inactive = setup_products["inactive"]

    response = await async_client.post(
        "/cart/merge",
        json=[{"product_id": str(inactive.id), "quantity": 1}],
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == []


async def test_merge_skips_b2b_without_company(
    async_client: AsyncClient,
    user_factory,
    auth_headers,
    setup_products,
):
    user = await user_factory(email="merge_b2b@example.com", is_verified=True, company_id=None)
    headers = auth_headers(user)
    b2b = setup_products["b2b"]

    response = await async_client.post(
        "/cart/merge",
        json=[{"product_id": str(b2b.id), "quantity": 1}],
        headers=headers,
    )

    assert response.status_code == 200
    assert response.json() == []


# ---------------------------------------------------------------------------
# GET /catalog/products/batch
# ---------------------------------------------------------------------------


async def test_batch_returns_requested_products(
    async_client: AsyncClient,
    setup_products,
):
    b2c = setup_products["b2c"]
    inactive = setup_products["inactive"]

    response = await async_client.get(f"/catalog/products/batch?ids={b2c.id},{inactive.id}")
    assert response.status_code == 200
    data = response.json()
    ids = {item["id"] for item in data}
    assert str(b2c.id) in ids
    assert str(inactive.id) in ids


async def test_batch_returns_inactive_with_flag(
    async_client: AsyncClient,
    setup_products,
):
    inactive = setup_products["inactive"]

    response = await async_client.get(f"/catalog/products/batch?ids={inactive.id}")
    assert response.status_code == 200
    data = response.json()
    assert data[0]["is_active"] is False


async def test_batch_empty_ids_returns_empty(async_client: AsyncClient):
    response = await async_client.get("/catalog/products/batch?ids=")
    assert response.status_code == 200
    assert response.json() == []
