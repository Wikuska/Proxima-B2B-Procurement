import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  prepareVerificationSession,
  resendVerificationCode,
  verifyEmailCode,
} from "../../api/auth";
import { ApiError } from "../../api/client";
import {
  verifyCodeSchema,
  type VerifyCodeFormData,
} from "../../schemas/authSchema";
import { cn } from "../../utils/cn";
import { usePublicConfig } from "../../hooks/usePublicConfig";
import FormButton from "./FormButton";

const RESEND_COOLDOWN_SECONDS = 60;
const OTP_LENGTH = 6;

interface VerifyEmailFormProps {
  email: string;
  onVerified: () => void;
  onSignInInstead: () => void;
}

export default function VerifyEmailForm({
  email,
  onVerified,
  onSignInInstead,
}: VerifyEmailFormProps) {
  const [digits, setDigits] = useState<string[]>(
    Array.from({ length: OTP_LENGTH }, () => ""),
  );
  const [lockedOut, setLockedOut] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [sessionReady, setSessionReady] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { data: publicConfig } = usePublicConfig();

  const {
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<VerifyCodeFormData>({
    resolver: zodResolver(verifyCodeSchema),
    defaultValues: { code: "" },
  });

  const applySession = (session: {
    resend_cooldown_seconds: number;
    code_sent: boolean;
    is_verified: boolean;
  }) => {
    if (session.is_verified) {
      onVerified();
      return;
    }

    setResendCooldown(session.resend_cooldown_seconds);
    if (session.code_sent) {
      setLockedOut(false);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      clearErrors();
      toast.success("A new verification code has been sent.");
      inputRefs.current[0]?.focus();
    }
  };

  const sessionMutation = useMutation({
    mutationFn: () => prepareVerificationSession(email),
    onSuccess: (session) => {
      applySession(session);
      setSessionReady(true);
    },
    onError: (error) => {
      setSessionReady(true);
      if (error instanceof ApiError && error.status < 500) {
        toast.error(error.message);
      }
    },
  });

  useEffect(() => {
    sessionMutation.mutate();
    // Run once per email when the verify step opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  useEffect(() => {
    if (sessionReady) {
      inputRefs.current[0]?.focus();
    }
  }, [sessionReady]);

  useEffect(() => {
    setValue("code", digits.join(""));
  }, [digits, setValue]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = window.setInterval(() => {
      setResendCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => verifyEmailCode({ email, code }),
    onSuccess: () => {
      toast.success("Email verified! You can sign in now.");
      onVerified();
    },
    onError: (error) => {
      if (!(error instanceof ApiError)) return;

      if (error.status === 429) {
        setLockedOut(true);
        setError("root", { message: error.message });
        return;
      }

      if (error.status < 500) {
        setError("root", { message: error.message });
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => resendVerificationCode(email),
    onSuccess: () => {
      setLockedOut(false);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setDigits(Array.from({ length: OTP_LENGTH }, () => ""));
      clearErrors();
      inputRefs.current[0]?.focus();
      toast.success("A new verification code has been sent.");
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 429) {
        const match = error.message.match(/(\d+)\s+second/);
        if (match) {
          setResendCooldown(Number(match[1]));
        }
        toast.error(error.message);
        return;
      }
      if (error instanceof ApiError) {
        toast.error(error.message);
      }
    },
  });

  const inputDisabled =
    !sessionReady ||
    lockedOut ||
    verifyMutation.isPending ||
    resendMutation.isPending ||
    sessionMutation.isPending;

  const updateDigits = (nextDigits: string[]) => {
    clearErrors("root");
    setDigits(nextDigits);
  };

  const handleDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    updateDigits(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    event.preventDefault();
    const nextDigits = Array.from({ length: OTP_LENGTH }, (_, index) => {
      return pasted[index] ?? "";
    });
    updateDigits(nextDigits);

    const focusIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[focusIndex]?.focus();
  };

  const onSubmit = (data: VerifyCodeFormData) => {
    verifyMutation.mutate(data.code);
  };

  return (
    <div className="w-full max-w-md animate-fade-in">
      <div className="mb-8 text-center">
        <h2 className="text-2xl font-bold text-text-main">Email verification</h2>
        <p className="mt-2 text-sm text-text-muted">
          Enter the 6-digit code sent to{" "}
          <span className="font-medium text-text-main">{email}</span>
        </p>
        {publicConfig?.portfolio_mode && (
          <p className="mt-4 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-text-main">
            Portfolio mode on — type{" "}
            <span className="font-semibold">
              {publicConfig.portfolio_verification_code ?? "000000"}
            </span>{" "}
            for quick verification.
          </p>
        )}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <div
            className="flex justify-center gap-2 sm:gap-3"
            role="group"
            aria-label="Verification code"
          >
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(element) => {
                  inputRefs.current[index] = element;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? "one-time-code" : "off"}
                maxLength={1}
                value={digit}
                disabled={inputDisabled}
                aria-label={`Digit ${index + 1}`}
                onChange={(event) =>
                  handleDigitChange(index, event.target.value)
                }
                onKeyDown={(event) => handleDigitKeyDown(index, event)}
                onPaste={handlePaste}
                className={cn(
                  "h-12 w-10 rounded-lg border bg-bg-surface text-center text-lg font-semibold text-text-main outline-none transition-colors sm:h-14 sm:w-12",
                  errors.code || errors.root
                    ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                    : "border-border-base focus:border-border-focus focus:ring-1 focus:ring-border-focus",
                  inputDisabled && "cursor-not-allowed opacity-50",
                )}
              />
            ))}
          </div>

          {(errors.code?.message || errors.root?.message) && (
            <p className="mt-3 text-center text-sm text-red-500">
              {errors.root?.message ?? errors.code?.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <FormButton type="submit" disabled={inputDisabled}>
            {verifyMutation.isPending ? "Verifying..." : "Verify email"}
          </FormButton>

          <button
            type="button"
            disabled={
              resendCooldown > 0 || resendMutation.isPending || inputDisabled
            }
            onClick={() => resendMutation.mutate()}
            className="w-full rounded-lg border border-border-base bg-bg-surface py-3 text-sm font-semibold text-primary transition-colors hover:border-border-focus hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendCooldown > 0
              ? `Resend code in ${resendCooldown}s`
              : resendMutation.isPending
                ? "Sending..."
                : "Resend code"}
          </button>
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-text-muted">
        Already verified?{" "}
        <button
          type="button"
          onClick={onSignInInstead}
          className="font-semibold text-primary transition-colors hover:text-accent"
        >
          Sign in
        </button>
      </p>
    </div>
  );
}
