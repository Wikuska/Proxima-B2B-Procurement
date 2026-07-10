import { Link } from "react-router-dom";
import { SearchX } from "lucide-react";

interface NotFoundPageProps {
  /** Full viewport centering when rendered outside MainLayout. */
  standalone?: boolean;
}

export default function NotFoundPage({
  standalone = false,
}: NotFoundPageProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center px-4 py-12 text-center ${
        standalone ? "min-h-screen" : "min-h-[50vh] flex-1"
      }`}
    >
      <SearchX className="mb-4 h-16 w-16 text-border-base" />
      <h1 className="mb-2 text-2xl font-bold text-text-main">Page not found</h1>
      <p className="mb-6 max-w-md text-text-muted">
        The page you are looking for does not exist or may have been moved.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="rounded-md bg-primary px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-accent"
        >
          Back to home
        </Link>
        <Link
          to="/catalog"
          className="rounded-md border border-border-base/40 px-6 py-2 text-sm font-medium text-text-main transition-colors hover:border-accent hover:text-accent"
        >
          Browse catalog
        </Link>
      </div>
    </div>
  );
}
