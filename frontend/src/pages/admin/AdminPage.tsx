import { ClipboardList, PackageOpen } from "lucide-react";
import AppDashboardLayout, {
  type DashboardNavItem,
} from "../../layouts/AppDashboardLayout";
import { useAuth } from "../../hooks/user/useAuth";

const navItems: DashboardNavItem[] = [
  { to: "/admin/catalog", label: "Catalog", icon: PackageOpen },
  { to: "/admin/orders", label: "Orders", icon: ClipboardList },
];

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <AppDashboardLayout
      brandName="Proxima"
      brandSubtitle="Platform Admin"
      navItems={navItems}
      user={{
        name: user ? `${user.first_name} ${user.last_name}` : "",
        email: user?.email ?? "",
      }}
    />
  );
}
