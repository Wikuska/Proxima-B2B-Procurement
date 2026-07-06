import { Clock, Mail, Phone } from "lucide-react";
import type { ComponentType } from "react";

export interface Department {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  email: string;
  phone: string;
  hours: string;
}

interface DepartmentCardProps {
  department: Department;
}

export default function DepartmentCard({ department }: DepartmentCardProps) {
  const { icon: Icon, title, description, email, phone, hours } = department;

  return (
    <div className="flex flex-col gap-4 bg-bg-surface border border-border-base/20 rounded-2xl p-6">
      <div className="w-11 h-11 flex items-center justify-center rounded-xl bg-accent/25">
        <Icon size={20} className="text-primary" />
      </div>

      <div>
        <h3 className="font-semibold text-text-main mb-1">{title}</h3>
        <p className="text-sm text-text-muted">{description}</p>
      </div>

      <div className="flex flex-col gap-2 mt-1">
        <a
          href={`mailto:${email}`}
          className="flex items-center gap-2 text-sm text-text-main hover:text-accent transition-colors"
        >
          <Mail size={15} className="text-text-muted shrink-0" />
          {email}
        </a>
        <a
          href={`tel:${phone.replace(/\s+/g, "")}`}
          className="flex items-center gap-2 text-sm text-text-main hover:text-accent transition-colors"
        >
          <Phone size={15} className="text-text-muted shrink-0" />
          {phone}
        </a>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Clock size={15} className="shrink-0" />
          {hours}
        </div>
      </div>
    </div>
  );
}
