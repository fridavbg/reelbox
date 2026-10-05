import { describe, expect, it } from "vitest";
import { signInCodeMessage } from "./email";
import { CODE_VALID_MINUTES } from "./sign-in-settings";

describe("signInCodeMessage", () => {
  const message = signInCodeMessage("123456");

  it("puts the code in the subject, text and HTML", () => {
    expect(message.subject).toContain("123456");
    expect(message.textContent).toContain("123456");
    expect(message.htmlContent).toContain("123456");
  });

  it("tells the user when the code expires", () => {
    expect(message.textContent).toContain(`${CODE_VALID_MINUTES} minutes`);
  });
});
