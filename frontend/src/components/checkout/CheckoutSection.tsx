import type { ReactNode } from "react";

interface CheckoutSectionProps {
  title: ReactNode;
  description?: string;
  headerAside?: ReactNode;
  /** Use with section-level `space-y-*` — title gets no bottom margin. */
  stacked?: boolean;
  className?: string;
  children: ReactNode;
}

export default function CheckoutSection({
  title,
  description,
  headerAside,
  stacked = false,
  className = "",
  children,
}: CheckoutSectionProps) {
  const titleClass = stacked
    ? "text-xl font-bold text-text-main"
    : description
      ? "text-xl font-bold text-text-main mb-1"
      : "text-xl font-bold text-text-main mb-4";

  return (
    <section
      className={`bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm ${className}`}
    >
      {headerAside ? (
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-text-main">{title}</h2>
          {headerAside}
        </div>
      ) : (
        <>
          <h2 className={titleClass}>{title}</h2>
          {description && (
            <p className="mb-4 text-xs text-text-muted">{description}</p>
          )}
        </>
      )}

      {children}
    </section>
  );
}
