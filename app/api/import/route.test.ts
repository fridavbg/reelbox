import { gzipSync } from "node:zlib";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";
import {
  DEMO_CANT_IMPORT,
  IMPORT_ALREADY_RUNNING,
  IMPORT_FAILED,
  UPLOAD_TOO_LARGE,
  UPLOAD_UNREADABLE,
} from "@/lib/import/import-messages";
import { MAX_UPLOAD_BYTES } from "@/lib/import/import-settings";

const requireApiUserMock = vi.fn();
const saveImportMock = vi.fn();

vi.mock("@/lib/session", () => ({ requireApiUser: requireApiUserMock }));
vi.mock("@/lib/import/save-import", () => ({ saveImport: saveImportMock }));

const { POST } = await import("./route");

const user = { id: "user-1", email: "user@example.com", isAnonymous: false };
const demoUser = { id: "demo-1", email: "demo@example.com", isAnonymous: true };

const upload = {
  posts: [
    {
      shortcode: "AbC123",
      url: "https://www.instagram.com/reel/AbC123/",
      kind: "REEL",
      caption: null,
      creatorUsername: "creator",
      creatorName: null,
      creatorUrl: "https://www.instagram.com/creator/",
      hashtags: [],
      fbid: null,
      savedAt: "2026-10-01T08:00:00.000Z",
    },
  ],
  collections: [],
  invalidCount: 0,
};
const summary = {
  newCount: 1,
  duplicateCount: 0,
  invalidCount: 0,
  tagsAddedCount: 0,
};

function request(body: BodyInit, contentType = "application/gzip"): Request {
  return new Request("http://localhost/api/import", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}
const gzipped = (value: unknown) =>
  request(gzipSync(Buffer.from(JSON.stringify(value))));

async function expectError(response: Response, status: number, error: string) {
  expect(response.status).toBe(status);
  expect(await response.json()).toEqual({ error });
  expect(saveImportMock).not.toHaveBeenCalled();
}

describe("POST /api/import", () => {
  beforeEach(() => {
    requireApiUserMock.mockReset().mockResolvedValue({ user });
    saveImportMock.mockReset().mockResolvedValue(summary);
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("imports the upload for the signed-in user and answers with the summary", async () => {
    const response = await POST(gzipped(upload));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(summary);
    expect(saveImportMock).toHaveBeenCalledWith(
      user.id,
      expect.objectContaining({
        posts: [
          expect.objectContaining({
            shortcode: "AbC123",
            savedAt: new Date("2026-10-01T08:00:00.000Z"),
          }),
        ],
      }),
    );
  });

  it("sends signed-out visitors the 401 from requireApiUser", async () => {
    const unauthorized = Response.json({ error: "x" }, { status: 401 });
    requireApiUserMock.mockResolvedValue({ response: unauthorized });
    const response = await POST(gzipped(upload));
    expect(response).toBe(unauthorized);
    expect(saveImportMock).not.toHaveBeenCalled();
  });

  it("refuses demo users", async () => {
    requireApiUserMock.mockResolvedValue({ user: demoUser });
    await expectError(await POST(gzipped(upload)), 403, DEMO_CANT_IMPORT);
  });

  it("refuses a body that isn't compressed", async () => {
    await expectError(
      await POST(request(JSON.stringify(upload), "application/json")),
      415,
      UPLOAD_UNREADABLE,
    );
  });

  it("refuses an upload that doesn't pass validation", async () => {
    await expectError(
      await POST(gzipped({ ...upload, posts: [] })),
      400,
      UPLOAD_UNREADABLE,
    );
  });

  it("refuses an upload that unpacks too large", async () => {
    const bomb = request(gzipSync(Buffer.alloc(MAX_UPLOAD_BYTES + 1)));
    await expectError(await POST(bomb), 413, UPLOAD_TOO_LARGE);
  });

  it("answers 409 when another import added the same saves first", async () => {
    saveImportMock.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "7.10.0",
      }),
    );
    const response = await POST(gzipped(upload));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: IMPORT_ALREADY_RUNNING });
    // Logged, so a 409 that isn't a parallel import still shows up in the logs.
    expect(console.warn).toHaveBeenCalled();
  });

  it("hides other errors from the user and logs them", async () => {
    saveImportMock.mockRejectedValue(new Error("connection reset"));
    const response = await POST(gzipped(upload));
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: IMPORT_FAILED });
    expect(console.error).toHaveBeenCalled();
  });
});
