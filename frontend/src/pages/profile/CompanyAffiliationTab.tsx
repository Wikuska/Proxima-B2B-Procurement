import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormButton from "../../components/forms/FormButton";
import FormInput from "../../components/forms/FormInput";
import {
  useLeaveCompany,
  useMyCompanyRequests,
  useSubmitCompanyRequest,
} from "../../hooks/company/requests";
import { useAuth } from "../../hooks/user/useAuth";
import {
  joinCompanySchema,
  type JoinCompanyFormData,
} from "../../schemas/companySchema";

export default function CompanyAffiliationTab() {
  const { user } = useAuth();
  const { data: requests, isLoading: loadingRequests } = useMyCompanyRequests();
  const { mutate: submit, isPending: isSubmitting } = useSubmitCompanyRequest();
  const { mutate: leave, isPending: isLeaving } = useLeaveCompany();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinCompanyFormData>({
    resolver: zodResolver(joinCompanySchema),
  });

  const onSubmit = (data: JoinCompanyFormData) => {
    const nip = data.requested_nip.replace(/[\s-]/g, "");
    submit(
      { requested_nip: nip },
      {
        onSuccess: () => {
          toast.success("Join request sent successfully.");
          reset();
        },
        onError: (error) => {
          toast.error(error.message || "Failed to submit request.");
        },
      },
    );
  };

  const handleLeave = () => {
    if (!window.confirm("Are you sure you want to leave your company?")) return;
    leave(undefined, {
      onSuccess: () => toast.success("You have left the company."),
      onError: (error) => toast.error(error.message || "Failed to leave company."),
    });
  };

  if (user?.company_id) {
    return (
      <div className="max-w-lg space-y-4">
        <p className="text-text-main">
          You're affiliated with a company. To join a different one, leave the
          current company first.
        </p>
        <button
          onClick={handleLeave}
          disabled={isLeaving}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors"
        >
          {isLeaving ? "Leaving..." : "Leave company"}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-10">
        <FormInput
          id="requested_nip"
          label="Company NIP"
          placeholder="e.g. 1234567890"
          error={errors.requested_nip?.message}
          {...register("requested_nip")}
        />
        <FormButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Sending..." : "Send Request"}
        </FormButton>
      </form>

      <section>
        <h2 className="text-lg font-semibold text-text-main mb-3">
          My Requests
        </h2>
        {loadingRequests ? (
          <p className="text-text-muted text-sm">Loading...</p>
        ) : !requests?.length ? (
          <p className="text-text-muted text-sm">No requests yet.</p>
        ) : (
          <ul className="space-y-2">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex justify-between items-center p-3 bg-bg-surface border border-border-base/20 rounded-lg text-sm"
              >
                <span className="font-mono text-text-main">
                  {req.requested_nip}
                </span>
                <span
                  className={`font-semibold ${
                    req.status === "APPROVED"
                      ? "text-green-600"
                      : req.status === "REJECTED"
                        ? "text-red-500"
                        : "text-yellow-600"
                  }`}
                >
                  {req.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
