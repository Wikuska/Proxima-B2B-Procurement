import { type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  /**
   * Slightly taller input density for auth-like forms (login/register).
   * Defaults to `false` (compact).
   */
  isAuth?: boolean;
  /** Hide the visible label — use in compact/dense forms that rely on placeholders. */
  hideLabel?: boolean;
}

export default function FormInput({
  label,
  id,
  error,
  isAuth = false,
  hideLabel = true,
  ...props
}: FormInputProps) {
  const inputPadding = isAuth ? "px-3 py-2.5" : "px-3 py-2";

  return (
    <div className="flex w-full flex-col">
      {hideLabel ? (
        <label className="sr-only" htmlFor={id}>
          {label}
        </label>
      ) : (
        <div className="mb-1 flex items-baseline justify-between gap-3">
          <label
            className="block text-sm font-medium text-text-main"
            htmlFor={id}
          >
            {label}
          </label>
          {isAuth ? (
            <span className="text-right mt-3 text-[11px] font-semibold leading-tight text-red-500 min-h-[1rem]">
              {error ?? ""}
            </span>
          ) : null}
        </div>
      )}

      <input
        id={id}
        className={`w-full rounded-lg border bg-bg-surface ${inputPadding} text-sm text-text-main outline-none transition-colors 
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-border-base focus:border-border-focus focus:ring-1 focus:ring-border-focus"
            }
          `}
        {...props}
      />

      {/* Keep a stable error area so layout doesn't jump when errors appear.
          For auth-style inputs we show the error next to the label instead. */}
      {!isAuth && (
        <div className="mt-1 h-4">
          {error ? (
            <span className="block text-right text-[11px] font-semibold leading-tight text-red-500">
              {error}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
