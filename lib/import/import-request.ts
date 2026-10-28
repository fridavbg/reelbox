import { z } from "zod";
import {
  FUTURE_SAVE_TOLERANCE_MS,
  INSTAGRAM_LAUNCH,
} from "@/lib/export/export-settings";
import {
  SHORTCODE,
  parsePostLink,
  profileUrl,
} from "@/lib/export/instagram-url";
import type { ImportInput } from "./build-import";
import {
  MAX_CAPTION_LENGTH,
  MAX_COLLECTIONS,
  MAX_HASHTAGS,
  MAX_IMPORT_POSTS,
  MAX_INVALID_COUNT,
  MAX_TEXT_LENGTH,
} from "./import-settings";

const shortcodeSchema = z.string().max(100).regex(SHORTCODE);

/**
 * Builds the schema for an upload. Links are rebuilt with `parsePostLink` and
 * `profileUrl`, never copied, so a tampered upload can't plant a foreign or
 * `javascript:` link.
 *
 * @param now - The server's time, for the latest saved date allowed.
 * @returns A Zod schema whose output is ready for `saveImport`.
 */
function importRequestSchema(now: Date) {
  const latestSave = new Date(now.getTime() + FUTURE_SAVE_TOLERANCE_MS);

  const postSchema = z
    .object({
      shortcode: shortcodeSchema,
      url: z.string().max(MAX_TEXT_LENGTH),
      kind: z.enum(["POST", "REEL"]),
      caption: z.string().max(MAX_CAPTION_LENGTH).nullable(),
      creatorUsername: z.string(),
      creatorName: z.string().max(MAX_TEXT_LENGTH).nullable(),
      // Only checked for type: the stored link is rebuilt from the username.
      creatorUrl: z.string().max(MAX_TEXT_LENGTH),
      hashtags: z.array(z.string().max(MAX_TEXT_LENGTH)).max(MAX_HASHTAGS),
      fbid: z.string().max(100).nullable(),
      savedAt: z.iso
        .datetime()
        .transform((value) => new Date(value))
        .refine((date) => date >= INSTAGRAM_LAUNCH && date <= latestSave),
    })
    .transform((post, context) => {
      const link = parsePostLink(post.url);
      const creatorUrl = profileUrl(post.creatorUsername);
      if (link?.shortcode !== post.shortcode || !creatorUrl) {
        context.addIssue({ code: "custom", message: "Invalid link" });
        return z.NEVER;
      }
      return { ...post, kind: link.kind, url: link.url, creatorUrl };
    });

  const collectionSchema = z.object({
    externalId: z.string().min(1).max(100),
    name: z.string().max(MAX_TEXT_LENGTH),
    shortcodes: z.array(shortcodeSchema).max(MAX_IMPORT_POSTS),
  });

  return z.object({
    posts: z.array(postSchema).min(1).max(MAX_IMPORT_POSTS),
    collections: z.array(collectionSchema).max(MAX_COLLECTIONS),
    invalidCount: z.number().int().min(0).max(MAX_INVALID_COUNT),
  });
}

/**
 * Checks an upload from the browser again on the server, since anyone can
 * send any request. Unknown fields are dropped.
 *
 * @param value - The upload's parsed JSON.
 * @param now - The server's time, for the latest saved date allowed.
 * @returns The upload ready for `saveImport`, or null if anything is wrong.
 */
export function parseImportRequest(
  value: unknown,
  now = new Date(),
): ImportInput | null {
  const result = importRequestSchema(now).safeParse(value);
  return result.success ? result.data : null;
}
