import { createTransport } from "nodemailer";
import { serverEnv } from "./env";
import { CODE_VALID_MINUTES } from "./sign-in-settings";

// nodemailer waits up to 2 minutes by default; a stalled connection should
// fail fast instead of keeping the function alive.
const SMTP_TIMEOUT_MS = 10_000;

export function signInCodeMessage(code: string) {
  const intro = "Use this code to sign in to Reelbox:";
  const outro = `It expires in ${CODE_VALID_MINUTES} minutes and works once. If you didn't ask for it, you can ignore this email.`;
  return {
    subject: `${code} is your Reelbox sign-in code`,
    text: `${intro}\n\n${code}\n\n${outro}`,
    html: `<p>${intro}</p><p style="font-size:24px;font-weight:600;letter-spacing:4px">${code}</p><p>${outro}</p>`,
  };
}

export async function sendSignInCode(to: string, code: string): Promise<void> {
  const { GMAIL_USER, GMAIL_APP_PASSWORD } = serverEnv();

  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    // Logging a code in production would leak it into the server logs.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email sending is not configured");
    }
    console.info(`[dev] Sign-in code for ${to}: ${code}`);
    return;
  }

  const transport = createTransport({
    service: "Gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    connectionTimeout: SMTP_TIMEOUT_MS,
    greetingTimeout: SMTP_TIMEOUT_MS,
    socketTimeout: SMTP_TIMEOUT_MS,
  });

  try {
    await transport.sendMail({
      from: { name: "Reelbox", address: GMAIL_USER },
      to,
      ...signInCodeMessage(code),
    });
  } catch (error) {
    // The SMTP code is enough to debug; the server's reply can echo the
    // recipient.
    const { code: errorCode, responseCode } = (error ?? {}) as {
      code?: string;
      responseCode?: number;
    };
    throw new Error(
      `Gmail rejected the sign-in email (${errorCode ?? "unknown"}${responseCode ? ` ${responseCode}` : ""})`,
    );
  }
}
