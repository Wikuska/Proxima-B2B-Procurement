import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/user/useAuth";
import type { UserRole } from "../../store/authStore";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, only these roles may enter; others are sent home. */
  allow?: UserRole[];
}

/**
 * Wraps routes that require authentication (and optionally a specific role).
 *
 * Unauthenticated users are redirected to the full-page `/auth` (not the
 * modal) with the attempted path so they can be returned after signing in.
 * This is a deliberate trade-off: a server-side redirect has no prior client
 * location to use as `backgroundLocation`, so the blurred-modal treatment
 * only applies when auth is opened client-side (nav buttons, cart CTAs).
 */
export default function ProtectedRoute({
  children,
  allow,
}: ProtectedRouteProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading, role } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  // Token present but profile still loading — wait before deciding on role.
  if (isLoading) return null;

  if (allow && (!role || !allow.includes(role))) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
