import { Link } from "react-router-dom";
import { SearchX, ServerCrash, Loader2 } from "lucide-react";

type ErrorStateType = "not-found" | "error" | "empty" | "loading";

interface ErrorStateProps {
  type: ErrorStateType;
  message?: string;
}

export default function ErrorState({ type, message }: ErrorStateProps) {
  const containerClasses =
    "h-[60vh] flex flex-col items-center justify-center px-4 text-center";

  if (type === "loading") {
    return (
      <div className={`${containerClasses} text-text-muted`}>
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-accent" />
        <p>{message || "Loading content..."}</p>
      </div>
    );
  }

  if (type === "not-found") {
    return (
      <div className={`${containerClasses} text-text-muted`}>
        <SearchX className="w-16 h-16 mb-4 text-border-base" />
        <h2 className="text-2xl font-bold text-text-main mb-2">
          Category Not Found
        </h2>
        <p className="mb-6 max-w-md">{message}</p>
        <Link
          to="/products"
          className="px-6 py-2 bg-accent text-white rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Browse all products
        </Link>
      </div>
    );
  }

  if (type === "error") {
    return (
      <div className={`${containerClasses} text-red-500`}>
        <ServerCrash className="w-12 h-12 mb-4" />
        <p className="text-lg font-medium">Failed to load catalog.</p>
        {message && <p className="text-sm mt-1">Error details: {message}</p>}
        <p className="text-sm mt-4 text-text-muted">
          Please try refreshing the page or contact support if the issue
          persists.
        </p>
      </div>
    );
  }

  return (
    <div className={`${containerClasses} text-text-muted`}>
      <ServerCrash className="w-12 h-12 mb-4 opacity-50" />
      <p className="text-lg font-medium">Data fetching issue.</p>
      <p className="text-sm mt-1">
        {message || "Received an empty response from the server."}
      </p>
    </div>
  );
}
