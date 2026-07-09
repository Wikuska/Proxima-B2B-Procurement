import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg-base px-4 text-center">
      <ShieldX className="mb-4 h-16 w-16 text-border-base" />
      <h1 className="mb-2 text-2xl font-bold text-text-main">Access denied</h1>
      <p className="mb-6 max-w-md text-text-muted">
        You do not have permission to view this section. Contact your company
        administrator if you believe this is a mistake.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/profile"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          Go to profile
        </Link>
        <Link
          to="/"
          className="rounded-md border border-border-base/40 px-6 py-2 text-sm font-medium text-text-main transition-colors hover:border-accent hover:text-accent"
        >
          Back to store
        </Link>
      </div>
    </div>
  );
}
