// Errors from an import, shown on the upload page. Imports are all or
// nothing, so the page adds IMPORT_UNCHANGED below the message (see
// unchangedNote).

import { MAX_REQUEST_BYTES } from "./import-settings";

export const IMPORT_UNCHANGED =
  "Nothing was imported, so your library is unchanged.";
export const DEMO_CANT_IMPORT = "Sign in with email to import your own saves.";
export const UPLOAD_UNREADABLE = "We couldn't read this upload.";
export const UPLOAD_TOO_LARGE =
  "This export is too large to import. Request a new export with only Saved selected, or a shorter date range.";
export const IMPORT_ALREADY_RUNNING =
  "Another import is still running. Wait a moment, then try again.";
export const IMPORT_FAILED = "Something went wrong on our side. Try again.";
export const UPLOAD_INTERRUPTED =
  "The connection was lost during the import. Check your connection, then import again. Saves that are already here are skipped.";

/**
 * Checks the compressed upload's size in the browser, before it's sent.
 *
 * @param compressedBytes - Size of the gzip-compressed upload.
 * @param limit - The largest size accepted; the hosting's limit by default.
 * @returns The message to show, or undefined if the upload can be sent.
 */
export function uploadSizeError(
  compressedBytes: number,
  limit = MAX_REQUEST_BYTES,
) {
  return compressedBytes > limit ? UPLOAD_TOO_LARGE : undefined;
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

/**
 * The note shown below an import error. A lost connection may have happened
 * after the import finished, so then the library may have changed.
 *
 * @param error - The message shown.
 * @returns IMPORT_UNCHANGED, or undefined when it may not be true.
 */
export function unchangedNote(error: string) {
  return error === UPLOAD_INTERRUPTED ? undefined : IMPORT_UNCHANGED;
}
