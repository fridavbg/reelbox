import styles from "./TagChip.module.scss";

/**
 * A tag on a save, read-only, as cards and the save's page show it.
 *
 * @param props - The tag's name.
 * @returns The chip.
 */
export function TagChip({ label }: { label: string }) {
  return <span className={styles.display}>{label}</span>;
}
