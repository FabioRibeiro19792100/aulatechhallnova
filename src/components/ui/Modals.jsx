import { createPortal } from "react-dom";
import { X } from "lucide-react";
import techHallFooterIcon from "../../../tech_hall_branding/icone_8.png";

export function Modal({ open, children, onClose, small = false, dismissible = true, className = "" }) {
  if (!open) return null;
  const modalNode = (
    <div className="overlay open" onClick={dismissible ? onClose : undefined}>
      <div
        className={`modal${small ? " modal-small" : ""}${className ? ` ${className}` : ""}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {onClose ? (
          <button
            type="button"
            className="modal-close-btn"
            aria-label="Fechar janela"
            onClick={onClose}
          >
            <X size={16} strokeWidth={1.9} />
          </button>
        ) : null}
        {children}
      </div>
    </div>
  );
  if (typeof document === "undefined") return modalNode;
  return createPortal(modalNode, document.body);
}

export function BrandLoaderOverlay({ open }) {
  if (!open) return null;
  return (
    <div className="brand-loader-overlay" aria-hidden="true">
      <div className="brand-loader-shell">
        <img className="brand-loader-icon" src={techHallFooterIcon} alt="" />
      </div>
    </div>
  );
}
