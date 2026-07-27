import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronDown, Search, ShoppingCart } from "lucide-react";
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
const NAV_SEARCH_WIDTH_CLASS = "w-56 sm:w-64 md:w-72";

type NavBarProps = {
  variant?: "default" | "checkout";
};

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center h-9 border-b-2 transition-colors whitespace-nowrap ${
    isActive
      ? "text-accent border-accent"
      : "text-text-main/80 border-transparent hover:text-accent"
  }`;

function CheckoutNavBar() {
  return (
    <header className="shrink-0 bg-bg-surface shadow-sm z-50 border-b border-border-base/10">
      <div className="max-w-7xl mx-auto px-2 sm:px-3 h-14 flex items-center justify-between gap-2 md:gap-4">
        <Link
          to="/"
          className="text-2xl font-bold text-primary tracking-wide leading-none"
        >
          pro<span className="text-accent">xima</span>.
        </Link>
        <Link
          to="/cart"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} />
          Back to cart
        </Link>
      </div>
    </header>
  );
}

function DefaultNavBar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchInstanceKey, setSearchInstanceKey] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const cartRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const isCatalogActive = location.pathname.startsWith("/catalog");
  const hidePurchaseModeToggle = location.pathname === "/cart";

  const locationKey = `${location.pathname}${location.search}`;
  const [prevLocationKey, setPrevLocationKey] = useState(locationKey);

  const closeSearch = () => {
    setIsSearchExpanded(false);
    setIsSearchOpen(false);
    setSearchInstanceKey((key) => key + 1);
  };

  const openSearch = () => {
    setIsSearchOpen(true);
    setIsDropdownOpen(false);
    setIsCartOpen(false);
    requestAnimationFrame(() => {
      setIsSearchExpanded(true);
    });
  };

  if (locationKey !== prevLocationKey) {
    setPrevLocationKey(locationKey);
    if (isSearchOpen) closeSearch();
  }

  const { data: categories, isLoading, isError, refetch } = useCategories();
  const { lines } = useCartView();

  const shouldRenderCategoryMenu = useDelayedUnmount(
    isDropdownOpen,
    DROPDOWN_EXIT_DURATION_MS,
  );

  const shouldRenderCartDropdown = useDelayedUnmount(
    isCartOpen,
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
        closeSearch();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        setIsCartOpen(false);
        closeSearch();
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
    closeSearch();
    navigate(`/catalog?q=${encodeURIComponent(term)}`);
  };

  return (
    <header
      ref={searchRef}
      className="shrink-0 bg-bg-surface shadow-sm z-50 border-b border-border-base/10"
    >
      <div className="max-w-7xl mx-auto px-2 sm:px-3 h-14 flex items-center gap-2 md:gap-4">
        {/* Left — logo, minimum width */}
        <div className="shrink-0 flex items-center">
          <Link
            to="/"
            className="text-2xl font-bold text-primary tracking-wide leading-none"
          >
            pro<span className="text-accent">xima</span>.
          </Link>
        </div>

        {/* Center — nav tabs, fills remaining space */}
        <div className="flex-1 flex items-center justify-center min-w-0">
          <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 text-sm font-medium">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>

            <div className="relative flex items-center" ref={dropdownRef}>
              {isError ? (
                <button
                  onClick={() => refetch()}
                  className="inline-flex items-center h-9 text-red-400 hover:text-accent border-b-2 border-transparent transition-colors gap-1 text-sm"
                  title="Failed to load categories — click to retry"
                >
                  Categories
                  <span className="text-[10px]">↺</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isLoading}
                  className={`inline-flex items-center h-9 border-b-2 gap-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    isCatalogActive
                      ? "text-accent border-accent"
                      : "text-text-main/80 border-transparent hover:text-accent"
                  }`}
                >
                  {isLoading ? "Loading..." : "Categories"}
                  {!isLoading && (
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
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
        </div>

        {/* Right — expandable search, icons & auth */}
        <div className="shrink-0 flex items-center justify-end">
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <div className="flex items-center justify-end">
              <div
                className={`transition-[width] duration-200 ease-out ${
                  isSearchExpanded
                    ? `${NAV_SEARCH_WIDTH_CLASS} overflow-visible`
                    : "w-0 overflow-hidden"
                }`}
              >
                <div className={`${NAV_SEARCH_WIDTH_CLASS} pr-1 sm:pr-2`}>
                  {shouldRenderSearch && (
                    <ProductSearchInput
                      key={`nav-search-${searchInstanceKey}`}
                      defaultValue=""
                      size="nav"
                      autoFocus={isSearchOpen}
                      showSuggestions
                      onSearch={handleNavSearch}
                      onClose={closeSearch}
                    />
                  )}
                </div>
              </div>

              {!isSearchOpen && (
                <button
                  type="button"
                  onClick={openSearch}
                  aria-label="Open search"
                  aria-expanded={isSearchOpen}
                  className="p-1.5 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center shrink-0"
                >
                  <Search size={20} strokeWidth={2} />
                </button>
              )}
            </div>

            <div className="relative flex items-center" ref={cartRef}>
              <button
                onClick={() => setIsCartOpen((prev) => !prev)}
                aria-haspopup="true"
                aria-expanded={isCartOpen}
                aria-label="Open cart"
                className="relative p-1.5 text-text-main/80 hover:text-accent transition-colors flex items-center justify-center"
              >
                <ShoppingCart size={20} strokeWidth={2} />
                {cartItemCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartItemCount}
                  </span>
                )}
              </button>
              {shouldRenderCartDropdown && (
                <CartDropdown
                  isOpen={isCartOpen}
                  onClose={() => setIsCartOpen(false)}
                />
              )}
            </div>

            {!hidePurchaseModeToggle && <PurchaseModeToggle />}

            <NavRegionMenu isDisabled />

            <div className="flex items-center gap-3 sm:gap-4 border-l border-border-base/40 pl-3 sm:pl-4 self-center h-6">
              <NavAuthButtons />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function NavBar({ variant = "default" }: NavBarProps) {
  if (variant === "checkout") {
    return <CheckoutNavBar />;
  }
  return <DefaultNavBar />;
}
