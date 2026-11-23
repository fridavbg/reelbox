import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { TagChip } from "./TagChip";

describe("TagChip", () => {
  it("is a button that adds the tag when it's a suggestion", () => {
    const html = renderToStaticMarkup(
      <TagChip label="Recipes" onAdd={() => {}} />,
    );
    expect(html).toMatch(/^<button[^>]*type="button"/);
    expect(html).toContain('aria-label="Add tag Recipes"');
    expect(html).toContain("Recipes");
  });

  it("shows a read-only tag without a button", () => {
    const html = renderToStaticMarkup(<TagChip label="Recipes" />);
    expect(html).toContain("Recipes");
    expect(html).not.toContain("<button");
  });

  it("has a remove button named after the tag when it can be removed", () => {
    const html = renderToStaticMarkup(
      <TagChip label="Recipes" onRemove={() => {}} />,
    );
    expect(html).toMatch(/<button[^>]*type="button"/);
    expect(html).toContain('aria-label="Remove tag Recipes"');
    expect(html).not.toMatch(/\sdisabled=/);
  });

  it("marks the remove button unavailable while a change is saving, keeping it focusable", () => {
    const html = renderToStaticMarkup(
      <TagChip label="Recipes" onRemove={() => {}} busy />,
    );
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toMatch(/\sdisabled=/);
  });
});
