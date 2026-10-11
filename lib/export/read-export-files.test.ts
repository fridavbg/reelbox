import { strToU8, zipSync } from "fflate";
import { describe, expect, it } from "vitest";
import {
  HTML_EXPORT,
  JSON_TOO_LARGE,
  MIXED_FILES,
  NO_FILE,
  NO_POSTS_FILE,
  NOT_A_ZIP,
  ONE_ZIP,
  WRONG_TYPE,
  ZIP_TOO_LARGE,
} from "./export-messages";
import { MAX_JSON_MB, MAX_ZIP_MB } from "./export-settings";
import { readExportFiles, type Upload } from "./read-export-files";

const MB = 1024 * 1024;
const posts = '[{"timestamp": 1}]';
const collections = '[{"fbid": "1"}]';

const file = (name: string, content: string | Uint8Array) =>
  new File(
    [typeof content === "string" ? content : new Uint8Array(content)],
    name,
  );
const zip = (entries: Record<string, string>, name = "instagram-export.zip") =>
  file(
    name,
    zipSync(
      Object.fromEntries(
        Object.entries(entries).map(([path, text]) => [path, strToU8(text)]),
      ),
    ),
  );
/** A file that only claims a size, so tests needn't allocate it. */
const sized = (name: string, size: number): Upload => ({
  name,
  size,
  arrayBuffer: async () => new ArrayBuffer(0),
});

describe("readExportFiles: ZIP", () => {
  it("finds both saved files, wherever they are in the ZIP", async () => {
    const result = await readExportFiles([
      zip({
        "your_instagram_activity/saved/saved_posts.json": posts,
        "your_instagram_activity/saved/saved_collections.json": collections,
        "your_instagram_activity/messages/inbox/friend/message_1.json": "{}",
      }),
    ]);
    expect(result).toEqual({ ok: true, files: { posts, collections } });
  });

  it("works without the collections file", async () => {
    const result = await readExportFiles([
      zip({ "saved/saved_posts.json": posts }),
    ]);
    expect(result).toEqual({ ok: true, files: { posts, collections: null } });
  });

  it("explains an HTML export", async () => {
    const result = await readExportFiles([
      zip({ "saved/saved_posts.html": "<html></html>" }),
    ]);
    expect(result).toEqual({ ok: false, error: HTML_EXPORT });
  });

  it("explains a ZIP without saved posts", async () => {
    const result = await readExportFiles([
      zip({ "messages/message_1.json": "{}" }),
    ]);
    expect(result).toEqual({ ok: false, error: NO_POSTS_FILE });
  });

  it("rejects a file that isn't really a ZIP", async () => {
    const result = await readExportFiles([file("export.zip", "not a zip")]);
    expect(result).toEqual({ ok: false, error: NOT_A_ZIP });
  });

  it(`rejects a ZIP larger than ${MAX_ZIP_MB} MB`, async () => {
    const result = await readExportFiles([
      sized("export.zip", MAX_ZIP_MB * MB + 1),
    ]);
    expect(result).toEqual({ ok: false, error: ZIP_TOO_LARGE });
  });

  it(`rejects a saved file that unpacks to more than ${MAX_JSON_MB} MB`, async () => {
    // Compresses to a few kB, like a "zip bomb" would.
    const huge = " ".repeat(MAX_JSON_MB * MB + 1);
    const result = await readExportFiles([
      zip({ "saved/saved_posts.json": huge }),
    ]);
    expect(result).toEqual({ ok: false, error: JSON_TOO_LARGE });
  });

  it("accepts one ZIP at a time", async () => {
    const one = zip({ "saved/saved_posts.json": posts });
    expect(await readExportFiles([one, one])).toEqual({
      ok: false,
      error: ONE_ZIP,
    });
  });
});

describe("readExportFiles: JSON files", () => {
  it("reads both files", async () => {
    const result = await readExportFiles([
      file("saved_collections.json", collections),
      file("saved_posts.json", posts),
    ]);
    expect(result).toEqual({ ok: true, files: { posts, collections } });
  });

  it("accepts a renamed second download", async () => {
    const result = await readExportFiles([file("saved_posts (1).json", posts)]);
    expect(result).toEqual({ ok: true, files: { posts, collections: null } });
  });

  it("needs saved_posts.json", async () => {
    const result = await readExportFiles([
      file("saved_collections.json", collections),
    ]);
    expect(result).toEqual({ ok: false, error: NO_POSTS_FILE });
  });

  it("rejects a random JSON file on its own", async () => {
    const result = await readExportFiles([file("data.json", '{"a": 1}')]);
    expect(result).toEqual({ ok: false, error: WRONG_TYPE });
  });

  it("rejects other JSON files", async () => {
    const result = await readExportFiles([
      file("saved_posts.json", posts),
      file("followers_1.json", "[]"),
    ]);
    expect(result).toEqual({ ok: false, error: WRONG_TYPE });
  });

  it(`rejects a file larger than ${MAX_JSON_MB} MB`, async () => {
    const result = await readExportFiles([
      sized("saved_posts.json", MAX_JSON_MB * MB + 1),
    ]);
    expect(result).toEqual({ ok: false, error: JSON_TOO_LARGE });
  });
});

describe("readExportFiles: wrong choices", () => {
  it("asks for a file when there is none", async () => {
    expect(await readExportFiles([])).toEqual({ ok: false, error: NO_FILE });
  });

  it("rejects other file types", async () => {
    expect(await readExportFiles([file("photo.png", "png")])).toEqual({
      ok: false,
      error: WRONG_TYPE,
    });
  });

  it("rejects a ZIP and JSON together", async () => {
    const result = await readExportFiles([
      zip({ "saved/saved_posts.json": posts }),
      file("saved_posts.json", posts),
    ]);
    expect(result).toEqual({ ok: false, error: MIXED_FILES });
  });
});
