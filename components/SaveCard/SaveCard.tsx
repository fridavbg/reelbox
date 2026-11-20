import type { Ref } from "react";
import type { SaveListItem } from "@/lib/saves/list-saves";
import {
  DEMO_SAVE_NOTE,
  kindText,
  openOnInstagramContext,
  PROFILE_LINK_CONTEXT,
  savedOnText,
} from "@/lib/saves/save-card-text";
import { KindIcon } from "./KindIcon";
import styles from "./SaveCard.module.scss";

type Props = {
  save: SaveListItem;
  /** An IANA time zone for the saved date; the runtime's own by default. */
  timeZone?: string;
  /** Set on the card, which then takes focus from code (not from Tab). */
  ref?: Ref<HTMLElement>;
  /** A demo save: its post and creator are invented, so nothing is linked. */
  demo?: boolean;
};

/**
 * One save in the grid. The export has no images, so the card shows the
 * kind, the caption, the creator, the saved date, its tags and a link to
 * the post. Demo saves get a note instead of the links.
 *
 * The creator comes first in the HTML, so the heading starts the card for
 * screen readers; CSS shows the kind and caption above it.
 *
 * @param props - The save, the time zone for its saved date, a ref, and
 *   whether it's a demo save.
 * @returns The card.
 */
export function SaveCard({ save, timeZone, ref, demo = false }: Props) {
  const username = `@${save.creatorUsername}`;
  const profile =
    !demo && save.creatorUrl ? (
      <a
        href={save.creatorUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.profileLink}
      >
        {username}
        <span className={styles.hidden}>{PROFILE_LINK_CONTEXT}</span>
        <span aria-hidden="true"> ↗</span>
      </a>
    ) : (
      username
    );

  return (
    <article ref={ref} tabIndex={ref ? -1 : undefined} className={styles.card}>
      <h2 className={styles.creator}>{save.creatorName ?? profile}</h2>
      {save.creatorName && <p className={styles.username}>{profile}</p>}
      <p className={styles.kind}>
        <KindIcon kind={save.kind} className={styles.kindIcon} />
        {kindText(save.kind)}
      </p>
      <div className={styles.captionArea}>
        {save.caption && <p className={styles.caption}>{save.caption}</p>}
      </div>
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
      {demo ? (
        <p className={styles.demoNote}>{DEMO_SAVE_NOTE}</p>
      ) : (
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
      )}
    </article>
  );
}
