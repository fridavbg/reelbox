import { betterAuth } from "better-auth";
import { memoryAdapter, type MemoryDB } from "better-auth/adapters/memory";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { signInCodePlugin } from "./auth";
import { CODE_VALID_MINUTES } from "./sign-in-settings";

// Runs the real sign-in code settings against an in-memory database.
function setup() {
  const sent: { email: string; code: string }[] = [];
  const memory: MemoryDB = {
    user: [],
    session: [],
    account: [],
    verification: [],
  };
  const auth = betterAuth({
    secret: "test-secret-that-is-at-least-32-chars",
    baseURL: "http://localhost:3000",
    database: memoryAdapter(memory),
    plugins: [signInCodePlugin((email, code) => sent.push({ email, code }))],
  });

  async function requestCode(email: string) {
    const response = await auth.api.sendVerificationOTP({
      body: { email, type: "sign-in" },
    });
    return { response, code: sent.at(-1)!.code };
  }

  function signIn(email: string, otp: string) {
    return auth.api.signInEmailOTP({ body: { email, otp } });
  }

  return { auth, memory, sent, requestCode, signIn };
}

const email = "user@example.com";

describe("sign-in codes", () => {
  beforeEach(() => vi.useFakeTimers({ toFake: ["Date"] }));
  afterEach(() => vi.useRealTimers());

  it("sends a 6-digit code", async () => {
    const { requestCode } = setup();
    const { code } = await requestCode(email);
    expect(code).toMatch(/^\d{6}$/);
  });

  it("signs in with the right code and creates the user", async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    const result = await signIn(email, code);
    expect(result.user.email).toBe(email);
    expect(result.token).toBeTruthy();
  });

  it("stores only a hash of the code", async () => {
    const { memory, requestCode } = setup();
    const { code } = await requestCode(email);
    const stored = JSON.stringify(memory.verification);
    expect(memory.verification).toHaveLength(1);
    expect(stored).not.toContain(code);
  });

  it("rejects a wrong code", async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    const wrong = code === "000000" ? "111111" : "000000";
    await expect(signIn(email, wrong)).rejects.toMatchObject({
      body: { code: "INVALID_OTP" },
    });
  });

  it("works only once", async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    await signIn(email, code);
    await expect(signIn(email, code)).rejects.toMatchObject({
      body: { code: "INVALID_OTP" },
    });
  });

  it(`expires after ${CODE_VALID_MINUTES} minutes`, async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    vi.setSystemTime(Date.now() + CODE_VALID_MINUTES * 60_000 + 1_000);
    await expect(signIn(email, code)).rejects.toMatchObject({
      body: { code: "OTP_EXPIRED" },
    });
  });

  it("still works just before it expires", async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    vi.setSystemTime(Date.now() + CODE_VALID_MINUTES * 60_000 - 1_000);
    await expect(signIn(email, code)).resolves.toBeTruthy();
  });

  it("blocks the code after 3 wrong attempts, even if the 4th is right", async () => {
    const { requestCode, signIn } = setup();
    const { code } = await requestCode(email);
    const wrong = code === "000000" ? "111111" : "000000";
    for (let i = 0; i < 3; i++) {
      await expect(signIn(email, wrong)).rejects.toBeTruthy();
    }
    await expect(signIn(email, code)).rejects.toMatchObject({
      body: { code: "TOO_MANY_ATTEMPTS" },
    });
  });

  it("gives the same response whether or not the account exists", async () => {
    const { requestCode, signIn } = setup();
    const first = await requestCode(email);
    await signIn(email, first.code);

    const existing = await requestCode(email);
    const unknown = await requestCode("someone-new@example.com");
    expect(existing.response).toEqual(unknown.response);
  });
});
