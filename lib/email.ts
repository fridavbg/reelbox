import { serverEnv } from "./env";
import { CODE_VALID_MINUTES } from "./sign-in-settings";

const BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

export function signInCodeMessage(code: string) {
  const intro = "Use this code to sign in to Reelbox:";
  const outro = `It expires in ${CODE_VALID_MINUTES} minutes and works once. If you didn't ask for it, you can ignore this email.`;
  return {
    subject: `${code} is your Reelbox sign-in code`,
    textContent: `${intro}\n\n${code}\n\n${outro}`,
    htmlContent: `<p>${intro}</p><p style="font-size:24px;font-weight:600;letter-spacing:4px">${code}</p><p>${outro}</p>`,
  };
}

export async function sendSignInCode(to: string, code: string): Promise<void> {
  const { BREVO_API_KEY, EMAIL_FROM } = serverEnv();

  if (!BREVO_API_KEY || !EMAIL_FROM) {
    // Logging a code in production would leak it into the server logs.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Email sending is not configured");
    }
    console.info(`[dev] Sign-in code for ${to}: ${code}`);
    return;
  }

  const response = await fetch(BREVO_SEND_URL, {
    method: "POST",
    headers: { "api-key": BREVO_API_KEY, "content-type": "application/json" },
    body: JSON.stringify({
      sender: { email: EMAIL_FROM, name: "Reelbox" },
      to: [{ email: to }],
      ...signInCodeMessage(code),
    }),
  });

  if (!response.ok) {
    // The status is enough to debug; the body can echo the recipient.
    throw new Error(`Brevo rejected the sign-in email (${response.status})`);
  }
}
