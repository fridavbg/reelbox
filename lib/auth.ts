import { betterAuth, type BetterAuthOptions } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { anonymous, emailOTP } from "better-auth/plugins";
import { after } from "next/server";
import { db } from "./db";
import { deleteExpiredDemoUsers, seedDemoUser } from "./demo/demo-users";
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

// "Try the demo": a one-click sign-in that creates a temporary user. Signing
// in with an email code afterwards deletes the demo user and its data.
export function demoPlugin() {
  return anonymous({
    generateName: () => "Demo visitor",
    emailDomainName: "demo.reelbox.invalid",
  });
}

// Runs once for every new demo user, before the sign-in response is sent.
export function onDemoUserCreated(
  handle: (userId: string) => Promise<void>,
): BetterAuthOptions["databaseHooks"] {
  return {
    user: {
      create: {
        async after(user) {
          if (user.isAnonymous) await handle(user.id);
        },
      },
    },
  };
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
        "reelboxapp.vercel.app",
        "reelbox-*-fridavbgs-projects.vercel.app",
      ],
      fallback: env.BETTER_AUTH_URL,
    },
    database: prismaAdapter(db(), { provider: "postgresql" }),
    advanced: { database: { generateId: "uuid" } },
    // Serverless instances don't share memory, so counters live in Postgres.
    rateLimit: { storage: "database" },
    databaseHooks: onDemoUserCreated(async (userId) => {
      await seedDemoUser(userId);
      // Old demo users are cleaned up whenever a new one starts.
      after(() =>
        deleteExpiredDemoUsers().catch((error) =>
          console.error("Failed to delete expired demo users", error),
        ),
      );
    }),
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
      demoPlugin(),
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
