import { useEffect } from "react";

/**
 * ConfirmDialog — a lightweight accessible modal for destructive confirmations.
 *
 * Props:
 *   isOpen    {boolean}  — whether the dialog is shown
 *   title     {string}   — bold heading
 *   message   {string}   — supporting description
 *   onConfirm {function} — called when user clicks the confirm button
 *   onCancel  {function} — called when user dismisses
 *   confirmLabel {string} — button label (default: "Delete")
 *   danger    {boolean}  — use red styling for confirm button (default: true)
 */
const ConfirmDialog = ({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  danger = true
}) => {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm rounded-3xl bg-white p-7 shadow-2xl animate-fade-in">
        <h2 id="confirm-dialog-title" className="text-xl font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed">{message}</p>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="secondary-button py-2.5 px-5 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={danger ? "danger-button text-sm" : "gradient-button text-sm py-2.5 px-5"}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
