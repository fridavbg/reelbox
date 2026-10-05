import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

const validEnv = {
  DATABASE_URL: "postgresql://user:secret@host.example/reelbox?sslmode=require",
  BETTER_AUTH_SECRET: "a".repeat(32),
  BETTER_AUTH_URL: "http://localhost:3000",
};

describe("parseServerEnv", () => {
  it("accepts a valid environment without email settings", () => {
    expect(parseServerEnv(validEnv)).toEqual(validEnv);
  });

  it("accepts a valid environment with email settings", () => {
    const env = {
      ...validEnv,
      BREVO_API_KEY: "key",
      EMAIL_FROM: "codes@example.com",
    };
    expect(parseServerEnv(env)).toEqual(env);
  });

  it("treats empty email settings as not set, like in .env.example", () => {
    expect(
      parseServerEnv({ ...validEnv, BREVO_API_KEY: "", EMAIL_FROM: "" }),
    ).toEqual(validEnv);
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() =>
      parseServerEnv({ ...validEnv, DATABASE_URL: undefined }),
    ).toThrow("DATABASE_URL");
  });

  it("rejects a non-Postgres URL", () => {
    expect(() =>
      parseServerEnv({ ...validEnv, DATABASE_URL: "https://host.example" }),
    ).toThrow("DATABASE_URL");
  });

  it("rejects a secret shorter than 32 characters", () => {
    expect(() =>
      parseServerEnv({ ...validEnv, BETTER_AUTH_SECRET: "too-short" }),
    ).toThrow("BETTER_AUTH_SECRET");
  });

  it("rejects an email API key without a sender address", () => {
    expect(() => parseServerEnv({ ...validEnv, BREVO_API_KEY: "key" })).toThrow(
      "EMAIL_FROM",
    );
  });

  it("never includes the value in the error", () => {
    expect(() =>
      parseServerEnv({
        ...validEnv,
        DATABASE_URL: "mysql://user:secret@host",
      }),
    ).not.toThrow("secret");
  });
});
