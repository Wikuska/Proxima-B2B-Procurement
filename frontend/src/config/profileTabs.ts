export interface TabItem {
  to: string;
  label: string;
}

export const profileTabs: TabItem[] = [
  { to: "/profile/company-affiliation", label: "Company Affiliation" },
  { to: "/profile/orders", label: "My Orders" },
  { to: "/profile/addresses", label: "Shipping Addresses" },
];
