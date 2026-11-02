import { z } from "zod";
import { parseExport, type InvalidEntry } from "@/lib/export/parse-export";
import { readExportFiles, type Upload } from "@/lib/export/read-export-files";
import { splitUnreadable, type ImportSummary } from "./build-import";
import {
  IMPORT_FAILED,
  UPLOAD_INTERRUPTED,
  importErrorMessage,
  uploadSizeError,
} from "./import-messages";
import { MAX_REQUEST_BYTES } from "./import-settings";

export type ImportResult =
  | {
      ok: true;
      summary: ImportSummary;
      earliestSavedAt: Date;
      latestSavedAt: Date;
      /** Saves that couldn't be read; summary.invalidCount counts these. */
      unreadableSaves: InvalidEntry[];
      /** Collections that couldn't be read, so they aren't tags. */
      unreadableCollections: InvalidEntry[];
    }
  | { ok: false; error: string };

const count = z.number().int().min(0);

/** The route's answer after an import; checked, since it crosses the network. */
const summarySchema = z.object({
  newCount: count,
  duplicateCount: count,
  invalidCount: count,
  tagsAddedCount: count,
}) satisfies z.ZodType<ImportSummary>;

/**
 * Compresses text with gzip, as the import route expects.
 *
 * @param text - The upload as JSON.
 * @returns The compressed upload.
 */
function gzip(text: string) {
  const stream = new Blob([text])
    .stream()
    .pipeThrough(new CompressionStream("gzip"));
  return new Response(stream).blob();
}

/**
 * Runs an import from the chosen files: reads and parses the export in the
 * browser, compresses the saves, checks the size, sends them and turns the
 * answer into a summary or a message. Only the saved posts and collections
 * leave the device.
 *
 * @param files - The export ZIP, or its JSON files.
 * @param send - Sends the compressed upload, e.g. with `fetch`.
 * @param options - `maxRequestBytes`: the largest upload sent; the
 * hosting's limit by default.
 * @returns The summary, or the message to show. Never throws, so the page
 *   can't get stuck while importing.
 */
export async function runImport(
  files: Upload[],
  send: (upload: Blob) => Promise<Response>,
  options: { maxRequestBytes?: number } = {},
): Promise<ImportResult> {
  try {
    return await importFiles(files, send, options);
  } catch {
    return { ok: false, error: IMPORT_FAILED };
  }
}

/**
 * The steps of runImport, which may throw on something unexpected.
 *
 * @param files - The export ZIP, or its JSON files.
 * @param send - Sends the compressed upload.
 * @param options - `maxRequestBytes`: the largest upload sent.
 * @returns The summary, or the message to show.
 */
async function importFiles(
  files: Upload[],
  send: (upload: Blob) => Promise<Response>,
  { maxRequestBytes = MAX_REQUEST_BYTES }: { maxRequestBytes?: number },
): Promise<ImportResult> {
  const read = await readExportFiles(files);
  if (!read.ok) return read;
  const parsed = parseExport(read.files);
  if (!parsed.ok) return parsed;

  const { posts, collections, invalid, earliestSavedAt, latestSavedAt } =
    parsed.export;
  const unreadable = splitUnreadable(invalid);
  const upload = await gzip(
    JSON.stringify({
      posts,
      collections,
      invalidCount: unreadable.saves.length,
    }),
  );
  const sizeError = uploadSizeError(upload.size, maxRequestBytes);
  if (sizeError) return { ok: false, error: sizeError };

  let response: Response;
  try {
    response = await send(upload);
  } catch {
    return { ok: false, error: UPLOAD_INTERRUPTED };
  }
  // Not every answer is JSON, e.g. the hosting's own errors.
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    return { ok: false, error: importErrorMessage(response.status, body) };
  }
  const summary = summarySchema.safeParse(body);
  if (!summary.success) return { ok: false, error: IMPORT_FAILED };
  return {
    ok: true,
    summary: summary.data,
    earliestSavedAt,
    latestSavedAt,
    unreadableSaves: unreadable.saves,
    unreadableCollections: unreadable.collections,
  };
}
