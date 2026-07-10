import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { LogIn } from "lucide-react";
import { signInSchema, type SignInFormData } from "../../schemas/authSchema";
import { signInUser } from "../../api/auth";
import { useAuthStore } from "../../store/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

interface SignInFormProps {
  onSwitchToSignUp: () => void;
  /**
   * Optional override for the post-login redirect, used by `AuthModal` to
   * close the modal and return to (or past) the background page instead of
   * the default `navigate(from || "/")`.
   */
  onSuccess?: (from: string) => void;
  onEmailNotVerified?: (email: string) => void;
}

export default function SignInForm({
  onSwitchToSignUp,
  onSuccess,
  onEmailNotVerified,
}: SignInFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const setToken = useAuthStore((state) => state.setToken);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: signInUser,
    onSuccess: (data) => {
      // Store only the token — identity/role come from GET /auth/me.
      setToken(data.access_token);
      // Discard any cached profile so the next render fetches the new user.
      queryClient.removeQueries({ queryKey: ["me"] });
      const from =
        (location.state as { from?: string })?.from ??
        searchParams.get("from") ??
        "";
      if (onSuccess) {
        onSuccess(from);
      } else {
        navigate(from || "/", { replace: true });
      }
    },
    onError: (error, variables) => {
      if (error instanceof ApiError) {
        if (
          error.status === 403 &&
          error.message.toLowerCase().includes("not verified")
        ) {
          onEmailNotVerified?.(variables.email);
          return;
        }
        if (error.status < 500) {
          setError("root", { message: error.message });
          return;
        }
      }
    },
  });

  const onSubmit = (data: SignInFormData) => {
    mutate(data);
  };

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

      <form onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="signin-email"
          label="Work email"
          type="email"
          placeholder="anna@yourcompany.com"
          isAuth={true}
          hideLabel={false}
          required
          error={errors.email?.message}
          {...register("email")}
        />

        <div>
          <FormInput
            id="signin-password"
            label="Password"
            type="password"
            placeholder="••••••••"
            isAuth={true}
            hideLabel={false}
            required
            error={errors.password?.message}
            {...register("password")}
          />

          <div className="flex items-center justify-between text-sm mt-4 mb-3">
            {errors.root ? (
              <p className="text-sm text-red-500">{errors.root.message}</p>
            ) : (
              <span />
            )}
            <a
              href="#"
              className="font-semibold text-primary hover:text-accent transition-colors"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <FormButton
          type="submit"
          disabled={isPending}
          icon={<LogIn size={16} />}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </FormButton>
      </form>

      <p className="mt-2 text-center text-sm text-text-muted">
        Don't have an account?{" "}
        <button
          onClick={onSwitchToSignUp}
          type="button"
          className="font-semibold text-primary hover:text-accent transition-colors"
        >
          Create account
        </button>
      </p>
    </div>
  );
}
