import { describe, expect, it } from "vitest";
import { authCall, NETWORK_ERROR } from "./auth-call";

describe("authCall", () => {
  it("passes on what the call answers, success or error", async () => {
    const answer = { data: null, error: { status: 429 } };
    expect(await authCall(async () => answer)).toBe(answer);
  });

  it("turns a request that couldn't be sent into an error", async () => {
    const result = await authCall(async () => {
      throw new TypeError("Failed to fetch");
    });
    expect(result).toEqual({
      data: null,
      error: { code: NETWORK_ERROR, status: 0 },
    });
  });
});
