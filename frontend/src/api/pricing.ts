import apiFetch from "./client";

export interface LinePricingOut {
  product_id: string;
  quantity: number;
  base_price: string;
  company_pct: string;
  price_after_company: string;
  volume_pct: string;
  final_unit_price: string;
  effective_pct: string;
  line_total: string;
}

export interface QuoteOut {
  lines: LinePricingOut[];
  subtotal_base: string;
  total_discount: string;
  grand_total: string;
}

export interface PricingTierOut {
  min_quantity: number;
  discount_percentage: string;
  unit_price: string;
}

export interface ProductPricingOut {
  base_price: string;
  company_discount_percentage: string;
  unit_price: string;
  tiers: PricingTierOut[];
}

export interface QuoteItem {
  product_id: string;
  quantity: number;
}

export const getProductPricing = (slug: string, mode: string) =>
  apiFetch<ProductPricingOut>(`/pricing/product/${slug}?mode=${mode}`, {
    method: "GET",
  });

export const quoteCart = (items: QuoteItem[], mode: string) =>
  apiFetch<QuoteOut>("/pricing/quote", {
    method: "POST",
    body: { items, mode },
  });
