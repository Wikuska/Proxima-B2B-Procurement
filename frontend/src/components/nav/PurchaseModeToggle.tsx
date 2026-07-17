import { useAuth } from "../../hooks/user/useAuth";
import PurchaseModeSelector from "../cart/PurchaseModeSelector";

export default function PurchaseModeToggle() {
  const { user } = useAuth();

  if (!user?.company_id) return null;

  return <PurchaseModeSelector variant="compact" />;
}
