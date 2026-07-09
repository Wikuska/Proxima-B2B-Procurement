import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/user/useAuth";
import type { UserRole } from "../../store/authStore";
import { DEFAULT_AUTH_BACKGROUND } from "../../utils/openAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, only these roles may enter; others are sent home. */
  allow?: UserRole[];
}

/**
 * Wraps routes that require authentication (and optionally a specific role).
 *
 * Unauthenticated users are redirected to the `/auth` modal with the attempted
 * path stored in `from` and the home page as the background.
 */
export default function ProtectedRoute({
  children,
  allow,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, role } = useAuth();

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to="/auth"
        replace
        state={{ from, backgroundLocation: DEFAULT_AUTH_BACKGROUND }}
      />
    );
  }

  // Token present but profile still loading — wait before deciding on role.
  if (isLoading) return null;

  if (allow && (!role || !allow.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
