import { describe, expect, it } from "vitest";
import {
  RATE_LIMITED,
  SIGN_IN_CONNECTION_FAILED,
  codeError,
  emailError,
  failureMessage,
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

describe("signInErrorMessage for a lost connection", () => {
  it("asks to check the connection", () => {
    expect(signInErrorMessage({ code: "NETWORK_ERROR", status: 0 }, 3)).toBe(
      SIGN_IN_CONNECTION_FAILED,
    );
    expect(SIGN_IN_CONNECTION_FAILED).toBe(
      "We couldn't sign you in. Check your connection and try again.",
    );
  });
});

describe("failureMessage", () => {
  const messages = {
    connection: "Check your connection.",
    unexpected: "Oops.",
  };

  it("blames the connection for a network error or the server's error", () => {
    expect(failureMessage({ code: "NETWORK_ERROR", status: 0 }, messages)).toBe(
      messages.connection,
    );
    expect(failureMessage({ status: 500 }, messages)).toBe(messages.connection);
  });

  it("doesn't blame the connection for an unexpected error", () => {
    expect(
      failureMessage({ code: "UNEXPECTED_ERROR", status: 0 }, messages),
    ).toBe(messages.unexpected);
  });

  it("asks to wait when rate limited", () => {
    expect(failureMessage({ status: 429 }, messages)).toBe(RATE_LIMITED);
  });
});
