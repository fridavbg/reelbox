import { X } from "lucide-react";
import styles from "./TagChip.module.scss";

type Props = {
  /** The tag's name. */
  label: string;
  /** Given on the save's page: shows a × that removes the tag. */
  onRemove?: () => void;
  /** Given for a suggestion: the whole chip is a button that adds it. */
  onAdd?: () => void;
  /** The tag is still saving: the × ignores clicks but keeps focus. */
  busy?: boolean;
};

/**
 * A tag on a save. Read-only on cards; on the save's page it has a × to
 * remove it, and a suggested tag is a dashed "+ Name" that adds it. The
 * buttons have a 44px tap area around the smaller chip.
 *
 * @param props - The name, and what tapping it does, if anything.
 * @returns The chip.
 */
export function TagChip({ label, onRemove, onAdd, busy = false }: Props) {
  if (onAdd) {
    return (
      <button
        type="button"
        className={styles.suggestion}
        aria-label={`Add tag ${label}`}
        onClick={onAdd}
      >
        <span className={styles.suggested}>+ {label}</span>
      </button>
    );
  }
  if (!onRemove) return <span className={styles.display}>{label}</span>;
  return (
    <span className={styles.removable}>
      {label}
      <button
        type="button"
        className={styles.remove}
        aria-label={`Remove tag ${label}`}
        aria-disabled={busy || undefined}
        onClick={() => {
          if (!busy) onRemove();
        }}
      >
        <X size={16} aria-hidden="true" />
      </button>
    </span>
  );
}
