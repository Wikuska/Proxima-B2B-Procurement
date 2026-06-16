import { type InputHTMLAttributes } from "react";

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
}

export default function FormInput({
  label,
  id,
  error,
  ...props
}: FormInputProps) {
  return (
    <div className="relative w-full">
      <label
        className="mb-1 block text-sm font-medium text-text-main"
        htmlFor={id}
      >
        {label}
      </label>

      <input
        id={id}
        className={`w-full rounded-lg border bg-bg-surface p-2.5 text-text-main outline-none transition-colors 
            ${
              error
                ? "border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500"
                : "border-border-base focus:border-border-focus focus:ring-1 focus:ring-border-focus"
            }
          `}
        {...props}
      />
      {error && (
        <span className="absolute right-0 top-[calc(100%+2px)] text-[11px] font-semibold text-red-500 leading-tight">
          {error}
        </span>
      )}
    </div>
  );
}
