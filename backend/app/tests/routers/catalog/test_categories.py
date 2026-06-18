import pytest
from app.models.product import Category
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def setup_categories(db_session: AsyncSession):
    """Seeds the database with sample categories for testing."""
    categories = [
        Category(name="Reagents", slug="reagents", description="Chemical reagents"),
        Category(name="Equipment", slug="equipment", description="Lab equipment"),
        Category(name="Consumables", slug="consumables", description=None),
    ]
    db_session.add_all(categories)
    await db_session.commit()
    return categories


async def test_get_categories_returns_list(
    async_client: AsyncClient,
    db_session: AsyncSession,
    setup_categories: list,
):
    """
    Happy Path: Ensure the endpoint returns a list of all seeded categories
    with correct fields.
    """
    response = await async_client.get("/catalog/categories")

    assert response.status_code == 200

    data = response.json()
    assert isinstance(data, list)
    assert len(data) == 3

    names = [c["name"] for c in data]
    assert "Reagents" in names
    assert "Equipment" in names
    assert "Consumables" in names

    for category in data:
        assert "id" in category
        assert "name" in category
        assert "slug" in category
        assert "description" in category


async def test_get_categories_returns_empty_list(async_client: AsyncClient):
    """
    Edge Case: Ensure the endpoint returns an empty list when no categories
    exist in the database rather than an error.
    """
    response = await async_client.get("/catalog/categories")

    assert response.status_code == 200
    assert response.json() == []


async def test_get_categories_returns_sorted_alphabetically(
    async_client: AsyncClient,
    setup_categories: list,
):
    """
    Edge Case: Ensure categories are returned in alphabetical order
    regardless of insertion order.
    """
    response = await async_client.get("/catalog/categories")

    assert response.status_code == 200

    data = response.json()
    names = [c["name"] for c in data]

    assert names == sorted(names)
