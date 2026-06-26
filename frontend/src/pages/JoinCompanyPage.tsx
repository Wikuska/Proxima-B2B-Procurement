import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import FormButton from "../components/forms/FormButton";
import FormInput from "../components/forms/FormInput";
import {
  useMyCompanyRequests,
  useSubmitCompanyRequest,
} from "../hooks/company/requests";
import { useAuth } from "../hooks/user/useAuth";
import {
  joinCompanySchema,
  type JoinCompanyFormData,
} from "../schemas/companySchema";

export default function JoinCompanyPage() {
  const { user } = useAuth();
  const { data: requests, isLoading: loadingRequests } =
    useMyCompanyRequests();
  const { mutate: submit, isPending } = useSubmitCompanyRequest();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinCompanyFormData>({
    resolver: zodResolver(joinCompanySchema),
  });

  if (user?.company_id) {
    return (
      <div className="max-w-lg mx-auto mt-16 p-6 bg-bg-surface rounded-xl border border-border-base/20 text-center">
        <p className="text-text-main font-semibold">
          You are already assigned to a company.
        </p>
      </div>
    );
  }

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

  return (
    <div className="max-w-lg mx-auto mt-16 px-4">
      <h1 className="text-2xl font-bold text-text-main mb-6">
        Join a Company
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mb-10">
        <FormInput
          id="requested_nip"
          label="Company NIP"
          placeholder="e.g. 1234567890"
          error={errors.requested_nip?.message}
          {...register("requested_nip")}
        />
        <FormButton type="submit" disabled={isPending}>
          {isPending ? "Sending..." : "Send Request"}
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
