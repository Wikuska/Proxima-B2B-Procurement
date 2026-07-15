import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Search, ShoppingCart, X } from "lucide-react";
import { useCategories } from "../../hooks/catalog/categories";
import { useCartView } from "../../hooks/cart/useCartView";
import { useDelayedUnmount } from "../../hooks/common/useDelayedUnmount";
import ProductSearchInput from "../catalog/ProductSearchInput";
import CartDropdown from "../cart/CartDropdown";
import NavAuthButtons from "./NavAuthButtons";
import NavCategoryMenu from "./NavCategoryMenu";
import NavRegionMenu from "./NavRegionMenu";
import PurchaseModeToggle from "./PurchaseModeToggle";

const DROPDOWN_EXIT_DURATION_MS = 100;
const SEARCH_EXPAND_DURATION_MS = 200;

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `py-2 border-b-2 transition-colors whitespace-nowrap ${
    isActive
      ? "text-accent border-accent"
      : "text-text-main/80 border-transparent hover:text-accent"
  }`;

export default function NavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isCatalogActive = location.pathname.startsWith("/catalog");

  const catalogQuery = isCatalogActive
    ? new URLSearchParams(location.search).get("q")?.trim() ?? ""
    : "";

  const locationKey = `${location.pathname}${location.search}`;
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);

  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    if (isSearchOpen) setIsSearchOpen(false);
  }

  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { lines } = useCartView();

  const shouldRenderCategoryMenu = useDelayedUnmount(
    isDropdownOpen,
    DROPDOWN_EXIT_DURATION_MS,
  );

  const shouldRenderSearch = useDelayedUnmount(
    isSearchOpen,
    SEARCH_EXPAND_DURATION_MS,
  );

  const cartItemCount = lines.length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
      if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
        setIsCartOpen(false);
      }
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsCartOpen(false);
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleNavSearch = (term: string) => {
    setIsSearchOpen(false);
    navigate(`/catalog?q=${encodeURIComponent(term)}`);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setIsDropdownOpen(false);
    setIsCartOpen(false);
  };

  return (
    <header
      ref={searchRef}
      className="bg-bg-surface shadow-sm sticky top-0 z-50 border-b border-border-base/10"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center gap-3">
        <div className="flex-1 flex items-center min-w-0">
          <Link
            to="/"
            className={`text-2xl font-bold text-primary tracking-wide ${
              isSearchOpen ? "hidden sm:flex" : "flex"
            }`}
          >
            pro<span className="text-accent">xima</span>.
          </Link>
        </div>

        {!isSearchOpen ? (
          <nav className="hidden md:flex items-center justify-center gap-8 text-sm font-medium h-full shrink-0">
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

              {shouldRenderCategoryMenu && categories && (
                <NavCategoryMenu
                  categories={categories}
                  isOpen={isDropdownOpen}
                  onClose={() => setIsDropdownOpen(false)}
                />
              )}
            </div>

            <NavLink to="/contact" className={navLinkClass}>
              Contact
            </NavLink>
          </nav>
        ) : (
          <div className="flex-1 min-w-0 max-w-xl flex items-center justify-center px-2">
            {shouldRenderSearch && (
              <ProductSearchInput
                key={`${locationKey}-${isSearchOpen}`}
                defaultValue={catalogQuery}
                size="nav"
                autoFocus={isSearchOpen}
                showSuggestions
                onSearch={handleNavSearch}
                onClose={() => setIsSearchOpen(false)}
              />
            )}
          </div>
        )}

        <div className="flex-1 flex items-center justify-end min-w-0">
          <div className="flex items-center gap-4 md:gap-6 h-full">
            {isSearchOpen ? (
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                aria-label="Close search"
                className="p-2 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center"
              >
                <X size={22} strokeWidth={2} />
              </button>
            ) : (
              <button
                type="button"
                onClick={openSearch}
                aria-label="Open search"
                aria-expanded={isSearchOpen}
                className="p-2 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center"
              >
                <Search size={22} strokeWidth={2} />
              </button>
            )}

            {!isSearchOpen && (
              <>
                <PurchaseModeToggle />

                <div className="relative flex items-center" ref={cartRef}>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
