import { describe, expect, it } from "vitest";
import { COLLECTIONS_FILE, POSTS_FILE } from "@/lib/export/export-settings";
import { parseExport } from "@/lib/export/parse-export";
import { buildImport, type ExistingLibrary } from "@/lib/import/build-import";
import { parseImportRequest } from "@/lib/import/import-request";
import { buildDemoData } from "./sample-data";
import {
  SAMPLE_LEFT_OUT_SHORTCODE,
  expectedSampleUpload,
  sampleExportFiles,
} from "./sample-export";
import { isSampleUpload } from "./sample-upload-check";

const anchor = new Date("2026-11-26T10:00:05.000Z");
const HOUR_MS = 60 * 60 * 1000;

/** The sample, parsed the way the browser parses a chosen export. */
function parsedSample() {
  const parsed = parseExport(sampleExportFiles(anchor), anchor);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.export;
}

/** The upload as the route receives it: JSON, so dates are strings. */
const sent = () => JSON.parse(JSON.stringify(expectedSampleUpload(anchor)));

/** A new demo's library, as the seed writes it. */
function seededLibrary(): ExistingLibrary {
  const rows = buildDemoData("demo-1", anchor);
  return {
    posts: rows.posts,
    tags: rows.tags,
    collections: rows.collections,
    newestImportedSavedAt: rows.imports[0].latestSavedAt,
  };
}

describe("sampleExportFiles", () => {
  it("parses with the real parser, with only the 2 planned unreadable saves", () => {
    const parsed = parsedSample();
    // The 29 seeded saves minus the one left out, plus 6 new ones.
    expect(parsed.posts).toHaveLength(34);
    expect(parsed.invalid.filter((e) => e.file === POSTS_FILE)).toHaveLength(2);
    expect(parsed.invalid.filter((e) => e.file === COLLECTIONS_FILE)).toEqual(
      [],
    );
  });

  it("dates the seeded saves exactly as the seed does", () => {
    const seeded = new Map(
      buildDemoData("demo-1", anchor).posts.map((post) => [
        post.shortcode,
        post.savedAt,
      ]),
    );
    const kept = parsedSample().posts.filter((post) =>
      seeded.has(post.shortcode),
    );
    expect(kept).toHaveLength(28);
    for (const post of kept) {
      expect(post.savedAt).toEqual(seeded.get(post.shortcode));
    }
  });

  it("leaves out one seeded save from the middle of the range", () => {
    const seeded = buildDemoData("demo-1", anchor).posts;
    const times = seeded.map((post) => post.savedAt.getTime());
    const leftOut = seeded.find(
      (post) => post.shortcode === SAMPLE_LEFT_OUT_SHORTCODE,
    )!;
    expect(leftOut.savedAt.getTime()).toBeGreaterThan(Math.min(...times));
    expect(leftOut.savedAt.getTime()).toBeLessThan(Math.max(...times));
    expect(
      parsedSample().posts.some(
        (post) => post.shortcode === SAMPLE_LEFT_OUT_SHORTCODE,
      ),
    ).toBe(false);
  });

  it("dates the new saves at least 12 hours before the anchor and after every seeded save", () => {
    const seeded = buildDemoData("demo-1", anchor).posts;
    const newestSeeded = Math.max(...seeded.map((p) => p.savedAt.getTime()));
    const codes = new Set(seeded.map((post) => post.shortcode));
    const fresh = parsedSample().posts.filter((p) => !codes.has(p.shortcode));
    expect(fresh).toHaveLength(6);
    for (const post of fresh) {
      expect(post.savedAt.getTime()).toBeGreaterThan(newestSeeded);
      expect(post.savedAt.getTime()).toBeLessThanOrEqual(
        anchor.getTime() - 12 * HOUR_MS,
      );
    }
  });

  it("only has invented creators and shortcodes", () => {
    for (const post of parsedSample().posts) {
      expect(post.creatorUsername).toMatch(/^demo\./);
      expect(post.shortcode).toMatch(/^Demo/);
    }
  });

  it("stores text the way a real export does, and the parser repairs it", () => {
    // Each UTF-8 byte of "²" as its own character, as in Instagram's files.
    expect(sampleExportFiles(anchor).posts).toContain("20 m\u00c2\u00b2");
    const studio = parsedSample().posts.find(
      (post) => post.shortcode === "DemoHom0002",
    );
    expect(studio?.caption).toBe(
      "How to make a 20 m² studio feel twice as big.",
    );
  });
});

describe("expectedSampleUpload", () => {
  it("is accepted by the route's validation", () => {
    expect(parseImportRequest(sent(), anchor)).not.toBeNull();
  });

  it("shows the planned summary on the first and the second run", () => {
    const input = parseImportRequest(sent(), anchor)!;
    const library = seededLibrary();
    const first = buildImport("demo-1", input, library, anchor);
    expect(first.summary).toEqual({
      newCount: 6,
      duplicateCount: 28,
      invalidCount: 2,
      tagsAddedCount: 1,
      noLongerSavedCount: 1,
    });

    const flagged = new Set(first.flagPostIds);
    const second = buildImport(
      "demo-1",
      input,
      {
        posts: [
          ...library.posts.map((post) => ({
            ...post,
            noLongerSavedAt: flagged.has(post.id) ? anchor : null,
          })),
          ...first.posts,
        ],
        tags: [...library.tags, ...first.tags],
        collections: [...library.collections, ...first.collections],
        newestImportedSavedAt: first.import.latestSavedAt,
      },
      anchor,
    );
    expect(second.summary).toEqual({
      newCount: 0,
      duplicateCount: 34,
      invalidCount: 2,
      tagsAddedCount: 0,
      noLongerSavedCount: 0,
    });
  });
});

describe("isSampleUpload", () => {
  it("recognises the sample upload", () => {
    expect(isSampleUpload(sent(), anchor)).toBe(true);
  });

  it("refuses anything that differs from the sample", () => {
    const upload = sent();
    const changed = (change: (copy: typeof upload) => void) => {
      const copy = structuredClone(upload);
      change(copy);
      return copy;
    };
    expect(
      isSampleUpload(
        changed((u) => u.posts.pop()),
        anchor,
      ),
    ).toBe(false);
    expect(
      isSampleUpload(
        changed((u) => (u.posts[0].caption = "Someone's real caption")),
        anchor,
      ),
    ).toBe(false);
    expect(
      isSampleUpload(
        changed(
          (u) =>
            (u.posts[0].savedAt = new Date(
              new Date(u.posts[0].savedAt).getTime() + 1000,
            ).toISOString()),
        ),
        anchor,
      ),
    ).toBe(false);
    expect(isSampleUpload(upload, new Date(anchor.getTime() + 1000))).toBe(
      false,
    );
    expect(isSampleUpload(null, anchor)).toBe(false);
  });
});
