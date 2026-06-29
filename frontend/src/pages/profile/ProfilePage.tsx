import DashboardLayout from "../../layouts/DashboardLayout";
import { profileTabs } from "../../config/profileTabs";

export default function ProfilePage() {
  return <DashboardLayout title="My Profile" tabs={profileTabs} />;
}
