import { z } from "zod";
import { CODE_VALID_MINUTES } from "./sign-in-settings";

const emailSchema = z.email();
const codeSchema = z.string().regex(/^\d{6}$/);

export function emailError(email: string): string | undefined {
  if (!email.trim()) return "Enter your email address.";
  if (!emailSchema.safeParse(email.trim()).success) {
    return "Enter an email address like you@example.com.";
  }
}

export function codeError(code: string): string | undefined {
  if (!codeSchema.safeParse(code.trim()).success) {
    return "Enter the 6-digit code from the email.";
  }
}

export const RATE_LIMITED =
  "Too many tries. Wait a few minutes, then try again.";
export const SEND_FAILED =
  "We couldn't send the code. Check your connection and try again.";

type SignInFailure = { code?: string; status?: number };

// Turns a failed sign-in into what the user should do next.
export function signInErrorMessage(
  failure: SignInFailure,
  attemptsLeft: number,
): string {
  if (failure.status === 429) return RATE_LIMITED;
  switch (failure.code) {
    case "INVALID_OTP":
      if (attemptsLeft <= 0) return tooManyAttempts;
      return `That code is not right. You have ${attemptsLeft} ${
        attemptsLeft === 1 ? "attempt" : "attempts"
      } left.`;
    case "OTP_EXPIRED":
      return `That code has expired; codes work for ${CODE_VALID_MINUTES} minutes. Send a new code to continue.`;
    case "TOO_MANY_ATTEMPTS":
      return tooManyAttempts;
    default:
      return "Something went wrong signing you in. Try again.";
  }
}

const tooManyAttempts =
  "Too many wrong tries, so that code no longer works. Send a new code to continue.";
