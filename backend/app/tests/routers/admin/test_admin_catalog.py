import pytest
from app.models.enums import UserRole


@pytest.mark.asyncio
async def test_list_products_requires_admin(
    async_client, user_factory, product_factory, auth_headers
):
    await product_factory(name="Visible Product")
    customer = await user_factory(
        email="customer-admin-catalog@test.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
    )

    response = await async_client.get(
        "/admin/products",
        headers=auth_headers(customer),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_list_products_includes_inactive(
    async_client, user_factory, product_factory, auth_headers
):
    active = await product_factory(name="Active Widget", is_active=True)
    inactive = await product_factory(name="Inactive Widget", is_active=False)
    admin = await user_factory(
        email="admin-catalog-list@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.get(
        "/admin/products",
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    data = response.json()
    ids = {item["id"] for item in data}
    assert str(active.id) in ids
    assert str(inactive.id) in ids

    inactive_row = next(item for item in data if item["id"] == str(inactive.id))
    assert inactive_row["is_active"] is False
    assert inactive_row["name"] == "Inactive Widget"
    assert "category" in inactive_row
    assert inactive_row["category"]["name"]


@pytest.mark.asyncio
async def test_get_product_for_admin(
    async_client, user_factory, product_factory, auth_headers
):
    product = await product_factory(
        name="Detail Product",
        description="Admin detail body",
        is_active=False,
    )
    admin = await user_factory(
        email="admin-catalog-detail@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.get(
        f"/admin/products/{product.id}",
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == str(product.id)
    assert data["name"] == "Detail Product"
    assert data["description"] == "Admin detail body"
    assert data["is_active"] is False
    assert data["category"]["id"]


@pytest.mark.asyncio
async def test_get_product_not_found(
    async_client, user_factory, auth_headers
):
    admin = await user_factory(
        email="admin-catalog-404@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    missing_id = "00000000-0000-0000-0000-000000000001"

    response = await async_client.get(
        f"/admin/products/{missing_id}",
        headers=auth_headers(admin),
    )
    assert response.status_code == 404
