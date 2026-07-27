import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import Panel from "../../components/common/Panel";
import FormButton from "../../components/forms/FormButton";
import FormInput from "../../components/forms/FormInput";
import {
  useLeaveCompany,
  useMyAffiliation,
  useMyCompanyRequests,
  useSubmitCompanyRequest,
} from "../../hooks/company/requests";
import { useAuth } from "../../hooks/user/useAuth";
import {
  joinCompanySchema,
  type JoinCompanyFormData,
} from "../../schemas/companySchema";

const formatNip = (nip: string) => {
  const cleaned = nip.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return nip;
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: "bg-green-500/10 text-green-600 border border-green-500/20",
  REJECTED: "bg-red-500/10 text-red-500 border border-red-500/20",
  PENDING: "bg-yellow-500/10 text-yellow-600 border border-yellow-500/20",
};

function AffiliationCard({
  onLeave,
  isLeaving,
}: {
  onLeave: () => void;
  isLeaving: boolean;
}) {
  const { data: affiliation, isLoading } = useMyAffiliation();

  if (isLoading || !affiliation) {
    return <p className="text-text-muted text-sm">Loading...</p>;
  }

  const isAdmin = affiliation.role === "COMPANY_ADMIN";
  const discount = parseFloat(affiliation.discount_percentage);
  const joinedAt = affiliation.joined_at
    ? new Date(affiliation.joined_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <div className="w-full h-full flex flex-col">
      <Panel
        title={affiliation.company_name}
        description={`NIP: ${formatNip(affiliation.company_nip)}`}
      >
        <div className="divide-y divide-border-base/20">
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-text-muted">Role</span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isAdmin
                  ? "bg-primary/10 text-primary"
                  : "bg-border-base/20 text-text-main"
              }`}
            >
              {isAdmin ? "Administrator" : "Employee"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-text-muted">Company discount</span>
            <span className="text-sm font-bold text-text-main">
              {discount > 0 ? `${discount}%` : "No discount"}
            </span>
          </div>
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-text-muted">Member since</span>
            <span className="text-sm font-bold text-text-main">{joinedAt}</span>
          </div>
        </div>
      </Panel>

      <div className="mt-auto pt-6 border-t border-border-base/30">
        <h3 className="text-sm font-semibold text-red-600 mb-1">Danger Zone</h3>
        <p className="text-xs text-text-muted mb-4 leading-relaxed">
          Leaving the company will revoke your access to corporate discounts and
          administrative tools. To join a different company, you must leave the
          current one first.
        </p>
        <button
          onClick={onLeave}
          disabled={isLeaving}
          className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
        >
          {isLeaving ? "Leaving..." : "Leave company"}
        </button>
      </div>
    </div>
  );
}

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
      onError: (error) =>
        toast.error(error.message || "Failed to leave company."),
    });
  };

  if (user?.company_id) {
    return <AffiliationCard onLeave={handleLeave} isLeaving={isLeaving} />;
  }

  return (
    <div className="w-full grid md:grid-cols-2 gap-6 items-start">
      <Panel
        title="Join a Company"
        description="Enter the NIP of your company to request an affiliation."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormInput
            id="requested_nip"
            label="Company NIP"
            placeholder="e.g. 123-456-78-90"
            isAuth
            hideLabel={false}
            error={errors.requested_nip?.message}
            {...register("requested_nip")}
          />
          <FormButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send Request"}
          </FormButton>
        </form>
      </Panel>

      <Panel title="My Requests">
        {loadingRequests ? (
          <p className="text-text-muted text-sm">Loading...</p>
        ) : !requests?.length ? (
          <div className="flex flex-col items-center justify-center p-8 bg-bg-base border border-dashed border-border-base/40 rounded-lg">
            <p className="text-text-muted text-sm text-center">
              You haven't sent any requests yet.
            </p>
          </div>
        ) : (
          <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {requests.map((req) => (
              <li
                key={req.id}
                className="flex justify-between items-center p-3.5 bg-bg-base border border-border-base/40 rounded-lg shadow-sm"
              >
                <span className="font-mono text-sm text-text-main">
                  {formatNip(req.requested_nip)}
                </span>
                <span
                  className={`text-[11px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[req.status] ||
                    "bg-border-base/20 text-text-main"
                  }`}
                >
                  {req.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
