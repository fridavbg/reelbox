import { describe, expect, it } from "vitest";
import {
  formatDay,
  savesImportedText,
  tagsAddedText,
  unreadableCollectionsText,
  unreadableSavesText,
} from "./import-summary";

describe("formatDay", () => {
  it("writes a date like the wireframes", () => {
    expect(formatDay(new Date("2016-12-14T22:01:04Z"), "UTC")).toBe(
      "14 Dec 2016",
    );
  });

  it("uses the given time zone", () => {
    // Late evening in UTC is already the next day in Stockholm.
    expect(
      formatDay(new Date("2016-12-14T23:30:00Z"), "Europe/Stockholm"),
    ).toBe("15 Dec 2016");
  });
});

describe("unreadableSavesText", () => {
  it.each([
    [1, "Why couldn't 1 save be read?"],
    [52, "Why couldn't 52 saves be read?"],
  ])("asks about %i", (count, text) => {
    expect(unreadableSavesText(count)).toBe(text);
  });
});

describe("tagsAddedText", () => {
  it.each([
    [0, undefined],
    [1, "1 Instagram collection was added as a tag."],
    [55, "55 Instagram collections were added as tags."],
  ])("describes %i new tags", (count, text) => {
    expect(tagsAddedText(count)).toBe(text);
  });
});

describe("unreadableCollectionsText", () => {
  it.each([
    [0, undefined],
    [1, "1 collection couldn't be read, so it wasn't added as a tag."],
    [2, "2 collections couldn't be read, so they weren't added as tags."],
  ])("writes the line for %i", (count, text) => {
    expect(unreadableCollectionsText(count)).toBe(text);
  });
});

describe("savesImportedText", () => {
  it.each([
    [
      0,
      "No saves yet. Import your Instagram export to see your saved reels and posts here.",
    ],
    [
      1,
      "1 save imported. Import a new export any time to add the latest ones.",
    ],
    [
      2179,
      "2179 saves imported. Import a new export any time to add the latest ones.",
    ],
  ])("writes the line for %i", (count, text) => {
    expect(savesImportedText(count)).toBe(text);
  });
});
