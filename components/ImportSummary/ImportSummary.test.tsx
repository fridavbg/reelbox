import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImportSummary } from "./ImportSummary";

const props = {
  summary: {
    newCount: 6,
    duplicateCount: 28,
    invalidCount: 0,
    tagsAddedCount: 0,
    noLongerSavedCount: 0,
  },
  earliestSavedAt: new Date("2025-10-22T10:00:05.000Z"),
  latestSavedAt: new Date("2026-11-25T22:00:05.000Z"),
  unreadableSaves: [],
  unreadableCollections: [],
  onImportMore: () => {},
};

const TIP = "You can clear them in Instagram";

describe("ImportSummary", () => {
  it("offers another export and the tip about clearing saves on Instagram", () => {
    const html = renderToStaticMarkup(<ImportSummary {...props} />);
    expect(html).toContain("Import another export");
    expect(html).toContain(TIP);
  });

  it("offers the sample again in the demo, without the Instagram tip", () => {
    const html = renderToStaticMarkup(<ImportSummary {...props} demo />);
    expect(html).toContain("Import the sample again");
    expect(html).not.toContain("Import another export");
    expect(html).not.toContain(TIP);
  });
});
