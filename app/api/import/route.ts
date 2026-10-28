import { Prisma } from "@/generated/prisma/client";
import {
  DEMO_CANT_IMPORT,
  IMPORT_ALREADY_RUNNING,
  IMPORT_FAILED,
  UPLOAD_TOO_LARGE,
  UPLOAD_UNREADABLE,
} from "@/lib/import/import-messages";
import { parseImportRequest } from "@/lib/import/import-request";
import { MAX_UPLOAD_BYTES } from "@/lib/import/import-settings";
import { readGzipJson } from "@/lib/import/read-gzip-json";
import { saveImport } from "@/lib/import/save-import";
import { requireApiUser } from "@/lib/session";

/**
 * Answers with an error message for the upload page.
 *
 * @param status - The HTTP status code.
 * @param message - Shown to the user as is.
 * @returns A JSON response `{ error }`.
 */
const failure = (status: number, message: string) =>
  Response.json({ error: message }, { status });

/**
 * Imports the saves the browser parsed from an Instagram export. The body is
 * the gzip-compressed JSON of an upload, sent as `application/gzip`.
 *
 * @param request - The upload from the import page.
 * @returns The summary counts, or `{ error }` with a status code.
 */
export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (response) return response;
  // Demo accounts are deleted after a day; real data doesn't belong in them.
  if (user.isAnonymous) return failure(403, DEMO_CANT_IMPORT);

  const contentType = request.headers.get("content-type")?.split(";")[0];
  if (contentType?.trim() !== "application/gzip") {
    return failure(415, UPLOAD_UNREADABLE);
  }
  const body = await readGzipJson(request.body, MAX_UPLOAD_BYTES);
  if (!body.ok) {
    return body.reason === "too-large"
      ? failure(413, UPLOAD_TOO_LARGE)
      : failure(400, UPLOAD_UNREADABLE);
  }
  const input = parseImportRequest(body.value);
  if (!input) return failure(400, UPLOAD_UNREADABLE);

  try {
    return Response.json(await saveImport(user.id, input));
  } catch (error) {
    // Two imports at once: the unique constraints stopped the later one.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      console.warn("Import stopped by a unique constraint", error.meta);
      return failure(409, IMPORT_ALREADY_RUNNING);
    }
    console.error("Import failed", error);
    return failure(500, IMPORT_FAILED);
  }
}
