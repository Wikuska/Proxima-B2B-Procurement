from decimal import Decimal

import pytest
from app.models.product import Category, Product, ProductVolumeDiscount
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
            description="Nice Microscope",
            category_id=equipment.id,
            base_price=Decimal("500.00"),
            stock_quantity=10,
            is_active=True,
            is_b2b_only=False,
        ),
        Product(
            name="Acetone",
            slug="acetone",
            sku="TSH-M-BLK-COT",
            description="Nice Acetone",
            category_id=reagents.id,
            base_price=Decimal("10.00"),
            stock_quantity=100,
            is_active=True,
            is_b2b_only=False,
        ),
        Product(
            name="Benzene",
            slug="benzene",
            sku="LAP-HP-PRO-16-512",
            category_id=reagents.id,
            base_price=Decimal("20.00"),
            stock_quantity=50,
            is_active=True,
            is_b2b_only=True,  # B2B only
        ),
        Product(
            name="Chloroform",
            slug="chloroform",
            sku="CL-SAN-LT-8-BLU",
            description="Nice Chloroform",
            category_id=reagents.id,
            base_price=Decimal("30.00"),
            stock_quantity=0,
            is_active=False,  # Inactive
            is_b2b_only=False,
        ),
    ]
    db_session.add_all(products)
    await db_session.flush()

    discounts = [
        ProductVolumeDiscount(
            product_id=products[1].id,
            min_quantity=10,
            discount_percentage=Decimal("5.00"),
        ),
        ProductVolumeDiscount(
            product_id=products[1].id,
            min_quantity=50,
            discount_percentage=Decimal("15.00"),
        ),
    ]
    db_session.add_all(discounts)
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
            is_b2b_only=False,
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


async def test_get_products_by_nonexistent_category_slug_returns_404(
    async_client: AsyncClient,
):
    """Requesting products for a non-existent category slug returns a 404 Not Found error."""
    response = await async_client.get("/catalog/categories/ghost-category/products")

    assert response.status_code == 404
    data = response.json()
    assert data["detail"] == "Category not found"


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
    benzene_item = next(item for item in data["items"] if item["slug"] == "benzene")
    assert benzene_item["is_b2b_only"] is True
    acetone_item = next(item for item in data["items"] if item["slug"] == "acetone")
    assert acetone_item["is_b2b_only"] is False


async def test_get_products_search_by_query_happy_path(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure text search filters products by full word in name (FTS)."""
    response = await async_client.get("/catalog/products?search_query=microscope")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "microscope"


async def test_get_products_search_by_name_fts(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """FTS matches product names."""
    response = await async_client.get("/catalog/products?search_query=acetone")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "acetone"


async def test_get_products_search_by_sku_prefix(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """SKU prefix fallback matches partial product codes."""
    response = await async_client.get("/catalog/products?search_query=MIC-PRO")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "microscope"


async def test_get_products_search_suggest_size_limit(
    async_client: AsyncClient,
    setup_many_products: dict,
):
    """Suggest flow returns at most the requested page size."""
    response = await async_client.get(
        "/catalog/products?search_query=Product&size=8&page=1"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["items"]) == 8
    assert data["size"] == 8


async def test_get_products_sort_price_asc(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    response = await async_client.get("/catalog/products?sort_by=price_asc")

    assert response.status_code == 200
    prices = [item["base_price"] for item in response.json()["items"]]
    assert prices == sorted(prices)


async def test_get_products_sort_price_desc(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    response = await async_client.get("/catalog/products?sort_by=price_desc")

    assert response.status_code == 200
    prices = [item["base_price"] for item in response.json()["items"]]
    assert prices == sorted(prices, reverse=True)


async def test_get_products_sort_relevance_without_query_falls_back_to_name(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    response = await async_client.get("/catalog/products?sort_by=relevance")

    assert response.status_code == 200
    names = [item["name"] for item in response.json()["items"]]
    assert names == sorted(names)


async def test_get_products_search_defaults_to_relevance_order(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    response = await async_client.get("/catalog/products?search_query=acetone")

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["slug"] == "acetone"


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


# /catalog/products/{product_slug} tests


async def test_get_product_details_happy_path(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure a valid slug returns 200 with correct product data."""
    microscope = setup_catalog["products"][0]

    response = await async_client.get(f"/catalog/products/{microscope.slug}")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == microscope.slug
    assert data["name"] == microscope.name
    assert data["description"] == microscope.description
    assert data["sku"] == microscope.sku


async def test_get_product_details_not_found(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure a non-existent slug returns 404."""
    response = await async_client.get("/catalog/products/non-existent-slug")

    assert response.status_code == 404


async def test_get_product_details_returns_correct_product(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure the endpoint returns the exact product matching the slug, not another one."""
    acetone = setup_catalog["products"][1]
    microscope = setup_catalog["products"][0]

    response = await async_client.get(f"/catalog/products/{acetone.slug}")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == acetone.slug
    assert data["slug"] != microscope.slug


async def test_get_product_details_inactive_product(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure inactive products are still returned — or adjust assertion if your business logic hides them."""
    chloroform = setup_catalog["products"][3]

    response = await async_client.get(f"/catalog/products/{chloroform.slug}")

    assert response.status_code == 200
    data = response.json()
    assert data["slug"] == chloroform.slug
    assert data["is_active"] is False


async def test_get_product_details_with_no_description(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Ensure a product with no description returns null in the response, not an error."""
    benzene = setup_catalog["products"][2]

    response = await async_client.get(f"/catalog/products/{benzene.slug}")

    assert response.status_code == 200
    data = response.json()
    assert data["description"] is None


async def test_get_product_details_with_discounts(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Verifies that a product correctly returns a list of assigned volume discounts."""
    acetone = setup_catalog["products"][1]

    response = await async_client.get(f"/catalog/products/{acetone.slug}")

    assert response.status_code == 200
    data = response.json()

    assert "volume_discounts" in data
    assert isinstance(data["volume_discounts"], list)
    assert len(data["volume_discounts"]) > 0

    first_discount = data["volume_discounts"][0]
    assert "min_quantity" in first_discount
    assert "discount_percentage" in first_discount


async def test_get_product_details_without_discounts(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Verifies that the API returns an empty list for a product without volume discounts."""
    microscope = setup_catalog["products"][0]

    response = await async_client.get(f"/catalog/products/{microscope.slug}")

    assert response.status_code == 200
    data = response.json()

    assert "volume_discounts" in data
    assert data["volume_discounts"] == []


# /catalog/products/{product_slug}/related tests


async def test_get_related_products_same_category_only(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Related products must only include other items from the same category."""
    acetone = setup_catalog["products"][1]  # reagents

    response = await async_client.get(f"/catalog/products/{acetone.slug}/related")

    assert response.status_code == 200
    data = response.json()
    slugs = {item["slug"] for item in data}

    assert "benzene" in slugs  # reagents, active
    assert "microscope" not in slugs  # equipment, different category


async def test_get_related_products_excludes_self(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """The current product must never appear in its own related list."""
    acetone = setup_catalog["products"][1]

    response = await async_client.get(f"/catalog/products/{acetone.slug}/related")

    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    assert acetone.slug not in slugs


async def test_get_related_products_excludes_inactive(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Inactive products in the same category must not be returned as related."""
    acetone = setup_catalog["products"][1]  # reagents

    response = await async_client.get(f"/catalog/products/{acetone.slug}/related")

    assert response.status_code == 200
    slugs = {item["slug"] for item in response.json()}
    assert "chloroform" not in slugs  # reagents, but inactive


async def test_get_related_products_respects_limit(
    async_client: AsyncClient,
    setup_many_products: dict,
):
    """The `limit` query param caps the number of returned related products."""
    products = setup_many_products["products"]

    response = await async_client.get(
        f"/catalog/products/{products[0].slug}/related?limit=3"
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


async def test_get_related_products_not_found(async_client: AsyncClient):
    """Requesting related products for a non-existent slug returns 404."""
    response = await async_client.get("/catalog/products/non-existent-slug/related")
    assert response.status_code == 404


async def test_get_related_products_includes_company_pricing(
    async_client: AsyncClient,
    setup_catalog: dict,
    user_factory,
    company_factory,
    auth_headers,
):
    """When authenticated as a company user, related product rows carry company pricing."""
    company = await company_factory(discount_percentage=Decimal("20"))
    user = await user_factory(
        email="related-buyer@test.com", company_id=company.id, is_verified=True
    )
    acetone = setup_catalog["products"][1]

    response = await async_client.get(
        f"/catalog/products/{acetone.slug}/related",
        headers=auth_headers(user),
    )

    assert response.status_code == 200
    data = response.json()
    benzene_item = next(item for item in data if item["slug"] == "benzene")
    assert Decimal(benzene_item["company_discount_percentage"]) == Decimal("20")
    assert benzene_item["company_unit_price"] is not None


# /catalog/products/batch tests


async def test_get_products_batch_happy_path(
    async_client: AsyncClient,
    setup_catalog: dict,
):
    """Batch endpoint returns snapshots for the requested IDs, including inactive ones."""
    microscope = setup_catalog["products"][0]
    chloroform = setup_catalog["products"][3]  # inactive

    response = await async_client.get(
        f"/catalog/products/batch?ids={microscope.id},{chloroform.id}"
    )

    assert response.status_code == 200
    data = response.json()
    slugs = {item["slug"] for item in data}
    assert slugs == {"microscope", "chloroform"}
    chloroform_item = next(item for item in data if item["slug"] == "chloroform")
    assert chloroform_item["is_active"] is False
