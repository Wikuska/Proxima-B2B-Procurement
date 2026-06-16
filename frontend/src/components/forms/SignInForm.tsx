import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { LogIn } from "lucide-react";

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export default function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text-main">
          Sign in to your account
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Welcome back! Please enter your details
        </p>
      </div>

      <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
        <FormInput
          id="signin-email"
          label="Work email"
          type="email"
          placeholder="anna@yourcompany.com"
          required
        />

        <FormInput
          id="signin-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-text-main cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-border-base text-primary focus:ring-border-focus"
            />
            <span>Remember me</span>
          </label>
          <a
            href="#"
            className="font-semibold text-primary hover:text-accent transition-colors"
          >
            Forgot password?
          </a>
        </div>

        <FormButton type="submit" icon={<LogIn size={16} />}>
          Sign in
        </FormButton>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
        Don't have an account?{" "}
        <button
          onClick={onSwitchToSignUp}
          className="font-semibold text-primary hover:text-accent transition-colors"
        >
          Create account
        </button>
      </p>
    </div>
  );
}
