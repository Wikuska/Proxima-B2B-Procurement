import { Link } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useLocation, useNavigate } from "react-router-dom";

export default function NavAuthButtons() {
  const { token, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (token) {
    return (
      <>
        <Link
          to="/profile"
          className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <User size={15} />
          My Account
        </Link>
        <button
          onClick={clearAuth}
          className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-1.5"
        >
          <LogOut size={15} />
          Log out
        </button>
      </>
    );
  }

  return (
    <>
      <button
        onClick={() =>
          navigate("/auth", { state: { from: location.pathname } })
        }
        className="text-sm font-medium hover:text-accent transition-colors self-center"
      >
        Log in
      </button>
      <Link
        to="/auth?mode=register"
        className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold px-4 py-2 rounded-md transition-all shadow-sm"
      >
        Register
      </Link>
    </>
  );
}
