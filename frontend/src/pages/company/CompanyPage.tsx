import DashboardLayout, {
  type TabItem,
} from "../../layouts/DashboardLayout";

const tabs: TabItem[] = [
  { to: "/company/requests", label: "Join requests" },
  { to: "/company/orders", label: "Company orders" },
  { to: "/company/members", label: "Company members" },
  { to: "/company/addresses", label: "Addresses" },
];

export default function CompanyPage() {
  return <DashboardLayout title="Company Management" tabs={tabs} />;
}
