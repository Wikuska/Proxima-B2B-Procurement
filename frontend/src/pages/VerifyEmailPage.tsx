// pages/VerifyEmailPage.tsx
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { verifyEmail } from "../api/auth";
import { DEFAULT_AUTH_BACKGROUND, openAuth } from "../utils/openAuth";

interface VerifyLayoutProps {
  icon: "success" | "error" | "loading";
  title: string;
  message: string;
  children?: ReactNode;
}

function VerifyLayout({ icon, title, message, children }: VerifyLayoutProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-base p-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-surface p-10 text-center shadow-xl">
        {icon === "success" && <div className="text-5xl mb-4">✓</div>}
        {icon === "error" && <div className="text-5xl mb-4">✗</div>}
        {icon === "loading" && (
          <div className="text-5xl mb-4 animate-spin">⟳</div>
        )}
        <h1 className="text-xl font-semibold text-text-main mb-2">{title}</h1>
        <p className="text-sm text-text-muted mb-6">{message}</p>
        {children}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["verify-email", token],
    queryFn: () => verifyEmail(token!),
    enabled: !!token,
    retry: false,
  });

  useEffect(() => {
    if (!data) return;
    const timer = setTimeout(
      () => openAuth(navigate, DEFAULT_AUTH_BACKGROUND),
      5000,
    );
    return () => clearTimeout(timer);
  }, [data, navigate]);

  if (!token) {
    return (
      <VerifyLayout
        icon="error"
        title="Invalid link"
        message="No token found in the URL."
      />
    );
  }

  if (isLoading) {
    return (
      <VerifyLayout
        icon="loading"
        title="Verifying your email..."
        message="Please wait a moment."
      />
    );
  }

  if (isError) {
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return (
      <VerifyLayout
        icon="error"
        title="Verification failed"
        message={message}
      />
    );
  }

  return (
    <VerifyLayout
      icon="success"
      title="Email verified!"
      message="Your account is ready. Redirecting to login in 5 seconds..."
    >
      <button onClick={() => openAuth(navigate, DEFAULT_AUTH_BACKGROUND)}>
        Go to login now
      </button>
    </VerifyLayout>
  );
}
