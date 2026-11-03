import { describe, expect, it } from "vitest";
import {
  kindText,
  openOnInstagramContext,
  savedOnText,
} from "./save-card-text";

describe("kindText", () => {
  it("names reels and posts", () => {
    expect(kindText("REEL")).toBe("Reel");
    expect(kindText("POST")).toBe("Post");
  });
});

describe("savedOnText", () => {
  it("writes the saved date like the import summary", () => {
    expect(savedOnText(new Date("2026-09-30T12:00:00Z"), "UTC")).toBe(
      "Saved 30 Sep 2026",
    );
  });

  it("uses the given time zone for the day", () => {
    const lateEvening = new Date("2026-09-30T23:30:00Z");
    expect(savedOnText(lateEvening, "UTC")).toBe("Saved 30 Sep 2026");
    expect(savedOnText(lateEvening, "Europe/Stockholm")).toBe(
      "Saved 1 Oct 2026",
    );
  });
});

describe("openOnInstagramContext", () => {
  it("says whose reel or post the link opens", () => {
    expect(openOnInstagramContext("REEL", "creator_one")).toBe(
      ": @creator_one's reel, opens in a new tab",
    );
    expect(openOnInstagramContext("POST", "creator_two")).toBe(
      ": @creator_two's post, opens in a new tab",
    );
  });
});
