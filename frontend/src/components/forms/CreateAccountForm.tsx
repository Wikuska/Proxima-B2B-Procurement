import FormInput from "./FormInput";
import FormButton from "./FormButton";
import { UserRoundPlus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  registerSchema,
  type RegisterFormData,
} from "../../schemas/authSchema";

interface CreateAccountFormProps {
  onSwitchToSignIn: () => void;
}

export default function CreateAccountForm({
  onSwitchToSignIn,
}: CreateAccountFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    reValidateMode: "onBlur",
  });

  const onSubmit = (data: RegisterFormData) => {
    const payload = {
      email: data.email,
      first_name: data.firstName,
      last_name: data.lastName,
      password: data.password,
    };

    console.log("Data sent to backend:", payload);
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

      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <FormInput
          {...register("firstName")}
          id="firstName"
          label="First name"
          type="text"
          placeholder="Anna"
          error={errors.firstName?.message}
          required
        />
        <FormInput
          {...register("lastName")}
          id="lastName"
          label="Last name"
          type="text"
          placeholder="Kowalska"
          error={errors.lastName?.message}
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
          {...register("confirmPassword")}
          id="confirmPassword"
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          required
        />

        <FormButton
          className="mt-6"
          type="submit"
          icon={<UserRoundPlus size={16} />}
        >
          Create account
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
