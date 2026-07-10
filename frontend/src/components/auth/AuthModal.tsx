import { X } from "lucide-react";
import type { Location } from "react-router-dom";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import Modal from "../common/Modal";
import { DEFAULT_AUTH_BACKGROUND } from "../../utils/openAuth";
import AuthPanel from "./AuthPanel";

interface AuthLocationState {
  backgroundLocation?: Location;
  from?: string;
}

function toPath(location: Location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

function resolveRedirectTarget(
  fallbackFrom: string | undefined,
  background: Location | undefined,
  fromQuery: string,
) {
  if (fallbackFrom) return fallbackFrom;
  if (fromQuery) return fromQuery;
  if (background) return toPath(background);
  return "/";
}

/**
 * Route-addressable `/auth` modal, rendered over `backgroundLocation`
 * (react-router "background location" pattern). See `App.tsx`.
 */
export default function AuthModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const state = location.state as AuthLocationState | null;
  const background = state?.backgroundLocation ?? DEFAULT_AUTH_BACKGROUND;
  const fromQuery = searchParams.get("from") ?? "";

  const closeToBackground = (fallbackFrom?: string) => {
    const target = resolveRedirectTarget(fallbackFrom, background, fromQuery);
    navigate(target, { replace: true });
  };

  return (
    <Modal onClose={() => closeToBackground()} panelClassName="max-w-xl">
      <button
        type="button"
        onClick={() => closeToBackground()}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-text-muted transition-colors hover:bg-bg-base hover:text-text-main"
      >
        <X size={20} />
      </button>
      <AuthPanel onSignInSuccess={(from) => closeToBackground(from)} />
    </Modal>
  );
}
