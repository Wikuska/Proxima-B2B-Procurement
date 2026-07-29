import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Panel from "../../components/common/Panel";
import { useAdminProduct } from "../../hooks/admin/useAdminCatalog";

export default function AdminProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading, isError } = useAdminProduct(productId);

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading product…</p>;
  if (isError || !product)
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-red-500">Product not found.</p>
      </div>
    );

  return (
    <div className="space-y-6 w-full max-w-3xl">
      <BackLink />

      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          {product.name}
        </h2>
        <p className="text-text-muted font-mono text-sm">{product.sku}</p>
      </div>

      <Panel title="Product details">
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4 text-sm">
          <Detail label="Category" value={product.category.name} />
          <Detail label="Slug" value={product.slug} mono />
          <Detail
            label="Base price"
            value={`$${Number(product.base_price).toFixed(2)}`}
            mono
          />
          <Detail label="Stock" value={String(product.stock_quantity)} mono />
          <Detail
            label="Status"
            value={product.is_active ? "Active" : "Inactive"}
          />
          <Detail
            label="B2B only"
            value={product.is_b2b_only ? "Yes" : "No"}
          />
          <div className="sm:col-span-2">
            <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Description
            </dt>
            <dd className="mt-1 text-text-main whitespace-pre-wrap">
              {product.description?.trim() || "—"}
            </dd>
          </div>
          {product.main_image_url && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Image URL
              </dt>
              <dd className="mt-1 text-text-muted break-all font-mono text-xs">
                {product.main_image_url}
              </dd>
            </div>
          )}
        </dl>
      </Panel>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/catalog"
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
    >
      <ArrowLeft size={16} />
      Back to catalog
    </Link>
  );
}

function Detail({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-text-muted">
        {label}
      </dt>
      <dd
        className={`mt-1 text-text-main ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}
