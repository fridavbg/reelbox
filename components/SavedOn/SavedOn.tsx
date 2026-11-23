"use client";

import { savedOnText } from "@/lib/saves/save-card-text";
import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";

/**
 * "Saved 30 Sep 2026" in the browser's time zone, for pages rendered on the
 * server, which only knows UTC.
 *
 * @param props - When the post was saved on Instagram.
 * @returns The date as a `<time>` element.
 */
export function SavedOn({ savedAt }: { savedAt: Date }) {
  const timeZone = useBrowserTimeZone();
  return (
    <time dateTime={savedAt.toISOString()}>
      {savedOnText(savedAt, timeZone)}
    </time>
  );
}
