import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";
import { after } from "next/server";
import { db } from "./db";
import { sendSignInCode } from "./email";
import { serverEnv } from "./env";
import { ALLOWED_ATTEMPTS, CODE_VALID_MINUTES } from "./sign-in-settings";

// Sign-in with a 6-digit email code. Shared by the app and the tests, so the
// tests exercise the real settings.
export function signInCodePlugin(send: (email: string, code: string) => void) {
  return emailOTP({
    otpLength: 6,
    expiresIn: CODE_VALID_MINUTES * 60,
    allowedAttempts: ALLOWED_ATTEMPTS,
    // Only a hash of the code is stored, never the code itself.
    storeOTP: "hashed",
    async sendVerificationOTP({ email, otp, type }) {
      if (type === "sign-in") send(email, otp);
    },
  });
}

function createAuth() {
  const env = serverEnv();

  return betterAuth({
    appName: "Reelbox",
    secret: env.BETTER_AUTH_SECRET,
    // Sign-in links and cookies follow the host the request came in on, as
    // long as it's one of these. Preview URLs change with every deployment.
    baseURL: {
      allowedHosts: [
        "localhost:3000",
        "reelbox-tau.vercel.app",
        "reelbox-*-fridavbgs-projects.vercel.app",
      ],
      fallback: env.BETTER_AUTH_URL,
    },
    database: prismaAdapter(db(), { provider: "postgresql" }),
    advanced: { database: { generateId: "uuid" } },
    // Serverless instances don't share memory, so counters live in Postgres.
    rateLimit: { storage: "database" },
    plugins: [
      signInCodePlugin((email, code) =>
        // Send after the response, so the response time is the same whether
        // or not the email belongs to an existing account.
        after(() =>
          sendSignInCode(email, code).catch((error) =>
            console.error("Failed to send sign-in code", error),
          ),
        ),
      ),
      // Lets server actions set the session cookie. Must be the last plugin.
      nextCookies(),
    ],
  });
}

type Auth = ReturnType<typeof createAuth>;
let instance: Auth | undefined;

// Created on first use, so `next build` doesn't need the auth secret.
export function auth(): Auth {
  instance ??= createAuth();
  return instance;
}
