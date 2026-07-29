import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import AdminPlaceholderTab from "./AdminPlaceholderTab";

export default function AdminProductCreatePage() {
  return (
    <div className="space-y-4 w-full">
      <Link
        to="/admin/catalog"
        className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
      >
        <ArrowLeft size={16} />
        Back to catalog
      </Link>
      <AdminPlaceholderTab
        title="Add product"
        description="Create form will be wired in the next catalog slice."
      />
    </div>
  );
}
