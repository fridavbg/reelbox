import { isDeepStrictEqual } from "node:util";
import { expectedSampleUpload } from "./sample-export";

/**
 * Checks that a demo user's upload is exactly the sample export, so no real
 * data gets into a demo account. Server only: it uses Node's `util`.
 *
 * @param value - The upload's parsed JSON, as the import route reads it.
 * @param anchor - When the demo started, from `demoAnchor`.
 * @returns Whether the upload equals the sample's, date for date.
 */
export function isSampleUpload(value: unknown, anchor: Date): boolean {
  // Through JSON, like the upload itself, so dates compare as strings.
  const expected: unknown = JSON.parse(
    JSON.stringify(expectedSampleUpload(anchor)),
  );
  return isDeepStrictEqual(value, expected);
}
