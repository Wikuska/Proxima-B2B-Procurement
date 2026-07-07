import type { ComponentType } from "react";

export interface Location {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  address: string;
}

interface LocationCardProps {
  location: Location;
}

export default function LocationCard({ location }: LocationCardProps) {
  const { icon: Icon, title, address } = location;

  return (
    <div className="flex items-start gap-3 bg-bg-surface border border-border-base/20 rounded-xl p-4">
      <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-accent/25 shrink-0">
        <Icon size={17} className="text-primary" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-text-main">{title}</h4>
        <p className="text-sm text-text-muted">{address}</p>
      </div>
    </div>
  );
}
