from decimal import Decimal
from types import SimpleNamespace

import pytest
from app.services.pricing import (
    compute_unit,
    effective_company_pct,
    pick_volume_pct,
    quote,
    quote_line,
)

CAP = Decimal("50")


# ---------------------------------------------------------------------------
# pick_volume_pct
# ---------------------------------------------------------------------------


def _vd(min_qty: int, pct: str):
    return SimpleNamespace(min_quantity=min_qty, discount_percentage=Decimal(pct))


def test_pick_volume_pct_no_discounts():
    assert pick_volume_pct([], 10) == Decimal("0")


def test_pick_volume_pct_no_applicable():
    discounts = [_vd(10, "5"), _vd(50, "15")]
    assert pick_volume_pct(discounts, 5) == Decimal("0")


def test_pick_volume_pct_exact_threshold():
    discounts = [_vd(10, "5"), _vd(50, "15")]
    assert pick_volume_pct(discounts, 10) == Decimal("5")


def test_pick_volume_pct_selects_highest_tier():
    discounts = [_vd(10, "5"), _vd(50, "15")]
    assert pick_volume_pct(discounts, 50) == Decimal("15")


def test_pick_volume_pct_between_tiers():
    discounts = [_vd(10, "5"), _vd(50, "15")]
    assert pick_volume_pct(discounts, 30) == Decimal("5")


# ---------------------------------------------------------------------------
# effective_company_pct
# ---------------------------------------------------------------------------


def test_effective_company_pct_company_mode():
    assert effective_company_pct(Decimal("20"), "COMPANY") == Decimal("20")


def test_effective_company_pct_private_mode():
    assert effective_company_pct(Decimal("20"), "PRIVATE") == Decimal("0")


def test_effective_company_pct_none_discount():
    assert effective_company_pct(None, "COMPANY") == Decimal("0")


def test_effective_company_pct_guest():
    assert effective_company_pct(None, "PRIVATE") == Decimal("0")


# ---------------------------------------------------------------------------
# compute_unit
# ---------------------------------------------------------------------------


def test_compute_unit_no_discounts():
    result = compute_unit(Decimal("100"), Decimal("0"), Decimal("0"), CAP)
    assert result["final_unit"] == Decimal("100.00")
    assert result["effective_pct"] == Decimal("0.00")


def test_compute_unit_company_only():
    result = compute_unit(Decimal("100"), Decimal("20"), Decimal("0"), CAP)
    assert result["final_unit"] == Decimal("80.00")
    assert result["price_after_company"] == Decimal("80.00")
    assert result["effective_pct"] == Decimal("20.00")


def test_compute_unit_volume_only():
    result = compute_unit(Decimal("100"), Decimal("0"), Decimal("15"), CAP)
    assert result["final_unit"] == Decimal("85.00")
    assert result["effective_pct"] == Decimal("15.00")


def test_compute_unit_sequential_composition():
    # base=100, company=20%, volume=15%
    # price_after_company = 100 * 0.80 = 80
    # final = 80 * 0.85 = 68
    # effective = (1 - 68/100)*100 = 32%
    result = compute_unit(Decimal("100"), Decimal("20"), Decimal("15"), CAP)
    assert result["final_unit"] == Decimal("68.00")
    assert result["price_after_company"] == Decimal("80.00")
    assert result["effective_pct"] == Decimal("32.00")


def test_compute_unit_cap_applied():
    # company=40%, volume=30% → effective = 1 - 0.6*0.7 = 58% > cap 50
    result = compute_unit(Decimal("100"), Decimal("40"), Decimal("30"), CAP)
    assert result["final_unit"] == Decimal("50.00")
    assert result["effective_pct"] == Decimal("50.00")


def test_compute_unit_exactly_at_cap():
    # effective_pct == cap → no clamping
    # company=30%, volume=20/7... tricky; use 0%+50% → effective=50% == cap
    result = compute_unit(Decimal("100"), Decimal("0"), Decimal("50"), CAP)
    assert result["final_unit"] == Decimal("50.00")
    assert result["effective_pct"] == Decimal("50.00")


def test_compute_unit_zero_base():
    result = compute_unit(Decimal("0"), Decimal("20"), Decimal("15"), CAP)
    assert result["final_unit"] == Decimal("0")
    assert result["effective_pct"] == Decimal("0")


def test_compute_unit_rounding():
    # base=9.99, company=10% → 9.99 * 0.9 = 8.991 → rounds to 8.99
    result = compute_unit(Decimal("9.99"), Decimal("10"), Decimal("0"), CAP)
    assert result["final_unit"] == Decimal("8.99")


# ---------------------------------------------------------------------------
# quote_line
# ---------------------------------------------------------------------------


def _product(base: str, discounts: list):
    return SimpleNamespace(
        id="prod-1",
        base_price=Decimal(base),
        volume_discounts=discounts,
    )


def test_quote_line_no_discount():
    product = _product("10.00", [])
    line = quote_line(product, 5, Decimal("0"), CAP)
    assert line["final_unit_price"] == Decimal("10.00")
    assert line["line_total"] == Decimal("50.00")


def test_quote_line_with_volume():
    product = _product("10.00", [_vd(5, "10")])
    line = quote_line(product, 5, Decimal("0"), CAP)
    assert line["final_unit_price"] == Decimal("9.00")
    assert line["line_total"] == Decimal("45.00")


def test_quote_line_company_and_volume():
    product = _product("100.00", [_vd(10, "15")])
    line = quote_line(product, 10, Decimal("20"), CAP)
    # company: 100*0.8=80, volume: 80*0.85=68
    assert line["final_unit_price"] == Decimal("68.00")
    assert line["line_total"] == Decimal("680.00")
    assert line["company_pct"] == Decimal("20")
    assert line["volume_pct"] == Decimal("15")


# ---------------------------------------------------------------------------
# quote (full cart)
# ---------------------------------------------------------------------------


def _item(product_id, qty):
    return SimpleNamespace(product_id=product_id, quantity=qty)


def test_quote_skips_missing_products():
    result = quote({}, [_item("missing", 5)], Decimal("0"), CAP)
    assert result["lines"] == []
    assert result["grand_total"] == Decimal("0.00")


def test_quote_totals():
    p1 = _product("10.00", [])
    p2 = _product("20.00", [])
    products_map = {"p1": p1, "p2": p2}
    items = [_item("p1", 3), _item("p2", 2)]
    # line totals: 30.00 + 40.00 = 70.00 (no discount)
    result = quote(products_map, items, Decimal("0"), CAP)
    assert result["subtotal_base"] == Decimal("70.00")
    assert result["grand_total"] == Decimal("70.00")
    assert result["total_discount"] == Decimal("0.00")


def test_quote_total_discount():
    p1 = _product("100.00", [_vd(1, "20")])
    products_map = {"p1": p1}
    items = [_item("p1", 2)]
    result = quote(products_map, items, Decimal("0"), CAP)
    assert result["subtotal_base"] == Decimal("200.00")
    assert result["grand_total"] == Decimal("160.00")
    assert result["total_discount"] == Decimal("40.00")
