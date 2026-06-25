import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "COMPANY_ADMIN" | "ADMIN";

interface AuthState {
  // The JWT is the only thing we persist — it proves identity. The user's role
  // and profile are the source-of-truth from GET /auth/me (see useCurrentUser),
  // never cached here, so they can't go stale against the backend.
  token: string | null;

  setToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        setToken: (token) => set({ token }),
        clearAuth: () => set({ token: null }),
      }),
      {
        name: "auth-storage",
        partialize: (state) => ({ token: state.token }),
      },
    ),
  ),
);
