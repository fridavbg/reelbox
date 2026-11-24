import { X } from "lucide-react";
import styles from "./Toast.module.scss";

type Props = {
  /** What just happened; nothing shows without it. */
  message?: string;
  /** A button next to the message, e.g. Undo. */
  action?: { label: string; onClick: () => void };
  /** Given: a × that hides the toast, so it never has to cover the page. */
  onDismiss?: () => void;
};

/**
 * A short message at the bottom of the screen about what just happened,
 * with an optional action. It has no timer, so nobody has to race to
 * read it or reach the button: whoever shows it also clears it, and the ×
 * lets people clear it themselves.
 *
 * The status region stays in the page while empty, because screen readers
 * only announce changes to a region that was already there.
 *
 * @param props - The message, its action and how to dismiss it, if any.
 * @returns The toast.
 */
export function Toast({ message, action, onDismiss }: Props) {
  return (
    <div role="status" className={styles.region}>
      {message && (
        <div className={styles.toast}>
          <p>{message}</p>
          {action && (
            <button
              type="button"
              className={styles.action}
              onClick={action.onClick}
            >
              {action.label}
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              className={styles.action}
              aria-label="Dismiss"
              onClick={onDismiss}
            >
              <X size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
