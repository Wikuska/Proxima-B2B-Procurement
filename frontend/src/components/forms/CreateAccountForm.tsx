import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { UserRoundPlus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "../../schemas/authSchema";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { registerUser } from "../../api/auth";
import { ApiError } from "../../api/client";
import { usePublicConfig } from "../../hooks/usePublicConfig";

interface CreateAccountFormProps {
  onSwitchToSignIn: () => void;
  onRegistered: (email: string) => void;
}

export default function CreateAccountForm({
  onSwitchToSignIn,
  onRegistered,
}: CreateAccountFormProps) {
  const { data: publicConfig } = usePublicConfig();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    reValidateMode: "onBlur",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: registerUser,
    onSuccess: (_data, variables) => {
      if (publicConfig?.portfolio_mode) {
        toast.success(
          `Account created! Portfolio mode on — type ${publicConfig.portfolio_verification_code ?? "000000"} to verify.`,
        );
      } else {
        toast.success(
          "Account created! Enter the 6-digit code sent to your email.",
        );
      }
      onRegistered(variables.email);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        if (error.status === 400 && error.message.includes("already exists")) {
          setError("email", { message: error.message });
          return;
        }
        setError("root", { message: error.message });
      }
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    mutate(data);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-text-main">
          Create your account
        </h2>
        <p className="mt-1 text-sm text-text-muted">
          Start ordering lab supplies today
        </p>
      </div>

      <div className="mb-2 flex items-center gap-3 rounded-lg bg-accent/10 p-3 text-sm text-primary">
        <Zap size={16} />

        <span>
          <strong className="font-semibold">Fast Track</strong> - company
          auto-detected by email domain
        </span>
      </div>

      {errors.root && (
        <p className="text-sm text-red-500">{errors.root.message}</p>
      )}

      <form className="flex flex-col" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          {...register("first_name")}
          id="firstName"
          label="First name"
          type="text"
          placeholder="Anna"
          isAuth={true}
          hideLabel={false}
          error={errors.first_name?.message}
          required
        />
        <FormInput
          {...register("last_name")}
          id="lastName"
          label="Last name"
          type="text"
          placeholder="Kowalska"
          isAuth={true}
          hideLabel={false}
          error={errors.last_name?.message}
          required
        />

        <FormInput
          {...register("email")}
          id="email"
          label="Email"
          type="email"
          placeholder="anna@yourcompany.com"
          isAuth={true}
          hideLabel={false}
          error={errors.email?.message}
          required
        />

        <FormInput
          {...register("password")}
          id="password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters, 1 uppercase, 1 digit"
          isAuth={true}
          hideLabel={false}
          error={errors.password?.message}
          required
        />

        <FormInput
          {...register("confirm_password")}
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          isAuth={true}
          hideLabel={false}
          error={errors.confirm_password?.message}
          required
        />

        <FormButton
          className="mt-6"
          type="submit"
          icon={<UserRoundPlus size={16} />}
          disabled={isPending}
        >
          {isPending ? "Creating account..." : "Create account"}
        </FormButton>
      </form>

      <p className="mt-2 text-center text-sm text-text-muted">
        Already have an account?{" "}
        <button
          onClick={onSwitchToSignIn}
          className="font-semibold text-primary transition-colors hover:text-accent outline-none"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
