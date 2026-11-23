import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Toast } from "./Toast";

describe("Toast", () => {
  it("keeps an empty status region in the page while there's no message, so screen readers announce the next one", () => {
    const html = renderToStaticMarkup(<Toast />);
    expect(html).toMatch(/^<div[^>]*role="status"[^>]*><\/div>$/);
  });

  it("shows the message with its action button", () => {
    const html = renderToStaticMarkup(
      <Toast
        message="Removed Recipes"
        action={{ label: "Undo", onClick: () => {} }}
      />,
    );
    expect(html).toContain("Removed Recipes");
    expect(html).toMatch(/<button[^>]*type="button"[^>]*>Undo<\/button>/);
  });

  it("has no button when there's no action", () => {
    const html = renderToStaticMarkup(<Toast message="Saved" />);
    expect(html).toContain("Saved");
    expect(html).not.toContain("<button");
  });
});
