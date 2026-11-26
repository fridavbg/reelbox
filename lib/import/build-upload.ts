import { parsePostLink } from "@/lib/export/instagram-url";
import type {
  ParsedCollection,
  ParsedExport,
  ParsedPost,
} from "@/lib/export/parse-export";
import { splitUnreadable } from "./build-import";

/** What the browser sends to the import route, before compression. */
export type UploadBody = {
  posts: ParsedPost[];
  collections: ParsedCollection[];
  invalidCount: number;
  unreadableShortcodes: string[];
};

/**
 * Builds the upload from a parsed export. Only the saved posts and
 * collections leave the device, plus what the server needs about saves that
 * couldn't be read.
 *
 * @param parsed - The export as parsed in the browser.
 * @returns The upload, ready to send as JSON.
 */
export function buildUpload(parsed: ParsedExport): UploadBody {
  const unreadable = splitUnreadable(parsed.invalid);
  return {
    posts: parsed.posts,
    collections: parsed.collections,
    invalidCount: unreadable.saves.length,
    // Still saved, only unreadable, so the server never flags them.
    unreadableShortcodes: unreadable.saves.flatMap((entry) =>
      entry.url ? (parsePostLink(entry.url)?.shortcode ?? []) : [],
    ),
  };
}
