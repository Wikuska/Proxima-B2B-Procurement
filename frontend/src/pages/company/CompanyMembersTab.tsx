import { toast } from "sonner";
import {
  useCompanyMembers,
  useRemoveCompanyMember,
} from "../../hooks/company/requests";
import { useAuth } from "../../hooks/user/useAuth";

export default function CompanyMembersTab() {
  const { user: currentUser } = useAuth();
  const { data: members, isLoading } = useCompanyMembers();
  const { mutate: remove, isPending } = useRemoveCompanyMember();

  const handleRemove = (userId: string, name: string) => {
    remove(userId, {
      onSuccess: () => {
        toast.success(`${name} removed from the company.`);
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove member.");
      },
    });
  };

  if (isLoading) return <p className="text-text-muted text-sm">Loading...</p>;

  if (!members?.length)
    return <p className="text-text-muted text-sm">No members found.</p>;

  const self = members.find((m) => m.id === currentUser?.id);
  const others = members.filter((m) => m.id !== currentUser?.id);

  return (
    <div className="space-y-8">
      {self && (
        <section>
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
            You
          </h2>
          <div className="flex justify-between items-center p-5 bg-bg-surface border border-border-base/40 rounded-xl shadow-sm">
            <div>
              <p className="font-semibold text-text-main text-lg">
                {self.first_name} {self.last_name}
              </p>
              <p className="text-sm text-text-muted">{self.email}</p>
            </div>
            <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full">
              Admin
            </span>
          </div>
        </section>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
            Members
          </h2>
          <ul className="space-y-3">
            {others.map((member) => (
              <li
                key={member.id}
                className="flex justify-between items-center p-5 bg-bg-surface border border-border-base/40 rounded-xl shadow-sm transition-shadow hover:shadow-md"
              >
                <div>
                  <p className="font-semibold text-text-main">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-sm text-text-muted">{member.email}</p>
                </div>
                <button
                  onClick={() =>
                    handleRemove(
                      member.id,
                      `${member.first_name} ${member.last_name}`,
                    )
                  }
                  disabled={isPending}
                  className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
