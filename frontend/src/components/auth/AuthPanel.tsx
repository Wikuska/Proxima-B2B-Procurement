import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import CreateAccountForm from "../forms/CreateAccountForm";
import SignInForm from "../forms/SignInForm";
import VerifyEmailForm from "../forms/VerifyEmailForm";
import {
  clearPendingVerificationEmail,
  getPendingVerificationEmail,
  setPendingVerificationEmail,
} from "../../utils/pendingVerification";

type AuthMode = "signin" | "signup" | "verify";

interface AuthPanelProps {
  /**
   * Called after a successful sign-in with the resolved redirect target
   * (`location.state.from`, or `""` when none was set). When omitted,
   * `SignInForm` falls back to its default `navigate(from || "/")` behavior.
   */
  onSignInSuccess?: (from: string) => void;
}

/**
 * Sign-in, registration, and email verification forms for `AuthModal`.
 */
export default function AuthPanel({ onSignInSuccess }: AuthPanelProps) {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>(() => {
    if (getPendingVerificationEmail()) return "verify";
    return searchParams.get("mode") === "register" ? "signup" : "signin";
  });
  const [pendingEmail, setPendingEmail] = useState(
    () => getPendingVerificationEmail() ?? "",
  );

  const handleRegistered = (email: string) => {
    setPendingVerificationEmail(email);
    setPendingEmail(email);
    setAuthMode("verify");
  };

  const handleVerified = () => {
    clearPendingVerificationEmail();
    setAuthMode("signin");
  };

  const handleSignInInstead = () => {
    setAuthMode("signin");
  };

  const handleEmailNotVerified = (email: string) => {
    setPendingEmail(email);
    setPendingVerificationEmail(email);
    setAuthMode("verify");
  };

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto p-6 sm:p-12">
      {authMode === "signin" && (
        <SignInForm
          onSwitchToSignUp={() => setAuthMode("signup")}
          onSuccess={onSignInSuccess}
          onEmailNotVerified={handleEmailNotVerified}
        />
      )}
      {authMode === "signup" && (
        <CreateAccountForm
          onSwitchToSignIn={() => setAuthMode("signin")}
          onRegistered={handleRegistered}
        />
      )}
      {authMode === "verify" && pendingEmail && (
        <VerifyEmailForm
          email={pendingEmail}
          onVerified={handleVerified}
          onSignInInstead={handleSignInInstead}
        />
      )}
    </div>
  );
}
