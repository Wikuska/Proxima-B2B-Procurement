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
import { registerUser } from "../../api/auth";
import { ApiError } from "../../api/client";

interface CreateAccountFormProps {
  onSwitchToSignIn: () => void;
}

export default function CreateAccountForm({
  onSwitchToSignIn,
}: CreateAccountFormProps) {
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
    onSuccess: () => {
      console.log(
        "Account created successfully! Please check your email to verify your account.",
      );
      onSwitchToSignIn();
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

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          {...register("first_name")}
          id="firstName"
          label="First name"
          type="text"
          placeholder="Anna"
          error={errors.first_name?.message}
          required
        />
        <FormInput
          {...register("last_name")}
          id="lastName"
          label="Last name"
          type="text"
          placeholder="Kowalska"
          error={errors.last_name?.message}
          required
        />

        <FormInput
          {...register("email")}
          id="email"
          label="Email"
          type="email"
          placeholder="anna@yourcompany.com"
          error={errors.email?.message}
          required
        />

        <FormInput
          {...register("password")}
          id="password"
          label="Password"
          type="password"
          placeholder="Min. 8 characters, 1 uppercase, 1 digit"
          error={errors.password?.message}
          required
        />

        <FormInput
          {...register("confirm_password")}
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
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
