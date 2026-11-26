// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IMPORT_FAILED } from "@/lib/import/import-messages";

const { runImport } = vi.hoisted(() => ({ runImport: vi.fn() }));
vi.mock("@/lib/import/run-import", () => ({ runImport }));

const { useImport } = await import("./use-import");

describe("useImport", () => {
  it("runs one import at a time, even when started twice before React re-renders", async () => {
    runImport.mockResolvedValue({ ok: false, error: IMPORT_FAILED });
    const { result } = renderHook(() => useImport());
    const files = [new File(["[]"], "saved_posts.json")];

    // Two fast clicks or drops: both calls see the same render's state.
    await act(async () => {
      await Promise.all([
        result.current.start(files),
        result.current.start(files),
      ]);
    });
    expect(runImport).toHaveBeenCalledTimes(1);

    // Once it's finished, the next import can start.
    await act(() => result.current.start(files));
    expect(runImport).toHaveBeenCalledTimes(2);
  });
});
