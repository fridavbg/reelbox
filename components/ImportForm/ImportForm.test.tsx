// @vitest-environment jsdom
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IMPORT_FAILED } from "@/lib/import/import-messages";
import { ImportForm } from "./ImportForm";

const { runImport } = vi.hoisted(() => ({ runImport: vi.fn() }));
vi.mock("@/lib/import/run-import", () => ({ runImport }));

/** The drop area: the section holding the "Upload your export" heading. */
const dropArea = () =>
  screen
    .getByRole("heading", { name: "Upload your export" })
    .closest("section")!;

/**
 * Fires dragleave towards `to`. jsdom has no DragEvent, so the plain event
 * it builds gets the `relatedTarget` a browser's DragEvent would have.
 */
function dragLeave(area: HTMLElement, to: Element) {
  const event = createEvent.dragLeave(area);
  Object.defineProperty(event, "relatedTarget", { value: to });
  fireEvent(area, event);
}

describe("ImportForm drag highlight", () => {
  it("keeps the drag highlight while the pointer moves over the icon or heading", () => {
    render(<ImportForm />);
    const area = dropArea();
    fireEvent.dragOver(area);
    expect(area.className).toContain("dragging");

    // Moving onto a child fires dragleave on the area itself.
    dragLeave(area, area.querySelector("h2")!);
    expect(area.className).toContain("dragging");

    dragLeave(area, document.body);
    expect(area.className).not.toContain("dragging");
  });
});

describe("ImportForm chosen files", () => {
  it("lists two chosen files with the same name without React's key warning", async () => {
    runImport.mockResolvedValue({ ok: false, error: IMPORT_FAILED });
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const { container } = render(<ImportForm />);
    const input = container.querySelector('input[type="file"]')!;
    fireEvent.change(input, {
      target: {
        files: [
          new File(["{}"], "saved_posts.json"),
          new File(["[]"], "saved_posts.json"),
        ],
      },
    });

    await screen.findByText(IMPORT_FAILED);
    const list = screen.getByRole("list", { name: "Chosen files" });
    expect(list.querySelectorAll("li")).toHaveLength(2);
    const keyWarnings = log.mock.calls.filter((call) =>
      String(call[0]).includes("same key"),
    );
    expect(keyWarnings).toEqual([]);
    log.mockRestore();
  });
});
