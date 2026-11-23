import type { PostKind } from "@/generated/prisma/client";
import {
  DEMO_SAVE_NOTE,
  openOnInstagramContext,
} from "@/lib/saves/save-card-text";
import styles from "./OpenOnInstagram.module.scss";

type Props = {
  /** The post's link on Instagram. */
  url: string;
  kind: PostKind;
  /** The creator's username, without "@", for the link's hidden text. */
  creatorUsername: string;
  /** A demo save is invented, so it gets a note instead of a link. */
  demo?: boolean;
  /** Extra classes, e.g. for where the card places it. */
  className?: string;
};

/**
 * "Open on Instagram", opening the post in a new tab, or the demo's note
 * in its place, just as tall, so cards keep the same height.
 *
 * @param props - The post, whether it's a demo save, and extra classes.
 * @returns The link or the note.
 */
export function OpenOnInstagram({
  url,
  kind,
  creatorUsername,
  demo = false,
  className,
}: Props) {
  const classes = (own: string) => [own, className].filter(Boolean).join(" ");
  if (demo) return <p className={classes(styles.note)}>{DEMO_SAVE_NOTE}</p>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={classes(styles.link)}
    >
      Open on Instagram
      <span className={styles.hidden}>
        {openOnInstagramContext(kind, creatorUsername)}
      </span>
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}
