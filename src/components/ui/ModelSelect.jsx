import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { formatModelLaunch, formatModelPriceHint } from "../../utils.js";

export function ModelSelect({ options = [], value, onChange, disabled = false, ariaLabel, dropUp = false }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const selected = options.find((entry) => entry.id === value) || options[0] || null;

  const updateCoords = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 220);
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;
    const placeUp = dropUp ? spaceAbove > 180 : spaceBelow < 300 && spaceAbove > spaceBelow;
    setCoords({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      width,
      placeUp,
      top: rect.bottom + 6,
      bottom: window.innerHeight - rect.top + 6,
    });
  }, [dropUp]);

  useEffect(() => {
    if (!open) return undefined;
    updateCoords();
    function handleReposition() {
      updateCoords();
    }
    function handlePointer(event) {
      if (triggerRef.current?.contains(event.target)) return;
      if (menuRef.current?.contains(event.target)) return;
      setOpen(false);
    }
    function handleKey(event) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, updateCoords]);

  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);

  function handleSelect(nextId) {
    if (nextId !== value) onChange(nextId);
    setOpen(false);
  }

  const menu =
    open && coords
      ? createPortal(
          <ul
            ref={menuRef}
            className="model-select-menu"
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              left: coords.left,
              width: coords.width,
              ...(coords.placeUp ? { bottom: coords.bottom } : { top: coords.top }),
            }}
          >
            {options.map((entry) => (
              <li key={entry.id} role="option" aria-selected={entry.id === value}>
                <button
                  type="button"
                  className={`model-select-option${entry.id === value ? " is-selected" : ""}`}
                  title={formatModelPriceHint(entry)}
                  onClick={() => handleSelect(entry.id)}
                >
                  <span className="model-select-option-name">{entry.label}</span>
                  <span className="model-select-option-date">{formatModelLaunch(entry.releasedAt) || "—"}</span>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className={`model-select${open ? " is-open" : ""}${disabled ? " is-disabled" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="model-select-trigger"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={disabled}
        title={formatModelPriceHint(selected)}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="model-select-trigger-name">{selected?.label || "Modelo"}</span>
        <span className="model-select-caret" aria-hidden="true">
          <ChevronDown size={14} strokeWidth={1.8} />
        </span>
      </button>
      {menu}
    </div>
  );
}
