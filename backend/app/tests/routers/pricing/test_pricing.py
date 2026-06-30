from decimal import Decimal

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession


# ---------------------------------------------------------------------------
# POST /pricing/quote
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_quote_guest_no_company_discount(
    async_client: AsyncClient,
    product_factory,
    volume_discount_factory,
):
    product = await product_factory(base_price=Decimal("100.00"))
    await volume_discount_factory(product.id, 10, Decimal("10"))

    payload = {
        "items": [{"product_id": str(product.id), "quantity": 10}],
        "mode": "COMPANY",
    }
    resp = await async_client.post("/pricing/quote", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    line = data["lines"][0]
    # Guest → no company discount; qty=10 triggers 10% volume
    assert Decimal(line["company_pct"]) == Decimal("0")
    assert Decimal(line["volume_pct"]) == Decimal("10")
    assert Decimal(line["final_unit_price"]) == Decimal("90.00")
    assert Decimal(line["line_total"]) == Decimal("900.00")


@pytest.mark.asyncio
async def test_quote_company_user_applies_company_and_volume(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
    product_factory,
    volume_discount_factory,
):
    company = await company_factory(discount_percentage=Decimal("20"))
    user = await user_factory(
        email="buyer@test.com", company_id=company.id, is_verified=True
    )
    product = await product_factory(base_price=Decimal("100.00"))
    await volume_discount_factory(product.id, 10, Decimal("15"))

    payload = {
        "items": [{"product_id": str(product.id), "quantity": 10}],
        "mode": "COMPANY",
    }
    resp = await async_client.post(
        "/pricing/quote", json=payload, headers=auth_headers(user)
    )
    assert resp.status_code == 200
    data = resp.json()

    line = data["lines"][0]
    # company=20%, volume=15% → sequential: 100*0.8=80, 80*0.85=68
    assert Decimal(line["company_pct"]) == Decimal("20")
    assert Decimal(line["volume_pct"]) == Decimal("15")
    assert Decimal(line["final_unit_price"]) == Decimal("68.00")
    assert Decimal(line["line_total"]) == Decimal("680.00")
    assert Decimal(data["subtotal_base"]) == Decimal("1000.00")
    assert Decimal(data["grand_total"]) == Decimal("680.00")
    assert Decimal(data["total_discount"]) == Decimal("320.00")


@pytest.mark.asyncio
async def test_quote_private_mode_suppresses_company_discount(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
    product_factory,
):
    company = await company_factory(discount_percentage=Decimal("20"))
    user = await user_factory(
        email="private@test.com", company_id=company.id, is_verified=True
    )
    product = await product_factory(base_price=Decimal("100.00"))

    payload = {
        "items": [{"product_id": str(product.id), "quantity": 1}],
        "mode": "PRIVATE",
    }
    resp = await async_client.post(
        "/pricing/quote", json=payload, headers=auth_headers(user)
    )
    assert resp.status_code == 200
    line = resp.json()["lines"][0]
    assert Decimal(line["company_pct"]) == Decimal("0")
    assert Decimal(line["final_unit_price"]) == Decimal("100.00")


@pytest.mark.asyncio
async def test_quote_cap_applied(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
    product_factory,
    volume_discount_factory,
):
    # company=40%, volume=30% → effective=58% > cap=50%
    company = await company_factory(discount_percentage=Decimal("40"))
    user = await user_factory(
        email="capped@test.com", company_id=company.id, is_verified=True
    )
    product = await product_factory(base_price=Decimal("100.00"))
    await volume_discount_factory(product.id, 1, Decimal("30"))

    payload = {
        "items": [{"product_id": str(product.id), "quantity": 5}],
        "mode": "COMPANY",
    }
    resp = await async_client.post(
        "/pricing/quote", json=payload, headers=auth_headers(user)
    )
    assert resp.status_code == 200
    line = resp.json()["lines"][0]
    assert Decimal(line["final_unit_price"]) == Decimal("50.00")
    assert Decimal(line["effective_pct"]) == Decimal("50.00")


@pytest.mark.asyncio
async def test_quote_missing_product_id_ignored(
    async_client: AsyncClient,
    product_factory,
):
    import uuid

    product = await product_factory(base_price=Decimal("10.00"))
    payload = {
        "items": [
            {"product_id": str(product.id), "quantity": 1},
            {"product_id": str(uuid.uuid4()), "quantity": 1},  # non-existent
        ],
        "mode": "PRIVATE",
    }
    resp = await async_client.post("/pricing/quote", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["lines"]) == 1


# ---------------------------------------------------------------------------
# GET /pricing/product/{slug}
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_get_product_pricing_no_company(
    async_client: AsyncClient,
    product_factory,
    volume_discount_factory,
):
    product = await product_factory(base_price=Decimal("100.00"), slug="pricing-p1")
    await volume_discount_factory(product.id, 10, Decimal("5"))
    await volume_discount_factory(product.id, 50, Decimal("15"))

    resp = await async_client.get(f"/pricing/product/{product.slug}")
    assert resp.status_code == 200
    data = resp.json()

    assert Decimal(data["base_price"]) == Decimal("100.00")
    assert Decimal(data["company_discount_percentage"]) == Decimal("0")
    assert Decimal(data["unit_price"]) == Decimal("100.00")
    assert len(data["tiers"]) == 2
    # tier with 5% discount
    tier_5 = next(t for t in data["tiers"] if t["min_quantity"] == 10)
    assert Decimal(tier_5["unit_price"]) == Decimal("95.00")
    # tier with 15% discount
    tier_15 = next(t for t in data["tiers"] if t["min_quantity"] == 50)
    assert Decimal(tier_15["unit_price"]) == Decimal("85.00")


@pytest.mark.asyncio
async def test_get_product_pricing_company_mode(
    async_client: AsyncClient,
    user_factory,
    company_factory,
    auth_headers,
    product_factory,
    volume_discount_factory,
):
    company = await company_factory(discount_percentage=Decimal("20"))
    user = await user_factory(
        email="pricinguser@test.com", company_id=company.id, is_verified=True
    )
    product = await product_factory(base_price=Decimal("100.00"), slug="pricing-p2")
    await volume_discount_factory(product.id, 10, Decimal("15"))

    resp = await async_client.get(
        f"/pricing/product/{product.slug}?mode=COMPANY",
        headers=auth_headers(user),
    )
    assert resp.status_code == 200
    data = resp.json()

    assert Decimal(data["company_discount_percentage"]) == Decimal("20")
    # header price: 100*0.8=80
    assert Decimal(data["unit_price"]) == Decimal("80.00")
    # tier: 100*0.8=80, 80*0.85=68
    tier = data["tiers"][0]
    assert Decimal(tier["unit_price"]) == Decimal("68.00")


@pytest.mark.asyncio
async def test_get_product_pricing_not_found(async_client: AsyncClient):
    resp = await async_client.get("/pricing/product/nonexistent-slug")
    assert resp.status_code == 404
