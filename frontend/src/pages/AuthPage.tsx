import { useState } from "react";
import CreateAccountForm from "../components/forms/CreateAccountForm";
import SignInForm from "../components/forms/SignInForm";
import FormButton from "../components/forms/FormButton";
import { FlaskConical } from "lucide-react";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-bg-base p-4 sm:p-8">
      <div className="flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-bg-surface shadow-2xl min-h-[800px] lg:flex-row lg:h-[740px]">
        <div className="relative flex w-full flex-col bg-primary p-10 text-white lg:w-2/5 lg:h-full justify-between">
          <div className="absolute inset-0 bg-gradient-to-br from-accent/20 to-transparent pointer-events-none" />

          <div className="mb-12 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2A7862] border border-[#3A947A]">
              <FlaskConical size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold leading-none tracking-tight">
                Proxima
              </span>
              <span className="mt-1 text-[10px] font-bold tracking-widest text-[#72CBB0] uppercase">
                Lab Supply
              </span>
            </div>
          </div>

          <div className="relative z-10 flex-grow">
            <h1 className="text-4xl font-bold leading-snug tracking-tight sm:text-5xl">
              Professional lab
              <br />
              supplies for research
              <br />& industry
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-blue-100/90 max-w-md">
              From reagents to equipment — order as an individual or connect
              your organization for B2B pricing and invoicing.
            </p>
          </div>

          <div className="relative z-10 mt-8 text-sm text-blue-200/50">
            &copy; {new Date().getFullYear()} Proxima Lab Supply
          </div>
        </div>

        <div className="relative flex w-full flex-col p-6 sm:p-12 lg:w-2/3 lg:h-full">
          <div className="mb-6 flex self-start w-full sm:w-auto gap-8 flex-shrink-0">
            <FormButton
              variant="tab"
              isActive={authMode === "signin"}
              onClick={() => setAuthMode("signin")}
            >
              Sign in
            </FormButton>

            <FormButton
              variant="tab"
              isActive={authMode === "signup"}
              onClick={() => setAuthMode("signup")}
            >
              Create account
            </FormButton>
          </div>

          <div className="flex flex-grow items-center justify-center overflow-y-auto pr-1 w-full">
            {authMode === "signin" ? (
              <SignInForm onSwitchToSignUp={() => setAuthMode("signup")} />
            ) : (
              <CreateAccountForm
                onSwitchToSignIn={() => setAuthMode("signin")}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
