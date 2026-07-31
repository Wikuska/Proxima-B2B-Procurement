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


@pytest.mark.asyncio
async def test_create_product(
    async_client, user_factory, product_factory, auth_headers
):
    seed = await product_factory(name="Seed For Category")
    admin = await user_factory(
        email="admin-catalog-create@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "New Pipette Set",
            "sku": "PIP-NEW-001",
            "category_id": str(seed.category_id),
            "description": "A fine pipette set",
            "base_price": "49.99",
            "stock_quantity": 25,
            "main_image_url": None,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Pipette Set"
    assert data["sku"] == "PIP-NEW-001"
    assert data["slug"] == "new-pipette-set"
    assert data["base_price"] == "49.99"
    assert data["stock_quantity"] == 25
    assert data["category"]["id"] == str(seed.category_id)
    assert data["volume_discounts"] == []


@pytest.mark.asyncio
async def test_create_product_with_volume_discounts(
    async_client, user_factory, product_factory, auth_headers
):
    seed = await product_factory(name="Volume Seed")
    admin = await user_factory(
        email="admin-catalog-vol-create@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Bulk Reagent",
            "sku": "VOL-NEW-1",
            "category_id": str(seed.category_id),
            "base_price": "100.00",
            "stock_quantity": 200,
            "is_active": True,
            "is_b2b_only": False,
            "volume_discounts": [
                {"min_quantity": 50, "discount_percentage": "15.00"},
                {"min_quantity": 10, "discount_percentage": "5.00"},
            ],
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    tiers = response.json()["volume_discounts"]
    assert [t["min_quantity"] for t in tiers] == [10, 50]
    assert tiers[0]["discount_percentage"] == "5.00"
    assert tiers[1]["discount_percentage"] == "15.00"


@pytest.mark.asyncio
async def test_create_product_duplicate_volume_min_quantity_rejected(
    async_client, user_factory, product_factory, auth_headers
):
    seed = await product_factory(name="Dup Vol Seed")
    admin = await user_factory(
        email="admin-catalog-vol-dup@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Bad Tiers",
            "sku": "VOL-DUP-1",
            "category_id": str(seed.category_id),
            "base_price": "10.00",
            "stock_quantity": 1,
            "volume_discounts": [
                {"min_quantity": 10, "discount_percentage": "5.00"},
                {"min_quantity": 10, "discount_percentage": "8.00"},
            ],
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_product_duplicate_sku(
    async_client, user_factory, product_factory, auth_headers
):
    existing = await product_factory(name="Existing", sku="DUP-SKU-1")
    admin = await user_factory(
        email="admin-catalog-dup-sku@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Another Product",
            "sku": "DUP-SKU-1",
            "category_id": str(existing.category_id),
            "base_price": "10.00",
            "stock_quantity": 1,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 400
    assert "SKU" in response.json()["detail"]


@pytest.mark.asyncio
async def test_create_product_requires_admin(
    async_client, user_factory, product_factory, auth_headers
):
    seed = await product_factory(name="Cat Seed")
    customer = await user_factory(
        email="customer-admin-create@test.com",
        is_verified=True,
        role=UserRole.CUSTOMER,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Blocked",
            "sku": "BLK-1",
            "category_id": str(seed.category_id),
            "base_price": "10.00",
            "stock_quantity": 1,
        },
        headers=auth_headers(customer),
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_update_product(
    async_client, user_factory, product_factory, auth_headers
):
    from decimal import Decimal

    product = await product_factory(
        name="Old Name",
        sku="UPD-001",
        base_price=Decimal("10.00"),
        stock_quantity=5,
        is_active=True,
        is_b2b_only=False,
    )
    admin = await user_factory(
        email="admin-catalog-update@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "Updated Name",
            "sku": "UPD-001",
            "category_id": str(product.category_id),
            "description": "Updated description",
            "base_price": "19.50",
            "stock_quantity": 12,
            "main_image_url": "https://example.com/p.png",
            "is_active": False,
            "is_b2b_only": True,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["description"] == "Updated description"
    assert data["base_price"] == "19.50"
    assert data["stock_quantity"] == 12
    assert data["is_active"] is False
    assert data["is_b2b_only"] is True
    assert data["main_image_url"] == "https://example.com/p.png"
    # Name changed → slug regenerated from new name
    assert data["slug"] == "updated-name"


@pytest.mark.asyncio
async def test_update_product_replaces_volume_discounts(
    async_client, user_factory, product_factory, volume_discount_factory, auth_headers
):
    from decimal import Decimal

    product = await product_factory(name="Has Tiers", sku="VOL-UPD-1")
    await volume_discount_factory(product.id, 10, Decimal("5.00"))
    admin = await user_factory(
        email="admin-catalog-vol-upd@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "Has Tiers",
            "sku": "VOL-UPD-1",
            "category_id": str(product.category_id),
            "base_price": "10.00",
            "stock_quantity": 100,
            "is_active": True,
            "is_b2b_only": False,
            "volume_discounts": [
                {"min_quantity": 20, "discount_percentage": "8.00"},
                {"min_quantity": 100, "discount_percentage": "20.00"},
            ],
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    tiers = response.json()["volume_discounts"]
    assert [t["min_quantity"] for t in tiers] == [20, 100]
    assert tiers[0]["discount_percentage"] == "8.00"


@pytest.mark.asyncio
async def test_get_product_includes_volume_discounts(
    async_client, user_factory, product_factory, volume_discount_factory, auth_headers
):
    from decimal import Decimal

    product = await product_factory(name="Detail Vol", sku="VOL-GET-1")
    await volume_discount_factory(product.id, 10, Decimal("5.00"))
    admin = await user_factory(
        email="admin-catalog-vol-get@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.get(
        f"/admin/products/{product.id}",
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    tiers = response.json()["volume_discounts"]
    assert len(tiers) == 1
    assert tiers[0]["min_quantity"] == 10
    assert tiers[0]["discount_percentage"] == "5.00"


@pytest.mark.asyncio
async def test_update_product_keeps_slug_when_name_unchanged(
    async_client, user_factory, product_factory, auth_headers
):
    product = await product_factory(
        name="Stable Name",
        sku="SLUG-KEEP-1",
        slug="custom-existing-slug",
    )
    admin = await user_factory(
        email="admin-catalog-slug-keep@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "Stable Name",
            "sku": "SLUG-KEEP-1",
            "category_id": str(product.category_id),
            "base_price": "10.00",
            "stock_quantity": 100,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    assert response.json()["slug"] == "custom-existing-slug"


@pytest.mark.asyncio
async def test_create_product_slug_collision_gets_suffix(
    async_client, user_factory, product_factory, auth_headers
):
    await product_factory(name="Same Display Name", slug="same-display-name")
    seed = await product_factory(name="Other Seed", sku="SEED-COL-1")
    admin = await user_factory(
        email="admin-catalog-slug-col@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Same Display Name",
            "sku": "COL-SKU-2",
            "category_id": str(seed.category_id),
            "base_price": "10.00",
            "stock_quantity": 1,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    slug = response.json()["slug"]
    assert slug.startswith("same-display-name-")
    assert slug != "same-display-name"


@pytest.mark.asyncio
async def test_update_product_not_found(async_client, user_factory, auth_headers):
    admin = await user_factory(
        email="admin-catalog-upd-404@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )
    missing_id = "00000000-0000-0000-0000-000000000002"

    response = await async_client.put(
        f"/admin/products/{missing_id}",
        json={
            "name": "Ghost",
            "sku": "GHOST-1",
            "category_id": "00000000-0000-0000-0000-000000000099",
            "base_price": "1.00",
            "stock_quantity": 0,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_product_skips_embedding_when_semantic_disabled(
    async_client, user_factory, product_factory, auth_headers, db_session, monkeypatch
):
    from app.ai.embedding import embedding_service
    from app.crud import product as product_crud
    from uuid import UUID

    monkeypatch.setattr(embedding_service, "is_available", lambda: False)

    seed = await product_factory(name="Embed Seed Off")
    admin = await user_factory(
        email="admin-embed-off@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "No Embed Product",
            "sku": "EMB-OFF-1",
            "category_id": str(seed.category_id),
            "base_price": "10.00",
            "stock_quantity": 1,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    product = await product_crud.get_product_by_id(
        db_session, UUID(response.json()["id"])
    )
    assert product is not None
    assert product.embedding is None


@pytest.mark.asyncio
async def test_create_product_sets_embedding_when_semantic_enabled(
    async_client, user_factory, product_factory, auth_headers, db_session, monkeypatch
):
    from unittest.mock import MagicMock

    from app.ai.embedding import embedding_service
    from app.crud import product as product_crud
    from uuid import UUID

    fake_vector = [0.1] + [0.0] * 383
    monkeypatch.setattr(embedding_service, "is_available", lambda: True)
    monkeypatch.setattr(
        embedding_service,
        "embed_texts",
        MagicMock(return_value=[fake_vector]),
    )

    seed = await product_factory(name="Embed Seed On")
    admin = await user_factory(
        email="admin-embed-on@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.post(
        "/admin/products",
        json={
            "name": "Embedded Product",
            "sku": "EMB-ON-1",
            "category_id": str(seed.category_id),
            "description": "Has embedding",
            "base_price": "10.00",
            "stock_quantity": 1,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 201
    embedding_service.embed_texts.assert_called_once()
    product = await product_crud.get_product_by_id(
        db_session, UUID(response.json()["id"])
    )
    assert product is not None
    assert list(product.embedding) == fake_vector


@pytest.mark.asyncio
async def test_update_product_reembeds_when_name_changes(
    async_client, user_factory, product_factory, auth_headers, db_session, monkeypatch
):
    from decimal import Decimal
    from unittest.mock import MagicMock

    from app.ai.embedding import embedding_service
    from app.crud import product as product_crud

    old_vector = [0.2] + [0.0] * 383
    new_vector = [0.9] + [0.0] * 383
    product = await product_factory(
        name="Old Embed Name",
        sku="EMB-UPD-1",
        base_price=Decimal("10.00"),
        embedding=old_vector,
    )
    monkeypatch.setattr(embedding_service, "is_available", lambda: True)
    monkeypatch.setattr(
        embedding_service,
        "embed_texts",
        MagicMock(return_value=[new_vector]),
    )
    admin = await user_factory(
        email="admin-embed-upd@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "New Embed Name",
            "sku": "EMB-UPD-1",
            "category_id": str(product.category_id),
            "base_price": "10.00",
            "stock_quantity": 100,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    embedding_service.embed_texts.assert_called_once()
    await db_session.refresh(product)
    assert list(product.embedding) == new_vector


@pytest.mark.asyncio
async def test_update_product_skips_reembed_when_only_price_changes(
    async_client, user_factory, product_factory, auth_headers, db_session, monkeypatch
):
    from decimal import Decimal
    from unittest.mock import MagicMock

    from app.ai.embedding import embedding_service

    vector = [0.3] + [0.0] * 383
    product = await product_factory(
        name="Price Only",
        sku="EMB-PRICE-1",
        base_price=Decimal("10.00"),
        embedding=vector,
    )
    embed_mock = MagicMock(return_value=[[0.9] + [0.0] * 383])
    monkeypatch.setattr(embedding_service, "is_available", lambda: True)
    monkeypatch.setattr(embedding_service, "embed_texts", embed_mock)
    admin = await user_factory(
        email="admin-embed-price@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "Price Only",
            "sku": "EMB-PRICE-1",
            "category_id": str(product.category_id),
            "base_price": "22.00",
            "stock_quantity": 100,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    embed_mock.assert_not_called()
    await db_session.refresh(product)
    assert list(product.embedding) == vector


@pytest.mark.asyncio
async def test_update_product_clears_embedding_when_semantic_disabled(
    async_client, user_factory, product_factory, auth_headers, db_session, monkeypatch
):
    from decimal import Decimal

    from app.ai.embedding import embedding_service

    product = await product_factory(
        name="Clear Embed",
        sku="EMB-CLR-1",
        base_price=Decimal("10.00"),
        embedding=[0.4] + [0.0] * 383,
    )
    monkeypatch.setattr(embedding_service, "is_available", lambda: False)
    admin = await user_factory(
        email="admin-embed-clr@test.com",
        is_verified=True,
        role=UserRole.ADMIN,
    )

    response = await async_client.put(
        f"/admin/products/{product.id}",
        json={
            "name": "Clear Embed Renamed",
            "sku": "EMB-CLR-1",
            "category_id": str(product.category_id),
            "base_price": "10.00",
            "stock_quantity": 100,
            "is_active": True,
            "is_b2b_only": False,
        },
        headers=auth_headers(admin),
    )
    assert response.status_code == 200
    await db_session.refresh(product)
    assert product.embedding is None
