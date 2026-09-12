import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function ConfirmModal({
  title,
  body,
  bodyClassName = "muted",
  confirmLabel,
  cancelLabel = "Cancel",
  onCancel,
  onConfirm,
  onDismiss,
  danger = true,
}) {
  const dismiss = onDismiss || onCancel;
  useEffect(() => {
    function onKey(event) {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      dismiss();
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [dismiss]);

  return createPortal(
    <div className="overlay stacked" onClick={dismiss} role="presentation">
      <div
        className="modal narrow"
        role="dialog"
        aria-labelledby="confirm-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="modal-head">
          <h2 id="confirm-title">{title}</h2>
        </div>
        <div className="modal-body">
          <p className={bodyClassName}>{body}</p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
