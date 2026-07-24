import type { ReactNode } from "react";

interface PanelProps {
  title: ReactNode;
  description?: string;
  headerAside?: ReactNode;
  /** Use with section-level `space-y-*` — title gets no bottom margin. */
  stacked?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Shared content card: white surface, md padding, bold xl title.
 * Used across checkout, order detail, and profile.
 */
export default function Panel({
  title,
  description,
  headerAside,
  stacked = false,
  className = "",
  children,
}: PanelProps) {
  const titleClass = stacked
    ? "text-xl font-bold text-text-main"
    : description
      ? "text-xl font-bold text-text-main mb-1"
      : "text-xl font-bold text-text-main mb-4";

  return (
    <section
      className={`bg-bg-surface border border-border-base/20 rounded-2xl p-6 shadow-sm ${className}`}
    >
      {(headerAside || description) ? (
        <div className="mb-4">
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-xl font-bold text-text-main">{title}</h2>
            {headerAside}
          </div>
          {description && (
            <p className="mt-1 text-xs text-text-muted">{description}</p>
          )}
        </div>
      ) : (
        <h2 className={titleClass}>{title}</h2>
      )}

      {children}
    </section>
  );
}
