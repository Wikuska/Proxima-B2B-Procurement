import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, User } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { useAuth } from "../../hooks/user/useAuth";
import { profileTabs } from "../../config/profileTabs";

export default function NavAuthButtons() {
  const { token, clearAuth } = useAuthStore();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (token) {
    return (
      <>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsOpen((prev) => !prev)}
            className="text-sm font-medium hover:text-accent transition-colors flex items-center gap-1.5"
          >
            <User size={15} />
            {user?.first_name ?? "Account"}
            <ChevronDown
              size={13}
              className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 mt-7 w-48 bg-bg-surface border border-border-base/20 rounded-xl shadow-lg py-1 z-50">
              {profileTabs.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setIsOpen(false)}
                  className="block px-4 py-2 text-sm text-text-main hover:bg-accent/10 hover:text-primary transition-colors"
                >
                  {label}
                </Link>
              ))}
              <hr className="my-1 border-border-base/20" />
              <button
                onClick={() => {
                  setIsOpen(false);
                  clearAuth();
                }}
                className="w-full text-left px-4 py-2 text-sm text-text-main hover:bg-accent/10 hover:text-primary transition-colors"
              >
                Log out
              </button>
            </div>
          )}
        </div>
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
