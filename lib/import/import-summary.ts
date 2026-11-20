/**
 * Three-letter months, as in the wireframes. Intl's own short months differ
 * between runtimes: recent ones write September as "Sept" in en-GB.
 */
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Writes a date the way the wireframes show it, e.g. "14 Dec 2016".
 *
 * @param date - The date to write.
 * @param timeZone - An IANA time zone; the runtime's own by default.
 * @returns The day, short month and year.
 */
export function formatDay(date: Date, timeZone?: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone,
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return `${part("day")} ${MONTHS[part("month") - 1]} ${part("year")}`;
}

/**
 * The toggle that opens the list of saves that couldn't be read.
 *
 * @param count - How many saves couldn't be read.
 * @returns The question, with "save" or "saves" to match the count.
 */
export function unreadableSavesText(count: number) {
  return `Why couldn't ${count} ${count === 1 ? "save" : "saves"} be read?`;
}

/**
 * The summary line about saves this import flagged as no longer saved on
 * Instagram. It says they stay, so nobody thinks they were deleted.
 *
 * @param count - How many saves the import flagged.
 * @returns The sentence, or undefined when none were flagged.
 */
export function noLongerSavedText(count: number) {
  if (count === 0) return undefined;
  return count === 1
    ? "1 save is no longer saved on Instagram. It stays here, with its tags."
    : `${count} saves are no longer saved on Instagram. They stay here, with their tags.`;
}

/**
 * The summary line about collections that became tags.
 *
 * @param count - How many tags the import created.
 * @returns The sentence, or undefined when no tags were added.
 */
export function tagsAddedText(count: number) {
  if (count === 0) return undefined;
  return count === 1
    ? "1 Instagram collection was added as a tag."
    : `${count} Instagram collections were added as tags.`;
}

/**
 * The summary line about collections that couldn't be read.
 *
 * @param count - How many collections couldn't be read.
 * @returns The sentence, or undefined when every collection was read.
 */
export function unreadableCollectionsText(count: number) {
  if (count === 0) return undefined;
  return count === 1
    ? "1 collection couldn't be read, so it wasn't added as a tag."
    : `${count} collections couldn't be read, so they weren't added as tags.`;
}
