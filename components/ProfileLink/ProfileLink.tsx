import { PROFILE_LINK_CONTEXT } from "@/lib/saves/save-card-text";
import styles from "./ProfileLink.module.scss";

type Props = {
  /** The creator's username, without "@". */
  username: string;
  /** Their profile link, or null when there's none. */
  url: string | null;
  /** A demo save: the creator is invented, so nothing is linked. */
  demo?: boolean;
};

/**
 * "@username", linking to the creator's Instagram profile in a new tab.
 * Plain text in the demo or without a link. At least 44px tall either way,
 * so the rows around it line up.
 *
 * @param props - The username, the profile link, and whether it's a demo.
 * @returns The link or the text.
 */
export function ProfileLink({ username, url, demo = false }: Props) {
  const name = `@${username}`;
  if (demo || !url) return <span className={styles.text}>{name}</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.link}
    >
      {name}
      <span className={styles.hidden}>{PROFILE_LINK_CONTEXT}</span>
      <span aria-hidden="true"> ↗</span>
    </a>
  );
}
