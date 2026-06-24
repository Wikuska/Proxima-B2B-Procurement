import { type ProductVolumeDiscountOut } from "../../api/catalog";

interface VolumeDiscountsProps {
  discounts: ProductVolumeDiscountOut[];
  basePrice: number;
}

export default function VolumeDiscounts({
  discounts,
  basePrice,
}: VolumeDiscountsProps) {
  if (!discounts || discounts.length === 0) {
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
          {discounts.map((discount, idx) => {
            const pct = parseFloat(discount.discount_percentage);
            const calculatedPrice = basePrice * (1 - pct / 100);

            const nextDiscount = discounts[idx + 1];
            const rangeText = nextDiscount
              ? `${discount.min_quantity} - ${nextDiscount.min_quantity - 1} pcs.`
              : `${discount.min_quantity}+ pcs.`;

            return (
              <tr key={idx}>
                <td className="px-6 py-4 text-sm text-text-body font-medium text-left">
                  {rangeText}
                </td>
                <td className="px-6 py-4 text-sm text-green-600 font-semibold text-center">
                  -{pct}%
                </td>
                <td className="px-6 py-4 text-sm text-text-primary font-mono font-medium text-right">
                  ${calculatedPrice.toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
