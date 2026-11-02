import { unzipSync } from "fflate";
import {
  FILES_UNREADABLE,
  HTML_EXPORT,
  JSON_TOO_LARGE,
  MIXED_FILES,
  NO_FILE,
  NO_POSTS_FILE,
  NOT_A_ZIP,
  ONE_ZIP,
  POSTS_FILE_TOO,
  WRONG_TYPE,
  ZIP_TOO_LARGE,
} from "./export-messages";
import {
  COLLECTIONS_FILE,
  MAX_JSON_MB,
  MAX_ZIP_MB,
  POSTS_FILE,
} from "./export-settings";

const MB = 1024 * 1024;

/** What the parser needs from a browser `File`; tests pass plain objects. */
export type Upload = Pick<File, "name" | "size" | "arrayBuffer">;

export type ExportTexts = { posts: string; collections: string | null };

export type ReadResult =
  { ok: true; files: ExportTexts } | { ok: false; error: string };

const fileName = (path: string) => path.split("/").pop()!.toLowerCase();
const isZip = (upload: Upload) => fileName(upload.name).endsWith(".zip");
const isJson = (upload: Upload) => fileName(upload.name).endsWith(".json");
const utf8 = new TextDecoder("utf-8");

/**
 * Reads a chosen file's bytes.
 *
 * @param upload - The chosen file.
 * @returns The bytes, or null if the file can't be opened any more, e.g. it
 *   was moved or deleted after it was chosen.
 */
async function bytesOf(upload: Upload) {
  try {
    return new Uint8Array(await upload.arrayBuffer());
  } catch {
    return null;
  }
}

/**
 * Reads the two saved files from Instagram's export ZIP, or from the JSON
 * files themselves. Runs in the browser, so the rest of the export (messages,
 * followers and so on) is never uploaded.
 */
export async function readExportFiles(uploads: Upload[]): Promise<ReadResult> {
  if (uploads.length === 0) return { ok: false, error: NO_FILE };
  const zips = uploads.filter(isZip);
  const jsons = uploads.filter(isJson);
  if (zips.length + jsons.length < uploads.length) {
    return { ok: false, error: WRONG_TYPE };
  }
  if (zips.length > 0 && jsons.length > 0) {
    return { ok: false, error: MIXED_FILES };
  }
  if (zips.length > 1) return { ok: false, error: ONE_ZIP };
  return zips.length === 1 ? readZip(zips[0]) : readJsonFiles(jsons);
}

async function readZip(zip: Upload): Promise<ReadResult> {
  if (zip.size > MAX_ZIP_MB * MB) return { ok: false, error: ZIP_TOO_LARGE };
  const bytes = await bytesOf(zip);
  if (!bytes) return { ok: false, error: FILES_UNREADABLE };

  let html = false;
  let tooLarge = false;
  let entries: Record<string, Uint8Array>;
  try {
    entries = unzipSync(bytes, {
      // Only the two saved files are decompressed; everything else is skipped.
      filter: (entry) => {
        const name = fileName(entry.name);
        if (name === "saved_posts.html" || name === "saved_collections.html") {
          html = true;
        }
        if (name !== POSTS_FILE && name !== COLLECTIONS_FILE) return false;
        // Checked before decompressing, so a tiny ZIP can't expand to gigabytes.
        if (entry.originalSize > MAX_JSON_MB * MB) {
          tooLarge = true;
          return false;
        }
        return true;
      },
    });
  } catch {
    return { ok: false, error: NOT_A_ZIP };
  }
  if (tooLarge) return { ok: false, error: JSON_TOO_LARGE };

  const find = (name: string) =>
    Object.entries(entries).find(([path]) => fileName(path) === name)?.[1];
  const posts = find(POSTS_FILE);
  const collections = find(COLLECTIONS_FILE);
  if (!posts) return { ok: false, error: html ? HTML_EXPORT : NO_POSTS_FILE };
  return {
    ok: true,
    files: {
      posts: utf8.decode(posts),
      collections: collections ? utf8.decode(collections) : null,
    },
  };
}

async function readJsonFiles(jsons: Upload[]): Promise<ReadResult> {
  // Browsers may rename a second download to "saved_posts (1).json".
  const matches = (upload: Upload, base: string) =>
    fileName(upload.name).startsWith(base.replace(".json", ""));
  const posts = jsons.find((upload) => matches(upload, POSTS_FILE));
  const collections = jsons.find((upload) => matches(upload, COLLECTIONS_FILE));
  if (jsons.some((upload) => upload !== posts && upload !== collections)) {
    return { ok: false, error: WRONG_TYPE };
  }
  if (!posts) return { ok: false, error: POSTS_FILE_TOO };
  if (jsons.some((upload) => upload.size > MAX_JSON_MB * MB)) {
    return { ok: false, error: JSON_TOO_LARGE };
  }
  const postBytes = await bytesOf(posts);
  const collectionBytes = collections ? await bytesOf(collections) : null;
  if (!postBytes || (collections && !collectionBytes)) {
    return { ok: false, error: FILES_UNREADABLE };
  }
  return {
    ok: true,
    files: {
      posts: utf8.decode(postBytes),
      collections: collectionBytes ? utf8.decode(collectionBytes) : null,
    },
  };
}
