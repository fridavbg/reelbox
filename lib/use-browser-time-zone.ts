"use client";

import { useSyncExternalStore } from "react";

/** The time zone never changes while the page is open. */
const subscribe = () => () => {};

/**
 * The browser's time zone, for showing dates the way the user expects.
 *
 * The server can't know it, so the server render and hydration use UTC,
 * and React renders again with the browser's zone right after. Dates near
 * midnight may change once while the page loads.
 *
 * @returns An IANA time zone, e.g. "Europe/Stockholm"; "UTC" on the server.
 */
export function useBrowserTimeZone() {
  return useSyncExternalStore(
    subscribe,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => "UTC",
  );
}
