import { describe, expect, it } from "vitest";
import {
  RATE_LIMITED,
  codeError,
  emailError,
  signInErrorMessage,
} from "./sign-in-messages";

describe("emailError", () => {
  it("accepts a valid address, ignoring surrounding spaces", () => {
    expect(emailError(" you@example.com ")).toBeUndefined();
  });

  it("asks for an address when empty", () => {
    expect(emailError("")).toBe("Enter your email address.");
  });

  it("explains the format when invalid", () => {
    expect(emailError("you@")).toContain("you@example.com");
  });
});

describe("codeError", () => {
  it("accepts exactly 6 digits", () => {
    expect(codeError("482913")).toBeUndefined();
  });

  it.each(["", "12345", "1234567", "12a456"])("rejects %j", (code) => {
    expect(codeError(code)).toBe("Enter the 6-digit code from the email.");
  });
});

describe("signInErrorMessage", () => {
  it("counts down the attempts left on a wrong code", () => {
    expect(signInErrorMessage({ code: "INVALID_OTP" }, 2)).toBe(
      "That code is not right. You have 2 attempts left.",
    );
    expect(signInErrorMessage({ code: "INVALID_OTP" }, 1)).toContain(
      "1 attempt left",
    );
  });

  it("asks for a new code when no attempts are left", () => {
    expect(signInErrorMessage({ code: "INVALID_OTP" }, 0)).toContain(
      "Send a new code",
    );
    expect(signInErrorMessage({ code: "TOO_MANY_ATTEMPTS" }, 3)).toContain(
      "Send a new code",
    );
  });

  it("explains an expired code", () => {
    expect(signInErrorMessage({ code: "OTP_EXPIRED" }, 3)).toContain("expired");
  });

  it("explains the rate limit", () => {
    expect(signInErrorMessage({ status: 429 }, 3)).toBe(RATE_LIMITED);
  });
});
