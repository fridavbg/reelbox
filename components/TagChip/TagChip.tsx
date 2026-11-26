import { X } from "lucide-react";
import styles from "./TagChip.module.scss";

type Props = {
  /** The tag's name. */
  label: string;
  /** Given on the save's page: shows a × that removes the tag. */
  onRemove?: () => void;
  /** Given for a suggestion: the whole chip is a button that adds it. */
  onAdd?: () => void;
  /** Given with `onAdd` for a suggestion that can be hidden: shows a ×. */
  onIgnore?: () => void;
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
export function TagChip({
  label,
  onRemove,
  onAdd,
  onIgnore,
  busy = false,
}: Props) {
  if (onAdd && onIgnore) {
    return (
      <span className={styles.ignorable}>
        <button
          type="button"
          className={styles.addSuggested}
          aria-label={`Add tag ${label}`}
          onClick={onAdd}
        >
          + <Label text={label} />
        </button>
        <button
          type="button"
          className={styles.remove}
          aria-label={`Hide suggestion ${label}`}
          onClick={onIgnore}
        >
          <X size={16} aria-hidden="true" />
        </button>
      </span>
    );
  }
  if (onAdd) {
    return (
      <button
        type="button"
        className={styles.suggestion}
        aria-label={`Add tag ${label}`}
        onClick={onAdd}
      >
        <span className={styles.suggested}>
          + <Label text={label} />
        </span>
      </button>
    );
  }
  if (!onRemove) return <span className={styles.display}>{label}</span>;
  return (
    <span className={styles.removable}>
      <Label text={label} />
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

/**
 * A chip's name, cut short with "…" when it's longer than the row: tags
 * made from collections can be 500 characters. The full name shows on
 * hover, and the buttons' labels carry it for screen readers.
 */
function Label({ text }: { text: string }) {
  return (
    <span className={styles.label} title={text}>
      {text}
    </span>
  );
}
