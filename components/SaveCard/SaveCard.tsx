import type { SaveListItem } from "@/lib/saves/list-saves";
import {
  kindText,
  openOnInstagramContext,
  savedOnText,
} from "@/lib/saves/save-card-text";
import styles from "./SaveCard.module.scss";

type Props = {
  save: SaveListItem;
  /** An IANA time zone for the saved date; the runtime's own by default. */
  timeZone?: string;
};

/**
 * One save in the grid: its kind where a thumbnail would be (the export has
 * no images), the creator, the saved date, its tags and a link to the post.
 *
 * @param props - The save, and the time zone for its saved date.
 * @returns The card.
 */
export function SaveCard({ save, timeZone }: Props) {
  return (
    <article className={styles.card}>
      <div className={styles.kind}>{kindText(save.kind)}</div>
      <h2 className={styles.creator}>@{save.creatorUsername}</h2>
      <p className={styles.saved}>
        <time dateTime={save.savedAt.toISOString()}>
          {savedOnText(save.savedAt, timeZone)}
        </time>
      </p>
      {save.tags.length > 0 && (
        <ul className={styles.tags} aria-label="Tags">
          {save.tags.map((tag) => (
            <li key={tag} className={styles.tag}>
              {tag}
            </li>
          ))}
        </ul>
      )}
      <a
        href={save.url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
      >
        Open on Instagram
        <span className={styles.hidden}>
          {openOnInstagramContext(save.kind, save.creatorUsername)}
        </span>
        <span aria-hidden="true"> ↗</span>
      </a>
    </article>
  );
}
