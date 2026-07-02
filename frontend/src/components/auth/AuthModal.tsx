import { X } from "lucide-react";
import type { Location } from "react-router-dom";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../common/Modal";
import AuthPanel from "./AuthPanel";

interface AuthLocationState {
  backgroundLocation?: Location;
  from?: string;
}

function toPath(location: Location) {
  return `${location.pathname}${location.search}${location.hash}`;
}

/**
 * Route-addressable `/auth` modal, rendered over a blurred `backgroundLocation`
 * (react-router "background location" pattern). See `App.tsx`.
 */
export default function AuthModal() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as AuthLocationState | null;
  const background = state?.backgroundLocation;

  const closeToBackground = (fallbackFrom?: string) => {
    const target = fallbackFrom || (background ? toPath(background) : "/");
    navigate(target, { replace: true });
  };

  return (
    <Modal onClose={() => closeToBackground()} panelClassName="max-w-2xl">
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
