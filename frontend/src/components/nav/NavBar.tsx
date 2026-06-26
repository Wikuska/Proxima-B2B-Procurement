import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCategories } from "../../hooks/catalog/categories";
import { useAuth } from "../../hooks/user/useAuth";
import RoleGuard from "../common/RoleGuard";
import NavAuthButtons from "./NavAuthButtons";
import NavCategoryMenu from "./NavCategoryMenu";

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="bg-bg-surface shadow-sm sticky top-0 z-50 border-b border-border-base/10">
      <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
        <Link
          to="/"
          className="text-2xl font-bold text-primary tracking-wide flex items-center"
        >
          proxima<span className="text-accent">.</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium h-full">
          <Link
            to="/"
            className="text-accent border-b-2 border-accent py-2 transition-colors"
          >
            Home
          </Link>

          <div className="relative flex items-center h-full" ref={dropdownRef}>
            {isError ? (
              <button
                onClick={() => refetch()}
                className="hover:text-accent text-red-400 transition-colors py-2 border-b-2 border-transparent flex items-center gap-1 text-sm"
                title="Failed to load categories — click to retry"
              >
                Categories
                <span className="text-[10px]">↺</span>
              </button>
            ) : (
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoading}
                className="hover:text-accent text-text-main/80 transition-colors py-2 border-b-2 border-transparent flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Loading..." : "Categories"}
                {!isLoading && (
                  <span
                    className={`text-[10px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                  >
                    ▼
                  </span>
                )}
              </button>
            )}

            {isDropdownOpen && categories && (
              <NavCategoryMenu
                categories={categories}
                onClose={() => setIsDropdownOpen(false)}
              />
            )}
          </div>

          <Link
            to="/contact"
            className="hover:text-accent text-text-main/80 transition-colors py-2 border-b-2 border-transparent"
          >
            Contact
          </Link>

          <RoleGuard allow={["COMPANY_ADMIN", "ADMIN"]}>
            <Link
              to="/company"
              className="hover:text-accent text-text-main/80 transition-colors py-2 border-b-2 border-transparent"
            >
              Company
            </Link>
          </RoleGuard>

          {isAuthenticated && user?.company_id == null && (
            <Link
              to="/join-company"
              className="hover:text-accent text-text-main/80 transition-colors py-2 border-b-2 border-transparent"
            >
              Join a company
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-6">
          <Link
            to="/cart"
            className="relative p-2 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center"
          >
            <ShoppingCart size={22} strokeWidth={2} />
            <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          <div className="flex items-center gap-4 border-l border-border-base/40 pl-6 h-6">
            <NavAuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
}
