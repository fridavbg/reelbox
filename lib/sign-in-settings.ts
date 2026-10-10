// Shared by the server (lib/auth.ts, lib/email.ts) and the sign-in form.

// How long an emailed sign-in code works.
export const CODE_VALID_MINUTES = 10;

// Wrong guesses allowed per code before it stops working.
export const ALLOWED_ATTEMPTS = 3;

/** Days a session lasts without being used; each day of use extends it. */
export const SESSION_DAYS = 7;
