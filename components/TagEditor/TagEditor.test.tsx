import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { NO_TAGS } from "@/lib/saves/saves-text";
import {
  COLLECTION_SUGGESTIONS,
  creatorSuggestionsText,
} from "@/lib/tags-text";

vi.mock("@/app/saves/[id]/actions", () => ({
  addTag: vi.fn(),
  removeTag: vi.fn(),
  ignoreSuggestion: vi.fn(),
}));

const { TagEditor } = await import("./TagEditor");

const postId = "00000000-0000-4000-8000-000000000001";
const tags = [
  { id: "00000000-0000-4000-8000-000000000002", name: "Recipes" },
  { id: "00000000-0000-4000-8000-000000000003", name: "Weeknight" },
];

const userTags = [
  { name: "Bread", count: 1 },
  { name: "Dinner", count: 7 },
  { name: "recipes", count: 9 },
  { name: "Travel", count: 3 },
  { name: "Weeknight", count: 5 },
  { name: "Workouts", count: 2 },
];

const noSuggestions = {
  creatorUsername: "demo.kitchen",
  fromCreator: [],
  fromCollections: [],
};

const render = (props: Partial<Parameters<typeof TagEditor>[0]> = {}) =>
  renderToStaticMarkup(
    <TagEditor
      postId={postId}
      tags={tags}
      userTags={userTags}
      suggestions={noSuggestions}
      collections={[]}
      {...props}
    />,
  );

const addable = (html: string) =>
  [...html.matchAll(/aria-label="Add tag ([^"]+)"/g)].map((match) => match[1]);

describe("TagEditor", () => {
  it("lists the save's tags, each with a remove button", () => {
    const html = render();
    expect(html).toContain('aria-label="Remove tag Recipes"');
    expect(html).toContain('aria-label="Remove tag Weeknight"');
  });

  it("says so when the save has no tags", () => {
    expect(render({ tags: [] })).toContain(NO_TAGS);
  });

  it("offers the most-used tags not on the save before anything is typed", () => {
    const html = render({ userTags: userTags.slice(0, 4) });
    const offered = [...html.matchAll(/aria-label="Add tag ([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(offered).toEqual(["Dinner", "Travel", "Bread"]);
    expect(html).not.toContain("Show all");
  });

  it("offers to show all the user's tags when there are more than 6", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({
      name: `Tag ${i}`,
      count: 1,
    }));
    const html = render({ tags: [], userTags: many });
    expect(html.match(/aria-label="Add tag /g)).toHaveLength(6);
    expect(html).toMatch(
      /<button[^>]*aria-expanded="false"[^>]*>Show all 10 tags<\/button>/,
    );
  });

  it("has a status message for screen readers, empty until tags match", () => {
    expect(render()).toMatch(/<p[^>]*role="status"[^>]*><\/p>/);
  });

  it("has a labelled field and an Add button", () => {
    const html = render();
    expect(html).toMatch(/<label[^>]*>Add a tag<\/label>/);
    expect(html).toMatch(/<button[^>]*type="submit"[^>]*>Add<\/button>/);
  });
});

describe("TagEditor's suggestions", () => {
  const suggestions = {
    creatorUsername: "demo.kitchen",
    fromCreator: ["Dinner"],
    fromCollections: ["Try this weekend"],
  };
  // As React writes it in HTML.
  const creatorTitle = creatorSuggestionsText("demo.kitchen").replace(
    "'",
    "&#x27;",
  );

  it("groups them under where they come from, each with a button to hide it", () => {
    const html = render({ suggestions });
    expect(html).toContain(creatorTitle);
    expect(html).toContain(COLLECTION_SUGGESTIONS);
    expect(addable(html).slice(0, 2)).toEqual(["Dinner", "Try this weekend"]);
    expect(html).toContain('aria-label="Hide suggestion Dinner"');
    expect(html).toContain('aria-label="Hide suggestion Try this weekend"');
  });

  it("shows only the groups that have suggestions", () => {
    const html = render({ suggestions: { ...suggestions, fromCreator: [] } });
    expect(html).not.toContain(creatorTitle);
    expect(html).toContain(COLLECTION_SUGGESTIONS);
  });

  it("shows no suggestions when there are none", () => {
    const html = render();
    expect(html).not.toContain(creatorTitle);
    expect(html).not.toContain(COLLECTION_SUGGESTIONS);
    expect(html).not.toContain("Hide suggestion");
  });

  it("doesn't offer a suggested tag again under Most used", () => {
    const html = render({ suggestions });
    // Dinner is the most used, but it's already suggested above.
    expect(addable(html)).toEqual([
      "Dinner",
      "Try this weekend",
      "Travel",
      "Workouts",
      "Bread",
    ]);
  });
});

describe("TagEditor's undo message", () => {
  it("is in the page from the start, empty, so the first removal is announced", () => {
    const html = render();
    expect(html.match(/role="status"/g)).toHaveLength(2);
    expect(html).not.toContain("Undo");
  });
});
