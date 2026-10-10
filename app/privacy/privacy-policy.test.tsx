import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DEMO_LIFETIME_HOURS } from "@/lib/demo/demo-settings";
import { CODE_VALID_MINUTES, SESSION_DAYS } from "@/lib/sign-in-settings";
import { CONTACT_EMAIL } from "@/lib/site";
import { PrivacyPolicy } from "./privacy-policy";

// The policy must state what the app actually does, so its numbers come
// from the same settings the app runs on.
const text = renderToStaticMarkup(<PrivacyPolicy />)
  .replace(/<[^>]+>/g, "")
  .replace(/\s+/g, " ");

describe("privacy policy", () => {
  it("states the sign-in code lifetime from the settings", () => {
    expect(text).toContain(`expires after ${CODE_VALID_MINUTES} minutes`);
  });

  it("states the session lifetime from the settings", () => {
    expect(text).toContain(`ends ${SESSION_DAYS} days after you last used it`);
  });

  it("states the demo lifetime from the settings", () => {
    expect(text).toContain(`deleted after ${DEMO_LIFETIME_HOURS} hours`);
  });

  it("says sessions are stored without IP address or browser", () => {
    expect(text).toContain("stored without your IP address or browser");
  });

  it("gives a way to contact the owner", () => {
    expect(text).toContain(CONTACT_EMAIL);
  });
});
