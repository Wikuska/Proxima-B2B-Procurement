from decimal import Decimal

import pytest
from app.models.product import Category, Product
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# FIXTURES


@pytest.fixture
async def setup_catalog(db_session: AsyncSession):
    """
    Seeds the database with two categories and multiple products for testing.
    Includes active, inactive, B2B-only, and B2C-only products.
    """
    reagents = Category(name="Reagents", slug="reagents")
    equipment = Category(name="Equipment", slug="equipment")
    db_session.add_all([reagents, equipment])
    await db_session.flush()

    products = [
        Product(
            name="Microscope",
            slug="microscope",
            sku="MIC-PRO-100",
            category_id=equipment.id,
            base_price=Decimal("500.00"),
            stock_quantity=10,
            is_active=True,
            b2b_available=True,
            b2c_available=True,
        ),
        Product(
            name="Acetone",
            slug="acetone",
            sku="TSH-M-BLK-COT",
            category_id=reagents.id,
            base_price=Decimal("10.00"),
            stock_quantity=100,
            is_active=True,
            b2b_available=True,
            b2c_available=True,
        ),
        Product(
            name="Benzene",
            slug="benzene",
            sku="LAP-HP-PRO-16-512",
            category_id=reagents.id,
            base_price=Decimal("20.00"),
            stock_quantity=50,
            is_active=True,
            b2b_available=True,
            b2c_available=False,  # B2B only
        ),
        Product(
            name="Chloroform",
            slug="chloroform",
            sku="CL-SAN-LT-8-BLU",
            category_id=reagents.id,
            base_price=Decimal("30.00"),
            stock_quantity=0,
            is_active=False,  # Inactive
            b2b_available=True,
            b2c_available=True,
        ),
    ]
    db_session.add_all(products)
    await db_session.commit()

    return {"reagents": reagents, "equipment": equipment, "products": products}


@pytest.fixture
async def setup_many_products(db_session: AsyncSession):
    """Seeds 30 products for pagination testing."""
    category = Category(name="Reagents", slug="reagents")
    db_session.add(category)
    await db_session.flush()

    products = [
        Product(
            name=f"Product {i:02d}",
            slug=f"product-{i:02d}",
            sku=f"REG-{i:05d}",
            category_id=category.id,
            base_price=Decimal("10.00"),
            stock_quantity=10,
            is_active=True,
            b2b_available=True,
            b2c_available=True,
        )
        for i in range(1, 31)
    ]
    db_session.add_all(products)
    await db_session.commit()

    return {"category": category, "products": products}


# /catalog/categories/{slug}/products tests


async def test_get_products_by_category_slug_happy_path(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure filtering by category_slug in path returns only products from that category."""
    reagents_slug = setup_catalog["reagents"].slug

    response = await async_client.get(f"/catalog/categories/{reagents_slug}/products")

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) > 0

    returned_slugs = {item["slug"] for item in data["items"]}
    assert "acetone" in returned_slugs
    assert "benzene" in returned_slugs
    assert "microscope" not in returned_slugs


async def test_get_products_by_nonexistent_category_slug_returns_empty(
    async_client: AsyncClient,
):
    """Requesting products for a non-existent category slug returns 200 with empty items."""
    response = await async_client.get("/catalog/categories/ghost-category/products")

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


async def test_get_products_by_category_missing_slug_returns_404(
    async_client: AsyncClient,
):
    """If the slug is missing from the path entirely, FastAPI router should throw 404."""
    response = await async_client.get("/catalog/categories//products")
    assert response.status_code == 404


# /catalog/products tests


async def test_get_all_products_without_filters(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure calling go to /products without queries returns all active products."""
    response = await async_client.get("/catalog/products")

    assert response.status_code == 200
    data = response.json()
    # Powinien zwrócić zarówno odczynniki, jak i sprzęt
    returned_slugs = {item["slug"] for item in data["items"]}
    assert "acetone" in returned_slugs
    assert "microscope" in returned_slugs


async def test_get_products_search_by_query_happy_path(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure text search filters products properly by name or SKU (case-insensitive)."""
    response = await async_client.get("/catalog/products?search_query=scope")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "microscope"


async def test_get_products_search_no_results_returns_empty(
    async_client: AsyncClient,
):
    """If search query matches nothing, return 200 with empty list."""
    response = await async_client.get(
        "/catalog/products?search_query=nonexistent-item-name"
    )

    assert response.status_code == 200
    data = response.json()
    assert data["items"] == []
    assert data["total"] == 0


# Buissnes logic, pagination tests


async def test_get_products_pagination_returns_different_pages(
    async_client: AsyncClient,
    setup_many_products: dict,
):
    """
    Happy Path: Ensure page=1 and page=2 return different products.
    """
    response_page_1 = await async_client.get("/catalog/products?page=1&size=10")
    response_page_2 = await async_client.get("/catalog/products?page=2&size=10")

    assert response_page_1.status_code == 200
    assert response_page_2.status_code == 200

    page_1_ids = {item["id"] for item in response_page_1.json()["items"]}
    page_2_ids = {item["id"] for item in response_page_2.json()["items"]}

    # Pages must not overlap
    assert page_1_ids.isdisjoint(page_2_ids)


async def test_get_products_total_and_pages_are_correct(
    async_client: AsyncClient,
    setup_many_products: dict,
):
    """
    Happy Path: Ensure total and pages fields correctly reflect
    the number of products and requested page size.
    """
    import math

    response = await async_client.get("/catalog/products?size=10")

    assert response.status_code == 200

    data = response.json()
    assert data["total"] == 30
    assert data["pages"] == math.ceil(30 / 10)


async def test_get_products_size_exceeding_max_returns_422(
    async_client: AsyncClient,
):
    """
    Negative Path: Ensure size exceeding the maximum allowed value (100)
    returns a 422 Unprocessable Entity.
    """
    response = await async_client.get("/catalog/products?size=101")

    assert response.status_code == 422


async def test_get_products_page_less_than_1_returns_422(
    async_client: AsyncClient,
):
    """
    Negative Path: Ensure page=0 returns a 422 Unprocessable Entity.
    """
    response = await async_client.get("/catalog/products?page=0")

    assert response.status_code == 422


async def test_get_products_inactive_products_not_returned(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """
    Happy Path: Inactive products (is_active=False) must never
    appear in the catalog response.
    """
    response = await async_client.get("/catalog/products")

    assert response.status_code == 200

    data = response.json()
    slugs = [item["slug"] for item in data["items"]]

    # Chloroform is inactive and must not appear
    assert "chloroform" not in slugs


async def test_get_products_sorted_alphabetically(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """
    Edge Case: Ensure products are returned in alphabetical order
    regardless of insertion order.
    """
    response = await async_client.get("/catalog/products")

    assert response.status_code == 200

    data = response.json()
    names = [item["name"] for item in data["items"]]

    assert names == sorted(names)


async def test_get_products_out_of_bounds_page_returns_empty(
    async_client: AsyncClient,
    setup_many_products: dict,
):
    """
    Edge Case: Requesting a page beyond the available range should return
    200 with empty items but correct total and pages values.
    """
    response = await async_client.get("/catalog/products?page=100&size=24")

    assert response.status_code == 200

    data = response.json()
    assert data["items"] == []
    assert data["total"] == 30  # total is still correct
    assert data["pages"] == 2
