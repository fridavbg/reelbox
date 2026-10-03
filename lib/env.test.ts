import { describe, expect, it } from "vitest";
import { parseServerEnv } from "./env";

describe("parseServerEnv", () => {
  it("accepts a Postgres connection string", () => {
    const url = "postgresql://user:secret@host.example/reelbox?sslmode=require";
    expect(parseServerEnv({ DATABASE_URL: url })).toEqual({
      DATABASE_URL: url,
    });
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseServerEnv({})).toThrow("DATABASE_URL");
  });

  it("rejects a non-Postgres URL", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: "https://host.example" }),
    ).toThrow("DATABASE_URL");
  });

  it("never includes the value in the error", () => {
    expect(() =>
      parseServerEnv({ DATABASE_URL: "mysql://user:secret@host" }),
    ).not.toThrow("secret");
  });
});
