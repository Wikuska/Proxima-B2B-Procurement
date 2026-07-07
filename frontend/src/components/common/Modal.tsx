import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Overrides the panel's max-width utility class (defaults to `max-w-lg`). */
  panelClassName?: string;
}

/**
 * Generic centered modal: portals to document.body, dims the page behind it,
 * and closes on Escape or backdrop click. Content is left entirely to the
 * caller (no built-in header/footer/close button).
 */
export default function Modal({
  onClose,
  children,
  panelClassName,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    panelRef.current?.focus();
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
        className={`relative z-10 max-h-[90vh] w-full overflow-y-auto rounded-2xl bg-bg-surface shadow-2xl outline-none animate-scale-in ${
          panelClassName ?? "max-w-lg"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
