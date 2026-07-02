import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import CreateAccountForm from "../forms/CreateAccountForm";
import SignInForm from "../forms/SignInForm";

type AuthMode = "signin" | "signup";

interface AuthPanelProps {
  /**
   * Called after a successful sign-in with the resolved redirect target
   * (`location.state.from`, or `""` when none was set). When omitted,
   * `SignInForm` falls back to its default `navigate(from || "/")` behavior.
   */
  onSignInSuccess?: (from: string) => void;
}

/**
 * Sign-in/create-account form area, shared between the full-page `AuthPage`
 * and the route-addressable `AuthModal`. Mode switching happens via the
 * link at the bottom of each form (no separate tab switcher — it would just
 * duplicate that link).
 */
export default function AuthPanel({ onSignInSuccess }: AuthPanelProps) {
  const [searchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<AuthMode>(
    searchParams.get("mode") === "register" ? "signup" : "signin",
  );

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-y-auto p-6 sm:p-12">
      {authMode === "signin" ? (
        <SignInForm
          onSwitchToSignUp={() => setAuthMode("signup")}
          onSuccess={onSignInSuccess}
        />
      ) : (
        <CreateAccountForm onSwitchToSignIn={() => setAuthMode("signin")} />
      )}
    </div>
  );
}
