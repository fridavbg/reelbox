import { BookmarkX } from "lucide-react";
import { NO_LONGER_SAVED } from "@/lib/saves/save-card-text";
import styles from "./NoLongerSavedBadge.module.scss";

/**
 * The badge on a save that a later import no longer found on Instagram.
 * The words carry the state; the icon and background only help.
 *
 * @param props - Extra classes, e.g. for where the card places it.
 * @returns The badge.
 */
export function NoLongerSavedBadge({ className }: { className?: string }) {
  return (
    <p className={[styles.badge, className].filter(Boolean).join(" ")}>
      <BookmarkX size={16} aria-hidden="true" className={styles.icon} />
      {NO_LONGER_SAVED}
    </p>
  );
}
