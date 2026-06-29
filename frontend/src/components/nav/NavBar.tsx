import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCategories } from "../../hooks/catalog/categories";
import { useCartView } from "../../hooks/cart/useCartView";
import CartDropdown from "../cart/CartDropdown";
import RoleGuard from "../common/RoleGuard";
import NavAuthButtons from "./NavAuthButtons";
import NavCategoryMenu from "./NavCategoryMenu";
import NavRegionMenu from "./NavRegionMenu";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `py-2 border-b-2 transition-colors ${
    isActive
      ? "text-accent border-accent"
      : "text-text-main/80 border-transparent hover:text-accent"
  }`;

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);

  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { lines } = useCartView();
  const location = useLocation();
  const isCatalogActive = location.pathname.startsWith("/catalog");

  const cartItemCount = lines.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (
        cartRef.current &&
        !cartRef.current.contains(event.target as Node)
      ) {
        setIsCartOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsCartOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>

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
                className={`transition-colors py-2 border-b-2 flex items-center gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                  isCatalogActive
                    ? "text-accent border-accent"
                    : "text-text-main/80 border-transparent hover:text-accent"
                }`}
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

          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>

          <RoleGuard allow={["COMPANY_ADMIN", "ADMIN"]}>
            <NavLink to="/company" className={navLinkClass}>
              Company
            </NavLink>
          </RoleGuard>
        </nav>

        <div className="flex items-center gap-6 h-full">
          <div className="relative" ref={cartRef}>
            <button
              onClick={() => setIsCartOpen((prev) => !prev)}
              aria-haspopup="true"
              aria-expanded={isCartOpen}
              aria-label="Open cart"
              className="relative p-2 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center"
            >
              <ShoppingCart size={22} strokeWidth={2} />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </button>
            {isCartOpen && (
              <CartDropdown onClose={() => setIsCartOpen(false)} />
            )}
          </div>

          <NavRegionMenu isDisabled={true} />

          <div className="flex items-center gap-4 border-l border-border-base/40 pl-6 h-6">
            <NavAuthButtons />
          </div>
        </div>
      </div>
    </header>
  );
}
