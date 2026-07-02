import {
  LayoutDashboard,
  MapPin,
  Package,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import AppDashboardLayout, {
  type DashboardNavItem,
} from "../../layouts/AppDashboardLayout";
import { useAuth } from "../../hooks/user/useAuth";

const navItems: DashboardNavItem[] = [
  { to: "/company/overview", label: "Overview", icon: LayoutDashboard },
  { to: "/company/orders", label: "Orders", icon: Package },
  { to: "/company/members", label: "Members", icon: Users },
  { to: "/company/addresses", label: "Addresses", icon: MapPin },
  { to: "/company/requests", label: "Join requests", icon: UserPlus },
  { to: "/company/settings", label: "Settings", icon: Settings },
];

export default function CompanyPage() {
  const { user } = useAuth();

  return (
    <AppDashboardLayout
      brandName="Proxima"
      brandSubtitle="Lab Management"
      navItems={navItems}
      user={{
        name: user ? `${user.first_name} ${user.last_name}` : "",
        email: user?.email ?? "",
      }}
    />
  );
}
