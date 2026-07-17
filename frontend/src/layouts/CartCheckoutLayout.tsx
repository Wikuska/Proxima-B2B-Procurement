import type { ReactNode } from "react";

interface CartCheckoutLayoutProps {
  header: ReactNode;
  children: ReactNode;
}

export default function CartCheckoutLayout({
  header,
  children,
}: CartCheckoutLayoutProps) {
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-8 flex h-16 items-center border-b border-border-base/20">
        {header}
      </div>
      {children}
    </div>
  );
}

interface TwoColumnProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function TwoColumn({
  children,
  sidebar,
  className = "",
}: TwoColumnProps) {
  return (
    <div
      className={`grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start ${className}`}
    >
      <div className="min-w-0 space-y-8">{children}</div>
      {sidebar}
    </div>
  );
}
