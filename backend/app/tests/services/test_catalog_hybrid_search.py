from decimal import Decimal
from unittest.mock import MagicMock

import pytest
from app.models.product import Category, Product
from app.services.embedding import embedding_service
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


@pytest.fixture
async def setup_search_products(db_session: AsyncSession):
    category = Category(name="Safety", slug="safety")
    db_session.add(category)
    await db_session.flush()

    gloves = Product(
        name="Nitrile Chemical Gloves",
        slug="nitrile-chemical-gloves",
        sku="SAF-GLV-001",
        description="Chemical-resistant disposable gloves for lab work",
        category_id=category.id,
        base_price=Decimal("12.00"),
        stock_quantity=50,
        is_active=True,
        is_b2b_only=False,
        embedding=[0.9] + [0.0] * 383,
    )
    beaker = Product(
        name="Glass Beaker 250ml",
        slug="glass-beaker-250ml",
        sku="GLS-BEA-250",
        description="Borosilicate beaker",
        category_id=category.id,
        base_price=Decimal("8.00"),
        stock_quantity=20,
        is_active=True,
        is_b2b_only=False,
        embedding=[0.0] * 384,
    )
    db_session.add_all([gloves, beaker])
    await db_session.commit()
    return {"gloves": gloves, "beaker": beaker}


@pytest.mark.asyncio
async def test_catalog_search_defaults_to_fts_without_model(
    async_client: AsyncClient, setup_search_products
):
    response = await async_client.get(
        "/catalog/products", params={"search_query": "Nitrile"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["search_mode"] == "fts"
    assert body["total"] >= 1
    assert any(item["sku"] == "SAF-GLV-001" for item in body["items"])


@pytest.mark.asyncio
async def test_catalog_search_uses_hybrid_when_embeddings_available(
    async_client: AsyncClient,
    setup_search_products,
    monkeypatch: pytest.MonkeyPatch,
):
    monkeypatch.setattr(embedding_service, "_load_attempted", True)
    monkeypatch.setattr(embedding_service, "_available", True)
    monkeypatch.setattr(
        embedding_service,
        "embed_query",
        MagicMock(return_value=[0.9] + [0.0] * 383),
    )
    monkeypatch.setattr(
        "app.core.settings.settings.SEMANTIC_SEARCH_ENABLED",
        True,
    )

    # is_available checks settings + _available; force path through catalog gate
    monkeypatch.setattr(embedding_service, "is_available", lambda: True)

    response = await async_client.get(
        "/catalog/products",
        params={"search_query": "hand protection chemicals"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["search_mode"] == "hybrid"
    assert body["items"][0]["sku"] == "SAF-GLV-001"
