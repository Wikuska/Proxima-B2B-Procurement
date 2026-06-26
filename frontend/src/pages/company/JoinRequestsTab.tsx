import { toast } from "sonner";
import {
  usePendingCompanyRequests,
  useReviewCompanyRequest,
} from "../../hooks/company/requests";

export default function JoinRequestsTab() {
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

  if (isLoading) return <p className="text-text-muted text-sm">Loading...</p>;

  if (!requests?.length)
    return <p className="text-text-muted text-sm">No pending requests.</p>;

  return (
    <section>
      <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
        Pending Requests
      </h2>
      <ul className="space-y-3">
        {requests.map((req) => (
          <li
            key={req.id}
            className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center p-5 bg-bg-surface border border-border-base/30 rounded-xl shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-text-main text-lg">
                {req.user.first_name} {req.user.last_name}
              </p>
              <p className="text-sm text-text-muted">{req.user.email}</p>
              <p className="text-xs text-text-muted opacity-75 mt-0.5">
                NIP: {req.requested_nip}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => handleReview(req.id, true)}
                disabled={isPending}
                className="px-4 py-2 bg-green-50 text-green-700 hover:bg-green-600 hover:text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Approve
              </button>
              <button
                onClick={() => handleReview(req.id, false)}
                disabled={isPending}
                className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
