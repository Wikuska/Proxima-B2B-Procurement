import { create } from "zustand";
import { persist, devtools } from "zustand/middleware";

export type UserRole = "CUSTOMER" | "COMPANY_ADMIN" | "ADMIN";

interface AuthState {
  token: string | null;
  userId: string | null;
  role: UserRole | null;

  // Derived booleans — computed from role, never stored in localStorage
  isCustomer: boolean;
  isCompanyAdmin: boolean;
  isAdmin: boolean;
  isB2B: boolean;

  // Actions
  setAuth: (token: string, userId: string, role: UserRole) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set) => ({
        token: null,
        userId: null,
        role: null,
        isCustomer: false,
        isCompanyAdmin: false,
        isAdmin: false,
        isB2B: false,

        setAuth: (token, userId, role) => {
          set({
            token,
            userId,
            role,
            isCustomer: role === "CUSTOMER",
            isCompanyAdmin: role === "COMPANY_ADMIN",
            isAdmin: role === "ADMIN",
            isB2B: role === "COMPANY_ADMIN" || role === "ADMIN",
          });
        },

        clearAuth: () =>
          set({
            token: null,
            userId: null,
            role: null,
            isCustomer: false,
            isCompanyAdmin: false,
            isAdmin: false,
            isB2B: false,
          }),
      }),
      {
        name: "auth-storage",

        // Only persist the source of truth — booleans are recomputed on rehydration
        partialize: (state) => ({
          token: state.token,
          userId: state.userId,
          role: state.role,
        }),

        // Recompute derived booleans after localStorage is read on page load
        onRehydrateStorage: () => (state) => {
          if (state?.role) {
            state.isCustomer = state.role === "CUSTOMER";
            state.isCompanyAdmin = state.role === "COMPANY_ADMIN";
            state.isAdmin = state.role === "ADMIN";
            state.isB2B =
              state.role === "COMPANY_ADMIN" || state.role === "ADMIN";
          }
        },
      },
    ),
  ),
);
