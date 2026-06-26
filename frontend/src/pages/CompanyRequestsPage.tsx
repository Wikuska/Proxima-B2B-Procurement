import { toast } from "sonner";
import {
  usePendingCompanyRequests,
  useReviewCompanyRequest,
} from "../hooks/company/requests";

export default function CompanyRequestsPage() {
  const { data: requests, isLoading } = usePendingCompanyRequests();
  const { mutate: review, isPending } = useReviewCompanyRequest();

  const handleReview = (id: string, approve: boolean) => {
    review(
      { id, approve },
      {
        onSuccess: () => {
          toast.success(approve ? "Request approved." : "Request rejected.");
        },
        onError: (error) => {
          toast.error(error.message || "Action failed.");
        },
      },
    );
  };

  return (
    <div className="max-w-3xl mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold text-text-main mb-6">
        Pending Join Requests
      </h1>

      {isLoading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : !requests?.length ? (
        <p className="text-text-muted text-sm">No pending requests.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((req) => (
            <li
              key={req.id}
              className="flex justify-between items-center p-4 bg-bg-surface border border-border-base/20 rounded-xl"
            >
              <div>
                <p className="font-semibold text-text-main">
                  {req.user.first_name} {req.user.last_name}
                </p>
                <p className="text-sm text-text-muted">{req.user.email}</p>
                <p className="text-xs font-mono text-text-muted mt-1">
                  NIP: {req.requested_nip}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleReview(req.id, true)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleReview(req.id, false)}
                  disabled={isPending}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
