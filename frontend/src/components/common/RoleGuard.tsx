import type { ReactNode } from "react";
import { useAuth } from "../../hooks/user/useAuth";
import type { UserRole } from "../../store/authStore";

interface RoleGuardProps {
  allow: UserRole[];
  children: ReactNode;
  /** Rendered when the user's role is not allowed (defaults to nothing). */
  fallback?: ReactNode;
}

/**
 * Conditionally renders content based on the current user's role.
 *
 *   <RoleGuard allow={["ADMIN"]}>...</RoleGuard>
 *
 * Renders nothing while the role is still loading, to avoid flashing
 * privileged content before /auth/me resolves.
 */
export default function RoleGuard({
  allow,
  children,
  fallback = null,
}: RoleGuardProps) {
  const { role, isLoading } = useAuth();

  if (isLoading) return null;
  if (!role || !allow.includes(role)) return <>{fallback}</>;

  return <>{children}</>;
}
