import { Clapperboard, ImageIcon } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";
import { NoLongerSavedBadge } from "@/components/NoLongerSavedBadge/NoLongerSavedBadge";
import { OpenOnInstagram } from "@/components/OpenOnInstagram/OpenOnInstagram";
import { ProfileLink } from "@/components/ProfileLink/ProfileLink";
import { TagChip } from "@/components/TagChip/TagChip";
import type { SaveListItem } from "@/lib/saves/list-saves";
import {
  EDIT_TAGS_CONTEXT,
  kindText,
  savedOnText,
} from "@/lib/saves/save-card-text";
import styles from "./SaveCard.module.scss";

/** The icon next to the kind's word; decorative, the word says the kind. */
const kindIcons = { REEL: Clapperboard, POST: ImageIcon };

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
 * kind, the caption, the creator, the saved date, its tags, a badge if
 * it's no longer saved on Instagram and a link to the post. Demo saves get
 * a note instead of the links.
 *
 * The creator comes first in the HTML, so the heading starts the card for
 * screen readers; CSS shows the kind and caption above it. The heading is
 * the display name, or the username when there's none.
 *
 * @param props - The save, the time zone for its saved date, a ref, and
 *   whether it's a demo save.
 * @returns The card.
 */
export function SaveCard({ save, timeZone, ref, demo = false }: Props) {
  const KindIcon = kindIcons[save.kind];
  const username = `@${save.creatorUsername}`;

  return (
    <article ref={ref} tabIndex={ref ? -1 : undefined} className={styles.card}>
      {/* `||`, not `??`: an empty name counts as none. The username row is
          always there, so every card has the same rows. */}
      <h2 className={styles.creator}>
        {/* Stretched over the whole card by CSS, so tapping anywhere on it
            opens the save's page. */}
        <Link href={`/saves/${save.id}`} className={styles.cardLink}>
          {save.creatorName || username}
          <span className={styles.hidden}>{EDIT_TAGS_CONTEXT}</span>
        </Link>
      </h2>
      <p className={styles.username}>
        <ProfileLink
          username={save.creatorUsername}
          url={save.creatorUrl}
          demo={demo}
        />
      </p>
      <p className={styles.kind}>
        <KindIcon size={16} aria-hidden="true" className={styles.kindIcon} />
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
            <li key={tag}>
              <TagChip label={tag} />
            </li>
          ))}
        </ul>
      )}
      {save.noLongerSavedAt && <NoLongerSavedBadge className={styles.badge} />}
      <OpenOnInstagram
        url={save.url}
        kind={save.kind}
        creatorUsername={save.creatorUsername}
        demo={demo}
        className={styles.link}
      />
    </article>
  );
}
