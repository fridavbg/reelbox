export type GzipJsonResult =
  | { ok: true; value: unknown }
  | { ok: false; reason: "unreadable" | "too-large" };

/**
 * Unpacks a gzip-compressed request body and parses it as JSON. Reading stops
 * as soon as the unpacked size passes the limit, so a small upload that
 * unpacks to gigabytes (a "zip bomb") never fills the server's memory.
 *
 * @param body - The request body, e.g. `request.body`.
 * @param maxBytes - The largest unpacked size accepted.
 * @returns The parsed JSON, or why it couldn't be read.
 */
export async function readGzipJson(
  body: ReadableStream<Uint8Array<ArrayBuffer>> | null,
  maxBytes: number,
): Promise<GzipJsonResult> {
  if (!body) return { ok: false, reason: "unreadable" };
  const reader = body.pipeThrough(new DecompressionStream("gzip")).getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        return { ok: false, reason: "too-large" };
      }
      chunks.push(value);
    }
    const text = await new Blob(chunks).text();
    return { ok: true, value: JSON.parse(text) };
  } catch {
    // Not gzip, cut off halfway, or not JSON.
    return { ok: false, reason: "unreadable" };
  }
}
