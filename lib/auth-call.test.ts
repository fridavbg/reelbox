import { describe, expect, it, vi } from "vitest";
import { authCall, NETWORK_ERROR, UNEXPECTED_ERROR } from "./auth-call";

describe("authCall", () => {
  it("passes on what the call answers, success or error", async () => {
    const answer = { data: null, error: { status: 429 } };
    expect(await authCall(async () => answer)).toBe(answer);
  });

  it("turns a request that couldn't be sent into a network error", async () => {
    // What `fetch` throws when it can't reach the server.
    const result = await authCall(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(result).toEqual({
      data: null,
      error: { code: NETWORK_ERROR, status: 0 },
    });
  });

  it("turns anything else into an unexpected error, and logs it", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    const bug = new Error("Something broke");
    const result = await authCall(async () => {
      throw bug;
    });
    expect(result).toEqual({
      data: null,
      error: { code: UNEXPECTED_ERROR, status: 0 },
    });
    expect(log).toHaveBeenCalledWith("Auth request failed", bug);
  });
});
