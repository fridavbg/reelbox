import { beforeEach, describe, expect, it, vi } from "vitest";

const getSessionMock = vi.fn();

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("./auth", () => ({
  auth: () => ({ api: { getSession: getSessionMock } }),
}));

const { requireApiUser } = await import("./session");

describe("requireApiUser", () => {
  beforeEach(() => getSessionMock.mockReset());

  it("answers 401 without a valid session", async () => {
    getSessionMock.mockResolvedValue(null);
    const { user, response } = await requireApiUser();
    expect(user).toBeUndefined();
    expect(response?.status).toBe(401);
    expect(await response?.json()).toEqual({ error: "Sign in to continue." });
  });

  it("returns the user with a valid session", async () => {
    const signedIn = { id: "user-1", email: "user@example.com" };
    getSessionMock.mockResolvedValue({ user: signedIn, session: {} });
    const { user, response } = await requireApiUser();
    expect(response).toBeUndefined();
    expect(user).toEqual(signedIn);
  });
});
