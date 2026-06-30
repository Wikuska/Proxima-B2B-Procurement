from decimal import Decimal, ROUND_HALF_UP

from sqlalchemy.ext.asyncio import AsyncSession

from app.crud import company as company_crud
from app.crud import product as product_crud
from app.core.exceptions import ProductNotFoundException
from app.core.settings import settings

_TWO = Decimal("0.01")
_HUNDRED = Decimal("100")


# ---------------------------------------------------------------------------
# Pure computation — no DB access
# ---------------------------------------------------------------------------


def pick_volume_pct(volume_discounts: list, qty: int) -> Decimal:
    """Returns the highest-tier volume discount percentage applicable for qty."""
    applicable = [vd for vd in volume_discounts if vd.min_quantity <= qty]
    if not applicable:
        return Decimal("0")
    return max(applicable, key=lambda vd: vd.min_quantity).discount_percentage


def effective_company_pct(company_discount: Decimal | None, mode: str) -> Decimal:
    """Returns company discount only when mode is COMPANY and discount exists."""
    if mode != "COMPANY" or company_discount is None:
        return Decimal("0")
    return company_discount


def compute_unit(
    base: Decimal,
    company_pct: Decimal,
    volume_pct: Decimal,
    cap: Decimal,
) -> dict:
    """Sequential discount: base → company → volume, clamped to global cap.

    Returns final_unit (2dp), price_after_company (2dp), effective_pct (2dp).
    Intermediate math stays at full Decimal precision to avoid rounding drift.
    """
    if not base:
        return {
            "final_unit": Decimal("0"),
            "price_after_company": Decimal("0"),
            "effective_pct": Decimal("0"),
        }

    price_after_company = base * (1 - company_pct / _HUNDRED)
    uncapped = price_after_company * (1 - volume_pct / _HUNDRED)

    effective_pct = (1 - uncapped / base) * _HUNDRED
    if effective_pct > cap:
        final = base * (1 - cap / _HUNDRED)
        effective_pct = cap
    else:
        final = uncapped

    return {
        "final_unit": final.quantize(_TWO, rounding=ROUND_HALF_UP),
        "price_after_company": price_after_company.quantize(_TWO, rounding=ROUND_HALF_UP),
        "effective_pct": effective_pct.quantize(_TWO, rounding=ROUND_HALF_UP),
    }


def quote_line(product, qty: int, company_pct: Decimal, cap: Decimal) -> dict:
    """Builds a single priced line for one product+quantity."""
    base = product.base_price
    volume_pct = pick_volume_pct(product.volume_discounts, qty)
    computed = compute_unit(base, company_pct, volume_pct, cap)
    line_total = (computed["final_unit"] * qty).quantize(_TWO, rounding=ROUND_HALF_UP)
    return {
        "product_id": product.id,
        "quantity": qty,
        "base_price": base,
        "company_pct": company_pct,
        "price_after_company": computed["price_after_company"],
        "volume_pct": volume_pct,
        "final_unit_price": computed["final_unit"],
        "effective_pct": computed["effective_pct"],
        "line_total": line_total,
    }


def quote(products_map: dict, items: list, company_pct: Decimal, cap: Decimal) -> dict:
    """Prices a list of items. Skips product IDs not found in products_map."""
    lines = []
    for item in items:
        product = products_map.get(item.product_id)
        if not product:
            continue
        lines.append(quote_line(product, item.quantity, company_pct, cap))

    def _q(d: Decimal) -> Decimal:
        return d.quantize(_TWO, rounding=ROUND_HALF_UP)

    subtotal_base = _q(sum(l["base_price"] * l["quantity"] for l in lines) if lines else Decimal("0"))
    grand_total = _q(sum(l["line_total"] for l in lines) if lines else Decimal("0"))
    total_discount = _q(subtotal_base - grand_total)

    return {
        "lines": lines,
        "subtotal_base": subtotal_base,
        "total_discount": total_discount,
        "grand_total": grand_total,
    }


# ---------------------------------------------------------------------------
# Async orchestrators — load data from DB then call pure functions
# ---------------------------------------------------------------------------


async def resolve_company_pct(
    db: AsyncSession, user, mode: str
) -> Decimal:
    """Returns company discount_percentage for the user+mode combination."""
    if user is None or user.company_id is None or mode != "COMPANY":
        return Decimal("0")
    company = await company_crud.get_company_by_id(db, user.company_id)
    return company.discount_percentage if company else Decimal("0")


async def process_quote(db: AsyncSession, request, user=None) -> dict:
    """Loads products + company discount, returns full quote dict."""
    company_pct = await resolve_company_pct(db, user, request.mode)
    cap = settings.MAX_TOTAL_DISCOUNT_PERCENT

    product_ids = [item.product_id for item in request.items]
    products = await product_crud.get_products_by_ids(db, product_ids)
    products_map = {p.id: p for p in products}

    return quote(products_map, request.items, company_pct, cap)


async def get_product_pricing_data(
    db: AsyncSession, slug: str, mode: str, user=None
) -> dict:
    """Returns ProductPricingOut dict for a given product slug and mode."""
    product = await product_crud.get_product_by_slug(db, slug)
    if not product:
        raise ProductNotFoundException()

    company_pct = await resolve_company_pct(db, user, mode)
    cap = settings.MAX_TOTAL_DISCOUNT_PERCENT

    header = compute_unit(product.base_price, company_pct, Decimal("0"), cap)

    tiers = [
        {
            "min_quantity": vd.min_quantity,
            "discount_percentage": vd.discount_percentage,
            "unit_price": compute_unit(
                product.base_price, company_pct, vd.discount_percentage, cap
            )["final_unit"],
        }
        for vd in product.volume_discounts
    ]

    return {
        "base_price": product.base_price,
        "company_discount_percentage": company_pct,
        "unit_price": header["final_unit"],
        "tiers": tiers,
    }
