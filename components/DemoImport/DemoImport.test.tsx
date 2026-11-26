// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoAnchor } from "@/lib/demo/demo-anchor";
import { sampleExportFiles } from "@/lib/demo/sample-export";
import { COLLECTIONS_FILE, POSTS_FILE } from "@/lib/export/export-settings";
import {
  DEMO_CANT_IMPORT,
  IMPORT_FAILED,
  SAMPLE_EXPORT_NOTE,
} from "@/lib/import/import-messages";

const runImport = vi.fn();
vi.mock("@/lib/import/run-import", () => ({ runImport }));

const { DemoImport } = await import("./DemoImport");

const createdAt = "2026-11-26T10:00:05.123Z";
const TRY = "Try with a sample export";

const done = {
  ok: true,
  summary: {
    newCount: 6,
    duplicateCount: 28,
    invalidCount: 2,
    tagsAddedCount: 1,
    noLongerSavedCount: 1,
  },
  earliestSavedAt: new Date("2025-10-22T10:00:05.000Z"),
  latestSavedAt: new Date("2026-11-25T22:00:05.000Z"),
  unreadableSaves: [],
  unreadableCollections: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("DemoImport", () => {
  it("offers the sample, not a file picker", () => {
    render(<DemoImport createdAt={createdAt} />);
    expect(screen.getByText(DEMO_CANT_IMPORT)).toBeTruthy();
    expect(screen.getByText(SAMPLE_EXPORT_NOTE)).toBeTruthy();
    expect(screen.getByRole("button", { name: TRY })).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Back to the sample saves" }),
    ).toBeTruthy();
    expect(document.querySelector('input[type="file"]')).toBeNull();
  });

  it("imports the two sample files and shows the summary", async () => {
    runImport.mockResolvedValue(done);
    render(<DemoImport createdAt={createdAt} />);
    fireEvent.click(screen.getByRole("button", { name: TRY }));

    expect(
      await screen.findByRole("heading", { name: "Import complete" }),
    ).toBeTruthy();
    const [files] = runImport.mock.calls[0];
    const expected = sampleExportFiles(demoAnchor(new Date(createdAt)));
    expect(files.map((file: File) => file.name)).toEqual([
      POSTS_FILE,
      COLLECTIONS_FILE,
    ]);
    expect(await files[0].text()).toBe(expected.posts);
    expect(await files[1].text()).toBe(expected.collections);

    fireEvent.click(
      screen.getByRole("button", { name: "Import another export" }),
    );
    expect(screen.getByRole("button", { name: TRY })).toBeTruthy();
  });

  it("shows what went wrong and lets the user try again", async () => {
    runImport.mockResolvedValue({ ok: false, error: IMPORT_FAILED });
    render(<DemoImport createdAt={createdAt} />);
    fireEvent.click(screen.getByRole("button", { name: TRY }));

    expect(await screen.findByText(IMPORT_FAILED)).toBeTruthy();
    const button = screen.getByRole("button", { name: TRY });
    expect(button.getAttribute("aria-busy")).toBeNull();
  });
});
