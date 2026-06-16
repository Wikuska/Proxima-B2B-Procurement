import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../utils/cn";

interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  icon?: ReactNode;
  variant?: "primary" | "tab";
  isActive?: boolean;
}

export default function FormButton({
  children,
  icon,
  variant = "primary",
  isActive = false,
  className,
  ...props
}: FormButtonProps) {
  const tabStyles = `px-4 py-1.5 rounded-full text-sm font-medium transition-all outline-none ${
    isActive
      ? "bg-primary text-white"
      : "text-text-muted hover:text-text-main hover:bg-bg-base"
  }`;

  const primaryStyles = `w-full flex items-center justify-center gap-2 rounded-lg bg-primary py-3 font-semibold text-white transition-colors duration-200 hover:bg-accent`;

  return (
    <button
      className={cn(variant === "tab" ? tabStyles : primaryStyles, className)}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
}
