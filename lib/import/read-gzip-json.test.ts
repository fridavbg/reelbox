import { gzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import { readGzipJson } from "./read-gzip-json";

// Copied into a plain Uint8Array, which is what a request body is typed as.
const body = (bytes: Uint8Array) => new Response(new Uint8Array(bytes)).body;
const gzipJson = (value: unknown) =>
  body(gzipSync(Buffer.from(JSON.stringify(value))));

describe("readGzipJson", () => {
  it("reads compressed JSON", async () => {
    const result = await readGzipJson(gzipJson({ posts: [1, 2] }), 1_000);
    expect(result).toEqual({ ok: true, value: { posts: [1, 2] } });
  });

  it("refuses a body that isn't compressed", async () => {
    const result = await readGzipJson(body(Buffer.from('{"posts":[]}')), 1_000);
    expect(result).toEqual({ ok: false, reason: "unreadable" });
  });

  it("refuses compressed text that isn't JSON", async () => {
    const result = await readGzipJson(
      body(gzipSync(Buffer.from("not json"))),
      1_000,
    );
    expect(result).toEqual({ ok: false, reason: "unreadable" });
  });

  it("refuses a missing body", async () => {
    expect(await readGzipJson(null, 1_000)).toEqual({
      ok: false,
      reason: "unreadable",
    });
  });

  it("stops once the unpacked size passes the limit", async () => {
    // 2 MB of zeros compresses to about 2 KB: a small upload that unpacks big.
    const bomb = body(gzipSync(Buffer.alloc(2_000_000)));
    const result = await readGzipJson(bomb, 1_000_000);
    expect(result).toEqual({ ok: false, reason: "too-large" });
  });
});
