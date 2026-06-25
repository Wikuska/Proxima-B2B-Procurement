import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { getMe, type CurrentUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { ApiError } from "../../api/client";

/**
 * Fetches the authenticated user from GET /auth/me — the source of truth for
 * identity and role. Only runs when a token is present. If the token is
 * rejected (401), the local session is cleared so the UI falls back to guest.
 */
export function useCurrentUser() {
  const token = useAuthStore((state) => state.token);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const query = useQuery<CurrentUser>({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!token,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) {
      clearAuth();
    }
  }, [query.error, clearAuth]);

  return query;
}
