import { useEffect } from "react";

export default function ConfirmModal({ title, body, confirmLabel, onCancel, onConfirm }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="overlay" onClick={onCancel} role="presentation">
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
          <p className="muted">{body}</p>
        </div>
        <div className="modal-foot">
          <button type="button" className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
