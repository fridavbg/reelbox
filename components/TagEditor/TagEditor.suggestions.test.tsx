// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SUGGESTION_IGNORE_FAILED } from "@/lib/tags-text";

const addTag = vi.fn();
const ignoreSuggestion = vi.fn();
vi.mock("@/app/saves/[id]/actions", () => ({
  addTag,
  removeTag: vi.fn(),
  ignoreSuggestion,
}));

const { TagEditor } = await import("./TagEditor");

const postId = "00000000-0000-4000-8000-000000000001";
const suggestions = {
  creatorUsername: "demo.kitchen",
  fromCreator: ["Weeknight"],
  fromCollections: ["Try this weekend"],
};

const show = () =>
  render(
    <TagEditor
      postId={postId}
      tags={[]}
      userTags={[]}
      suggestions={suggestions}
    />,
  );

beforeEach(() => {
  vi.clearAllMocks();
});

describe("TagEditor's suggestions", () => {
  it("adds a suggested tag with one tap", async () => {
    addTag.mockResolvedValue({ ok: true });
    show();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Add tag Weeknight" }),
      );
    });
    expect(addTag).toHaveBeenCalledWith(postId, "Weeknight");
  });

  it("hides a suggestion at once and remembers it on the server", async () => {
    let finish: (result: { ok: true }) => void = () => {};
    ignoreSuggestion.mockReturnValue(
      new Promise((resolve) => (finish = resolve)),
    );
    show();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Hide suggestion Weeknight" }),
      );
    });
    expect(ignoreSuggestion).toHaveBeenCalledWith(postId, "Weeknight");
    expect(screen.queryByRole("button", { name: "Add tag Weeknight" })).toBe(
      null,
    );
    // Its button is gone, so focus goes to the tag field.
    expect(document.activeElement).toBe(screen.getByLabelText("Add a tag"));
    await act(async () => finish({ ok: true }));
  });

  it("brings a suggestion back with a message when hiding it fails", async () => {
    ignoreSuggestion.mockResolvedValue({
      ok: false,
      error: SUGGESTION_IGNORE_FAILED,
    });
    show();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Hide suggestion Weeknight" }),
      );
    });
    expect(screen.getByText(SUGGESTION_IGNORE_FAILED)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Add tag Weeknight" }),
    ).toBeTruthy();
  });

  it("shows the message also when the connection is lost", async () => {
    ignoreSuggestion.mockRejectedValue(new TypeError("Failed to fetch"));
    show();
    await act(async () => {
      fireEvent.click(
        screen.getByRole("button", { name: "Hide suggestion Weeknight" }),
      );
    });
    expect(screen.getByText(SUGGESTION_IGNORE_FAILED)).toBeTruthy();
  });

  it("hides suggestions while typing, when only matching tags are offered", () => {
    show();
    fireEvent.change(screen.getByLabelText("Add a tag"), {
      target: { value: "we" },
    });
    expect(screen.queryByRole("button", { name: /Hide suggestion/ })).toBe(
      null,
    );
  });
});
