import type { PricingTierOut } from "../../api/pricing";

interface VolumeDiscountsProps {
  tiers: PricingTierOut[];
  nextTierMinQty?: (index: number) => number | undefined;
}

export default function VolumeDiscounts({ tiers }: VolumeDiscountsProps) {
  if (!tiers || tiers.length === 0) {
    return (
      <div className="bg-bg-surface border border-border-base/10 rounded-xl p-6 text-text-muted text-sm text-center">
        This product does not have dedicated quantity discounts.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border-base/20 rounded-xl shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead className="bg-bg-surface border-b border-border-base/20">
          <tr>
            <th className="px-6 py-4 text-sm font-semibold text-text-primary text-left">
              Minimal quantity
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-text-primary text-center">
              Discount
            </th>
            <th className="px-6 py-4 text-sm font-semibold text-text-primary text-right">
              Price per piece
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-base/20 bg-white">
          {tiers.map((tier, idx) => {
            const nextTier = tiers[idx + 1];
            const rangeText = nextTier
              ? `${tier.min_quantity} - ${nextTier.min_quantity - 1} pcs.`
              : `${tier.min_quantity}+ pcs.`;

            return (
              <tr key={idx}>
                <td className="px-6 py-4 text-sm text-text-body font-medium text-left">
                  {rangeText}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-semibold text-center">
                  -{Number(tier.discount_percentage).toFixed(0)}%
                </td>
                <td className="px-6 py-4 text-sm text-text-primary font-mono font-medium text-right">
                  ${Number(tier.unit_price).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
