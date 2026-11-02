import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { NOT_AN_EXPORT } from "@/lib/export/export-messages";
import {
  DEMO_CANT_IMPORT,
  IMPORT_FAILED,
  UPLOAD_INTERRUPTED,
  UPLOAD_TOO_LARGE,
} from "./import-messages";
import { runImport } from "./run-import";

// The anonymized fixture: 3 readable saves, 3 collections, 7 problems of
// which 6 are about single saves.
const fixture = (name: string) =>
  new File(
    [readFileSync(join(__dirname, "../export/fixtures", name), "utf8")],
    name,
  );
const exportFiles = () => [
  fixture("saved_posts.json"),
  fixture("saved_collections.json"),
];

const summary = {
  newCount: 3,
  duplicateCount: 0,
  invalidCount: 6,
  tagsAddedCount: 3,
};
const answer = (status: number, body: unknown) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
  });

// Records what would be sent, and answers like the route would.
function fakeSend(response: Response | Error = answer(200, summary)) {
  const sent: Blob[] = [];
  const send = async (upload: Blob) => {
    sent.push(upload);
    if (response instanceof Error) throw response;
    return response;
  };
  return { send, sent };
}

const unpack = (upload: Blob) =>
  new Response(
    upload.stream().pipeThrough(new DecompressionStream("gzip")),
  ).json();

describe("runImport", () => {
  it("sends the parsed saves, compressed", async () => {
    const { send, sent } = fakeSend();
    await runImport(exportFiles(), send);
    expect(sent).toHaveLength(1);
    const upload = await unpack(sent[0]);
    expect(upload.posts).toHaveLength(3);
    expect(upload.collections).toHaveLength(3);
    expect(upload.invalidCount).toBe(6);
  });

  it("returns the summary with the export's date range and problems", async () => {
    const result = await runImport(exportFiles(), fakeSend().send);
    expect(result).toMatchObject({
      ok: true,
      summary,
      earliestSavedAt: new Date("2024-01-01T10:00:00Z"),
      latestSavedAt: new Date("2025-10-02T09:00:00Z"),
    });
    expect(result.ok && result.unreadableSaves).toHaveLength(6);
    expect(result.ok && result.unreadableCollections).toHaveLength(1);
  });

  it("shows the parser's error for a file that isn't an export, sending nothing", async () => {
    const { send, sent } = fakeSend();
    const notAnExport = new File(['{"hello": 1}'], "saved_posts.json");
    expect(await runImport([notAnExport], send)).toEqual({
      ok: false,
      error: NOT_AN_EXPORT,
    });
    expect(sent).toEqual([]);
  });

  it("stops before sending when the compressed upload is too large", async () => {
    const { send, sent } = fakeSend();
    const result = await runImport(exportFiles(), send, {
      maxRequestBytes: 10,
    });
    expect(result).toEqual({ ok: false, error: UPLOAD_TOO_LARGE });
    expect(sent).toEqual([]);
  });

  it("shows the route's own error message", async () => {
    const { send } = fakeSend(answer(403, { error: DEMO_CANT_IMPORT }));
    expect(await runImport(exportFiles(), send)).toEqual({
      ok: false,
      error: DEMO_CANT_IMPORT,
    });
  });

  it("explains the hosting's size limit, which answers without JSON", async () => {
    const { send } = fakeSend(answer(413, "Request Entity Too Large"));
    expect(await runImport(exportFiles(), send)).toEqual({
      ok: false,
      error: UPLOAD_TOO_LARGE,
    });
  });

  it("says the upload was interrupted when the connection fails", async () => {
    const { send } = fakeSend(new TypeError("Failed to fetch"));
    expect(await runImport(exportFiles(), send)).toEqual({
      ok: false,
      error: UPLOAD_INTERRUPTED,
    });
  });

  it("fails with a message instead of throwing when something unexpected breaks", async () => {
    vi.stubGlobal(
      "CompressionStream",
      class {
        constructor() {
          throw new Error("Not supported");
        }
      },
    );
    try {
      expect(await runImport(exportFiles(), fakeSend().send)).toEqual({
        ok: false,
        error: IMPORT_FAILED,
      });
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("fails when the route's answer isn't a summary", async () => {
    const { send } = fakeSend(answer(200, { hello: 1 }));
    expect(await runImport(exportFiles(), send)).toEqual({
      ok: false,
      error: IMPORT_FAILED,
    });
  });
});
