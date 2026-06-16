import apiFetch from "./client";
import { type User } from "./user";

interface RegisterPayload {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

export const registerUser = (payload: RegisterPayload) => {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: {
      email: payload.email,
      first_name: payload.firstName,
      last_name: payload.lastName,
      password: payload.password,
    },
  });
};

export const verifyEmail = (token: string) => {
  return apiFetch<{ message: string }>(`/auth/verify?token=${token}`);
};
