// @vitest-environment jsdom
import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ImportForm } from "./ImportForm";

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
