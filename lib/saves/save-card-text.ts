import type { PostKind } from "@/generated/prisma/client";
import { formatDay } from "@/lib/import/import-summary";

/**
 * Shown on demo cards instead of "Open on Instagram": the sample saves are
 * invented, so their links would lead nowhere.
 */
export const DEMO_SAVE_NOTE = "Sample save, not on Instagram";

/**
 * The most characters of a caption a card gets. The card shows 3 lines;
 * this keeps the rest of a long caption out of the page, so screen readers
 * don't read all of it on every card.
 */
export const CARD_CAPTION_LENGTH = 300;

/**
 * A save's caption as its card shows it: on one line, and cut after the
 * last whole word within {@link CARD_CAPTION_LENGTH}, with "…".
 *
 * @param caption - The caption from the export, or null.
 * @returns The card's caption, or null when there's nothing to show.
 */
export function cardCaption(caption: string | null) {
  const oneLine = caption?.replace(/\s+/g, " ").trim();
  if (!oneLine) return null;
  if (oneLine.length <= CARD_CAPTION_LENGTH) return oneLine;
  const cut = oneLine.slice(0, CARD_CAPTION_LENGTH + 1);
  const lastSpace = cut.lastIndexOf(" ");
  const end = lastSpace > 0 ? lastSpace : CARD_CAPTION_LENGTH;
  return `${cut.slice(0, end)}…`;
}

/**
 * The word for a save's kind, shown next to its icon on the card.
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
