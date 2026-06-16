import { useAuthStore } from "../store/authStore";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

interface FastApiValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export class ApiError extends Error {
  status: number;
  validationErrors?: FastApiValidationError[];

  constructor(
    status: number,
    message: string,
    validationErrors?: FastApiValidationError[],
  ) {
    super(message);
    this.status = status;
    this.validationErrors = validationErrors;
    this.name = "ApiError";
  }
}

interface ApiOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface FastApiErrorResponse {
  detail?: string | FastApiValidationError[];
}

function parseErrorMessage(errorData: FastApiErrorResponse): string {
  if (!errorData?.detail) return "Something went wrong";

  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((e: FastApiValidationError) => `${e.loc.at(-1)}: ${e.msg}`)
      .join(", ");
  }

  return String(errorData.detail);
}

export default async function apiFetch<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const { body, ...customConfig } = options;

  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    // Only set Content-Type if we have a body  avoids issues with GET/DELETE requests
    ...(body ? { "Content-Type": "application/json" } : {}),
    ...((customConfig.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...customConfig,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(`${API_URL}${path}`, config);

  if (res.status === 401) {
    const isAuthRoute = path.startsWith("/auth");

    if (!isAuthRoute) {
      useAuthStore.getState().clearAuth();
      window.location.href = "/auth";
      return Promise.reject(new Error("Session expired"));
    }

    const errorData = await res.json().catch(() => ({}));

    // Preserve raw validation errors for form field mapping
    if (Array.isArray(errorData.detail)) {
      throw new ApiError(
        res.status,
        parseErrorMessage(errorData),
        errorData.detail,
      );
    }

    throw new ApiError(res.status, parseErrorMessage(errorData));
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));

    // Preserve raw validation errors for form field mapping
    if (Array.isArray(errorData.detail)) {
      throw new ApiError(
        res.status,
        parseErrorMessage(errorData),
        errorData.detail,
      );
    }

    throw new ApiError(res.status, parseErrorMessage(errorData));
  }

  // 204 No Content — no body to parse (e.g. DELETE endpoints)
  if (res.status === 204) return {} as T;

  return await res.json();
}
