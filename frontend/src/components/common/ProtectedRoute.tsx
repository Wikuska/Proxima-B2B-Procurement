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
 * Not wired into any route yet — provided for upcoming roadmap steps
 * (dashboards, account pages). Unauthenticated users are redirected to /auth
 * with the attempted path so they can be returned after signing in.
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
