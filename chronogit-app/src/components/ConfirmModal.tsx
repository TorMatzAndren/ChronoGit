import type { ConfirmAction } from "../core/chronogitRuntimeTypes";

type Props = {
  action: ConfirmAction;
  confirmText: string;
  setConfirmText: (text: string) => void;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export function ConfirmModal({
  action,
  confirmText,
  setConfirmText,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <div className="confirm-overlay">
      <div className={`confirm-modal ${action.danger ? "confirm-modal--danger" : ""}`}>
        <div className="confirm-modal__eyebrow">
          {action.danger ? "Destructive action" : "Confirmation"}
        </div>

        <h2>{action.title}</h2>

        <pre>{action.body}</pre>

        {action.requiredText ? (
          <label className="confirm-required-text">
            <span>
              {action.requiredTextLabel || `Type ${action.requiredText} to continue.`}
            </span>

            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              placeholder={action.requiredText}
            />
          </label>
        ) : null}

        <div className="confirm-modal__actions">
          <button onClick={onCancel}>
            Cancel
          </button>

          <button
            className={action.danger ? "danger-button" : "confirm"}
            disabled={Boolean(
              action.requiredText &&
              confirmText.trim() !== action.requiredText
            )}
            onClick={() => {
              void onConfirm();
            }}
          >
            {action.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
