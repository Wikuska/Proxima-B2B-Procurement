import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { LogIn } from "lucide-react";
import { signInSchema, type SignInFormData } from "../../schemas/authSchema";
import { signInUser } from "../../api/auth";
import { useAuthStore, type UserRole } from "../../store/authStore";
import { jwtDecode } from "jwt-decode";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ApiError } from "../../api/client";
import { useLocation, useNavigate } from "react-router-dom";

interface JWTPayload {
  sub: string;
  role: UserRole;
}

interface SignInFormProps {
  onSwitchToSignUp: () => void;
}

export default function SignInForm({ onSwitchToSignUp }: SignInFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

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
      const decodedToken = jwtDecode<JWTPayload>(data.access_token);
      setAuth(data.access_token, decodedToken.sub, decodedToken.role);
      const from = (location.state as { from?: string })?.from || "/";
      navigate(from, { replace: true });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
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

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          id="signin-email"
          label="Work email"
          type="email"
          placeholder="anna@yourcompany.com"
          required
          error={errors.email?.message}
          {...register("email")}
        />

        <FormInput
          id="signin-password"
          label="Password"
          type="password"
          placeholder="••••••••"
          required
          error={errors.password?.message}
          {...register("password")}
        />

        <div className="flex items-center justify-between text-sm">
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

        <FormButton
          type="submit"
          disabled={isPending}
          icon={<LogIn size={16} />}
        >
          {isPending ? "Signing in..." : "Sign in"}
        </FormButton>
      </form>

      <p className="mt-8 text-center text-sm text-text-muted">
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
