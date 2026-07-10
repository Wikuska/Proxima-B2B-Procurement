import apiFetch from "./client";
import type { UserRole } from "../store/authStore";

interface MessageResponse {
  message: string;
}

export interface VerificationSessionResponse {
  resend_cooldown_seconds: number;
  code_sent: boolean;
  is_verified: boolean;
}

// Mirrors the backend UserOut schema (snake_case field names).
export interface CurrentUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  hide_b2b_prompts: boolean;
  company_id: string | null;
  created_at: string;
}

interface RegisterPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
}

interface SignInPayload {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const registerUser = (payload: RegisterPayload) => {
  return apiFetch<MessageResponse>("/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const verifyEmailCode = (payload: { email: string; code: string }) => {
  return apiFetch<MessageResponse>("/auth/verify", {
    method: "POST",
    body: payload,
  });
};

export const resendVerificationCode = (email: string) => {
  return apiFetch<MessageResponse>("/auth/resend-verification", {
    method: "POST",
    body: { email },
  });
};

export const prepareVerificationSession = (email: string) => {
  return apiFetch<VerificationSessionResponse>("/auth/verification-session", {
    method: "POST",
    body: { email },
  });
};

export const signInUser = (payload: SignInPayload) => {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
};

export const getMe = () => {
  return apiFetch<CurrentUser>("/auth/me");
};
