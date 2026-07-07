import { useEffect, useState } from "react";

/**
 * Keeps a conditionally-rendered element mounted for `exitDurationMs` after
 * `isOpen` flips to false, so a CSS exit animation (e.g. `animate-pop-up`)
 * has time to finish before the element is actually removed from the DOM.
 * `exitDurationMs` should match the exit keyframe's duration in `index.css`.
 */
export function useDelayedUnmount(isOpen: boolean, exitDurationMs: number) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  // Plain state (not a ref) tracking the previous `isOpen`, per React's
  // "adjusting state when a prop changes" pattern —
  // https://react.dev/learn/you-might-not-need-an-effect. Mounting on open
  // happens synchronously during render; only the delayed unmount on close
  // needs the effect below.
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) setShouldRender(true);
  }

  useEffect(() => {
    if (isOpen || !shouldRender) return;

    const timeout = setTimeout(() => setShouldRender(false), exitDurationMs);
    return () => clearTimeout(timeout);
  }, [isOpen, exitDurationMs, shouldRender]);

  return shouldRender;
}
