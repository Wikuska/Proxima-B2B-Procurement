interface AdminPlaceholderTabProps {
  title: string;
  description: string;
}

/** Temporary tab body until platform-admin APIs are wired. */
export default function AdminPlaceholderTab({
  title,
  description,
}: AdminPlaceholderTabProps) {
  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          {title}
        </h2>
        <p className="text-text-muted">{description}</p>
      </div>
      <div className="rounded-xl border border-dashed border-border-base/40 bg-bg-surface px-6 py-10 text-center">
        <p className="text-sm text-text-muted">
          This section will be connected to platform admin APIs next.
        </p>
      </div>
    </div>
  );
}
