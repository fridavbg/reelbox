import { describe, expect, it } from "vitest";
import {
  CARD_CAPTION_LENGTH,
  cardCaption,
  kindText,
  openOnInstagramContext,
  savedOnText,
} from "./save-card-text";

describe("cardCaption", () => {
  it("keeps a short caption as it is", () => {
    expect(cardCaption("Crispy chickpea traybake")).toBe(
      "Crispy chickpea traybake",
    );
  });

  it("has no caption when there is none or it's only spaces", () => {
    expect(cardCaption(null)).toBeNull();
    expect(cardCaption("")).toBeNull();
    expect(cardCaption("  \n\n ")).toBeNull();
  });

  it("puts line breaks and repeated spaces together as one space", () => {
    expect(cardCaption("  Step one\n\nStep  two\t#fika \n")).toBe(
      "Step one Step two #fika",
    );
  });

  it("keeps a caption of exactly the card length", () => {
    const caption = "a".repeat(CARD_CAPTION_LENGTH);
    expect(cardCaption(caption)).toBe(caption);
  });

  it("cuts a long caption after the last whole word and adds …", () => {
    const words = "word ".repeat(100).trim(); // 499 characters
    const short = cardCaption(words);
    expect(short).toMatch(/^(word )+word…$/);
    expect(short!.length).toBeLessThanOrEqual(CARD_CAPTION_LENGTH + 1);
  });

  it("cuts a long caption without spaces at the card length", () => {
    const caption = "a".repeat(CARD_CAPTION_LENGTH + 50);
    expect(cardCaption(caption)).toBe(`${"a".repeat(CARD_CAPTION_LENGTH)}…`);
  });
});

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
