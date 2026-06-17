import apiFetch from "./client";
import { type User } from "./user";

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
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: payload,
  });
};

export const verifyEmail = (token: string) => {
  return apiFetch<{ message: string }>(`/auth/verify?token=${token}`);
};

export const signInUser = (payload: SignInPayload) => {
  return apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: payload,
  });
};
