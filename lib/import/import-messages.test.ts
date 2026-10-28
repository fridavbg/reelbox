import { describe, expect, it } from "vitest";
import {
  DEMO_CANT_IMPORT,
  IMPORT_FAILED,
  UPLOAD_TOO_LARGE,
  importErrorMessage,
  uploadSizeError,
} from "./import-messages";
import { MAX_REQUEST_BYTES } from "./import-settings";

describe("uploadSizeError", () => {
  it("lets an upload up to the hosting limit through", () => {
    expect(uploadSizeError(MAX_REQUEST_BYTES)).toBeUndefined();
  });

  it("stops a larger upload before it's sent", () => {
    expect(uploadSizeError(MAX_REQUEST_BYTES + 1)).toBe(UPLOAD_TOO_LARGE);
  });
});

describe("importErrorMessage", () => {
  it("shows the import route's own message", () => {
    expect(importErrorMessage(403, { error: DEMO_CANT_IMPORT })).toBe(
      DEMO_CANT_IMPORT,
    );
  });

  it("explains the hosting's size limit, which answers without our message", () => {
    expect(importErrorMessage(413, "Request Entity Too Large")).toBe(
      UPLOAD_TOO_LARGE,
    );
  });

  it("falls back to a general message for any other answer", () => {
    expect(importErrorMessage(502, "<html>Bad gateway</html>")).toBe(
      IMPORT_FAILED,
    );
    expect(importErrorMessage(500, { error: 42 })).toBe(IMPORT_FAILED);
  });
});
