import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface NavRegionMenuProps {
  isDisabled?: boolean;
}

export default function NavRegionMenu({
  isDisabled = false,
}: NavRegionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [language, setLanguage] = useState({
    code: "pl",
    label: "Polski",
    img: "pl",
  });
  const [currency, setCurrency] = useState("PLN");

  const languages = [
    { code: "pl", label: "Polski", img: "pl" },
    { code: "en", label: "English", img: "gb" },
    { code: "de", label: "Deutsch", img: "de" },
  ];

  const currencies = ["PLN", "EUR", "USD", "GBP"];

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

  return (
    <div className="relative flex items-center" ref={dropdownRef}>
      <button
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        disabled={isDisabled}
        title={isDisabled ? "Coming soon" : "Regional settings"}
        className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${
          isDisabled
            ? "text-text-muted cursor-not-allowed opacity-80"
            : "text-text-main/80 hover:text-accent cursor-pointer"
        }`}
      >
        <img
          src={`https://flagcdn.com/w20/${language.img}.png`}
          srcSet={`https://flagcdn.com/w40/${language.img}.png 2x`}
          width="20"
          alt={language.label}
          className={`rounded-[2px] border border-border-base/30 shadow-sm ${
            isDisabled ? "grayscale-[30%]" : ""
          }`}
        />
        <span>{currency}</span>
        <ChevronDown
          size={13}
          className={`ml-0.5 transition-transform duration-200 ${
            isDisabled ? "opacity-70" : ""
          } ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && !isDisabled && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-bg-surface border border-border-base/20 rounded-xl shadow-lg p-3 z-50">
          <div className="mb-3">
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Language
            </span>
            <div className="flex flex-col gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 text-sm rounded transition-colors flex items-center gap-2 ${
                    language.code === lang.code
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-main hover:bg-bg-base"
                  }`}
                >
                  <img
                    src={`https://flagcdn.com/w20/${lang.img}.png`}
                    width="16"
                    alt={lang.label}
                    className="rounded-[2px] border border-border-base/30"
                  />
                  {lang.label}
                </button>
              ))}
            </div>
          </div>

          <hr className="my-2 border-border-base/20" />

          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider mb-2 block">
              Currency
            </span>
            <div className="grid grid-cols-2 gap-1">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    setCurrency(curr);
                    setIsOpen(false);
                  }}
                  className={`w-full text-center px-2 py-1.5 text-sm rounded transition-colors ${
                    currency === curr
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-text-main hover:bg-bg-base"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
