import type { Location, NavigateFunction } from "react-router-dom";

interface OpenAuthOptions {
  mode?: "register";
  /** Post-login redirect target. Defaults to the current path when not on `/auth`. */
  from?: string;
  /** Page rendered behind the modal. Defaults to `location`. */
  backgroundLocation?: Location;
}

export const DEFAULT_AUTH_BACKGROUND: Location = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
  key: "default",
};

/**
 * Opens the route-addressable `/auth` modal over `backgroundLocation`.
 * All auth entry points should use this helper for consistent behavior.
 */
export function openAuth(
  navigate: NavigateFunction,
  location: Location,
  options: OpenAuthOptions = {},
) {
  const { mode, from, backgroundLocation = location } = options;
  const search = mode === "register" ? "?mode=register" : "";
  const resolvedFrom =
    from ??
    (location.pathname !== "/auth"
      ? `${location.pathname}${location.search}${location.hash}`
      : "");

  navigate(`/auth${search}`, {
    state: {
      from: resolvedFrom,
      backgroundLocation,
    },
  });
}
