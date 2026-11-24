import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { NoMatchingSaves } from "./NoMatchingSaves";

describe("NoMatchingSaves", () => {
  it("names the tag and links back to all saves", () => {
    const html = renderToStaticMarkup(
      <NoMatchingSaves
        filter={{ kind: "tag", key: "recipes" }}
        tagName="Recipes"
      />,
    );
    expect(html).toContain("<h2");
    expect(html).toContain("No saves tagged Recipes");
    expect(html).toMatch(/<a[^>]*href="\/saves"[^>]*>Show all saves<\/a>/);
  });

  it("escapes a tag name from the URL", () => {
    const html = renderToStaticMarkup(
      <NoMatchingSaves filter={{ kind: "tag", key: "<b>x" }} tagName="<b>x" />,
    );
    expect(html).toContain("No saves tagged &lt;b&gt;x");
  });

  it("says every save has a tag for untagged", () => {
    const html = renderToStaticMarkup(
      <NoMatchingSaves filter={{ kind: "untagged" }} />,
    );
    expect(html).toContain("Every save has a tag");
  });
});
