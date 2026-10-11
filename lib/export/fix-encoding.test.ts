import { describe, expect, it } from "vitest";
import { fixEncoding } from "./fix-encoding";

// Builds text the way Instagram's export stores it: each UTF-8 byte as its
// own character.
const asExported = (text: string) =>
  String.fromCharCode(...new TextEncoder().encode(text));

describe("fixEncoding", () => {
  // Every script ends up as UTF-8 bytes, so the same repair covers them all.
  it.each([
    ["Swedish", "Kanelbullar på söndag"],
    ["Polish", "Łódź, zażółć gęślą jaźń"],
    ["Greek", "Καλημέρα"],
    ["Russian", "Доброе утро"],
    ["Arabic", "صباح الخير"],
    ["Hindi", "नमस्ते"],
    ["Japanese", "おはようございます"],
    ["Chinese", "早上好"],
    ["emoji", "Dinner 🍝✨👩🏽‍🍳"],
  ])("repairs %s", (_, text) => {
    expect(fixEncoding(asExported(text))).toBe(text);
  });

  it("leaves plain ASCII alone", () => {
    expect(fixEncoding("Weeknight pasta")).toBe("Weeknight pasta");
  });

  it("leaves text that is already correct alone", () => {
    expect(fixEncoding("Kanelbullar på söndag 🍝")).toBe(
      "Kanelbullar på söndag 🍝",
    );
  });

  it("leaves real Latin-1 text alone when it isn't valid UTF-8", () => {
    expect(fixEncoding("café")).toBe("café");
  });
});
