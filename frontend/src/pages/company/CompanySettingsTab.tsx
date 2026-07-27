import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Panel from "../../components/common/Panel";
import FormInput from "../../components/forms/FormInput";
import {
  useCompanyMembers,
  useCompanySettings,
  useTransferCompanyOwnership,
  useUpdateCompanySettings,
} from "../../hooks/company/requests";
import { useAuth } from "../../hooks/user/useAuth";
import {
  companySettingsSchema,
  type CompanySettingsFormData,
} from "../../schemas/companySchema";

const formatNip = (nip: string) => {
  const cleaned = nip.replace(/\D/g, "");
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`;
  }
  return nip;
};

export default function CompanySettingsTab() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: settings, isLoading, isError } = useCompanySettings();
  const { data: members = [] } = useCompanyMembers();
  const { mutate: updateSettings, isPending: isSaving } =
    useUpdateCompanySettings();
  const { mutate: transferOwnership, isPending: isTransferring } =
    useTransferCompanyOwnership();
  const [transferTargetId, setTransferTargetId] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CompanySettingsFormData>({
    resolver: zodResolver(companySettingsSchema),
    defaultValues: { name: "", phone: "" },
  });

  useEffect(() => {
    if (!settings) return;
    reset({
      name: settings.name,
      phone: settings.phone ?? "",
    });
  }, [settings, reset]);

  const transferCandidates = useMemo(
    () =>
      members.filter(
        (m) =>
          m.id !== user?.id && m.role !== "COMPANY_ADMIN" && m.role !== "ADMIN",
      ),
    [members, user?.id],
  );

  const onSave = (data: CompanySettingsFormData) => {
    updateSettings(
      {
        name: data.name.trim(),
        phone: data.phone?.trim() ? data.phone.trim() : null,
      },
      {
        onSuccess: () => toast.success("Company details saved."),
        onError: (error) =>
          toast.error(error.message || "Failed to save settings."),
      },
    );
  };

  const onTransfer = () => {
    if (!transferTargetId || !settings) return;
    const target = members.find((m) => m.id === transferTargetId);
    const targetName = target
      ? `${target.first_name} ${target.last_name}`.trim() || target.email
      : "this member";

    const confirmed = window.confirm(
      `Transfer company ownership to ${targetName}?\n\nYou will become a regular member and lose access to the company dashboard.`,
    );
    if (!confirmed) return;

    transferOwnership(transferTargetId, {
      onSuccess: () => {
        toast.success("Ownership transferred. You are now a company member.");
        navigate("/", { replace: true });
      },
      onError: (error) =>
        toast.error(error.message || "Failed to transfer ownership."),
    });
  };

  if (isLoading)
    return <p className="text-sm text-text-muted">Loading settings…</p>;
  if (isError || !settings)
    return <p className="text-sm text-red-500">Failed to load settings.</p>;

  const discount = parseFloat(settings.discount_percentage);

  return (
    <div className="space-y-4 w-full">
      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          Settings
        </h2>
        <p className="text-text-muted mb-5">
          Manage company profile and ownership.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Panel
          className="lg:col-span-2"
          title="Company details"
          description="NIP and discount are managed by the platform."
        >
          <form onSubmit={handleSubmit(onSave)}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                id="name"
                label="Company name"
                hideLabel={false}
                error={errors.name?.message}
                {...register("name")}
              />
              <FormInput
                id="phone"
                label="Phone"
                hideLabel={false}
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="mb-1 text-sm font-medium text-text-main">NIP</p>
                <p className="px-3 py-2 text-sm font-mono text-text-muted bg-bg-base border border-border-base/40 rounded-lg">
                  {formatNip(settings.nip)}
                </p>
              </div>
              <div>
                <p className="mb-1 text-sm font-medium text-text-main">
                  Company discount
                </p>
                <p className="px-3 py-2 text-sm text-text-muted bg-bg-base border border-border-base/40 rounded-lg">
                  {discount > 0 ? `${discount}%` : "No discount"}
                </p>
              </div>
            </div>

            {(isDirty || isSaving) && (
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50 shadow-sm"
                >
                  {isSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            )}
          </form>
        </Panel>

        <Panel
          className="lg:col-span-1 border-red-600"
          title="Transfer ownership"
          description="Transfer the company admin role to another member. You will lose dashboard access."
        >
          {transferCandidates.length === 0 ? (
            <p className="text-sm text-text-muted">
              No eligible members. Approve a join request or invite a member
              before transferring ownership.
            </p>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="transfer-target"
                  className="mb-1 block text-sm font-medium text-text-main"
                >
                  New company admin
                </label>
                <select
                  id="transfer-target"
                  value={transferTargetId}
                  onChange={(e) => setTransferTargetId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border-base/40 bg-bg-base text-text-main focus:outline-none focus:border-border-focus"
                >
                  <option value="">Select a member…</option>
                  {transferCandidates.map((m) => {
                    const name =
                      `${m.first_name} ${m.last_name}`.trim() || m.email;
                    return (
                      <option key={m.id} value={m.id}>
                        {name} ({m.email})
                      </option>
                    );
                  })}
                </select>
              </div>

              {(transferTargetId || isTransferring) && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onTransfer}
                    disabled={isTransferring}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-md transition-colors shadow-sm"
                  >
                    {isTransferring ? "Transferring…" : "Transfer ownership"}
                  </button>
                </div>
              )}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
