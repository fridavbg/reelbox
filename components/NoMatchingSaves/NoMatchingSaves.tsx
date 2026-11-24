import Link from "next/link";
import { buttonClassName } from "@/components/Button/Button";
import type { SavesFilter } from "@/lib/saves/saves-filter";
import {
  noMatchText,
  noMatchTitle,
  SHOW_ALL_SAVES,
} from "@/lib/saves/saves-text";
import styles from "./NoMatchingSaves.module.scss";

type Props = {
  /** The tag or untagged filter that matched nothing. */
  filter: Exclude<SavesFilter, { kind: "all" }>;
  /** The tag's name as the user wrote it, for a tag filter. */
  tagName?: string;
};

/**
 * Shown in place of the grid when no save matches the filter, e.g. a tag
 * that's on no save, or a shared link to a tag the user doesn't have.
 *
 * @param props - The filter, and the tag's name.
 * @returns What's missing, and a link back to all saves.
 */
export function NoMatchingSaves({ filter, tagName }: Props) {
  return (
    <div className={styles.empty}>
      <h2 className={styles.title}>{noMatchTitle(filter, tagName)}</h2>
      <p className={styles.text}>{noMatchText(filter)}</p>
      <Link href="/saves" className={buttonClassName("secondary")}>
        {SHOW_ALL_SAVES}
      </Link>
    </div>
  );
}
