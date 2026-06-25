import { useAuthStore, type UserRole } from "../../store/authStore";
import { useCurrentUser } from "./useCurrentUser";

/**
 * One place to read the current user's identity and role in components.
 *
 * `isAuthenticated` reflects the presence of a token; `role` and the role
 * booleans come from GET /auth/me (via useCurrentUser) and are `undefined`
 * until that request resolves — guard role-dependent UI with `isLoading`.
 */
export function useAuth() {
  const token = useAuthStore((state) => state.token);
  const { data: user, isLoading, isError } = useCurrentUser();

  const role: UserRole | undefined = user?.role;

  return {
    user,
    token,
    isAuthenticated: !!token,
    isLoading: !!token && isLoading,
    isError,
    role,
    isCustomer: role === "CUSTOMER",
    isCompanyAdmin: role === "COMPANY_ADMIN",
    isAdmin: role === "ADMIN",
    isB2B: role === "COMPANY_ADMIN" || role === "ADMIN",
  };
}
