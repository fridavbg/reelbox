// Errors from POST /api/import, shown on the upload page. Every message that
// can follow a failed import says the library is unchanged, since imports are
// all or nothing.

import { MAX_REQUEST_BYTES } from "./import-settings";

const UNCHANGED = "Nothing was imported, so your library is unchanged.";

export const DEMO_CANT_IMPORT = "Sign in with email to import your own saves.";
export const UPLOAD_UNREADABLE = `We couldn't read this upload. ${UNCHANGED}`;
export const UPLOAD_TOO_LARGE =
  "This export is too large to import. Request a new export with only Saved selected, or a shorter date range.";
export const IMPORT_ALREADY_RUNNING =
  "Another import is still running. Wait a moment, then try again.";
export const IMPORT_FAILED = `Something went wrong on our side. ${UNCHANGED} Try again.`;

/**
 * Checks the compressed upload's size in the browser, before it's sent.
 *
 * @param compressedBytes - Size of the gzip-compressed upload.
 * @returns The message to show, or undefined if the upload can be sent.
 */
export function uploadSizeError(compressedBytes: number) {
  return compressedBytes > MAX_REQUEST_BYTES ? UPLOAD_TOO_LARGE : undefined;
}

/**
 * Turns a failed answer from POST /api/import into a message for the page.
 * The hosting rejects too-large requests before they reach the route, with a
 * 413 that doesn't carry our message.
 *
 * @param status - The response's HTTP status code.
 * @param body - The response body, parsed as JSON if possible.
 * @returns The route's own message, or a general one for unknown answers.
 */
export function importErrorMessage(status: number, body: unknown) {
  const error = (body as { error?: unknown } | null)?.error;
  if (typeof error === "string") return error;
  return status === 413 ? UPLOAD_TOO_LARGE : IMPORT_FAILED;
}
