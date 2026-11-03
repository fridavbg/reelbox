import type { PostKind } from "@/generated/prisma/client";
import { formatDay } from "@/lib/import/import-summary";

/**
 * The word for a save's kind, shown where a thumbnail would be.
 *
 * @param kind - Reel or post.
 * @returns "Reel" or "Post".
 */
export function kindText(kind: PostKind) {
  return kind === "REEL" ? "Reel" : "Post";
}

/**
 * The saved date on a card, e.g. "Saved 30 Sep 2026".
 *
 * @param savedAt - When the post was saved on Instagram.
 * @param timeZone - An IANA time zone; the runtime's own by default.
 * @returns The line for the card.
 */
export function savedOnText(savedAt: Date, timeZone?: string) {
  return `Saved ${formatDay(savedAt, timeZone)}`;
}

/**
 * Hidden text after a card's "Open on Instagram" link. Every card's visible
 * text is the same, so this says whose save the link opens. It comes after
 * the visible words, so the link's name still starts with what people see.
 *
 * @param kind - Reel or post.
 * @param creatorUsername - The creator's username, without "@".
 * @returns E.g. ": @creator_one's reel, opens in a new tab".
 */
export function openOnInstagramContext(
  kind: PostKind,
  creatorUsername: string,
) {
  const what = kindText(kind).toLowerCase();
  return `: @${creatorUsername}'s ${what}, opens in a new tab`;
}
