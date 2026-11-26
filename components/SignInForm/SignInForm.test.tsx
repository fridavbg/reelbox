// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { offline } from "@/test/offline";
import {
  SEND_FAILED,
  SEND_UNEXPECTED,
  SIGN_IN_CONNECTION_FAILED,
} from "@/lib/sign-in-messages";

const sendVerificationOtp = vi.fn();
const signInEmailOtp = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/auth-client", () => ({
  authClient: {
    emailOtp: { sendVerificationOtp },
    signIn: { emailOtp: signInEmailOtp, anonymous: vi.fn() },
  },
}));

const { SignInForm } = await import("./SignInForm");

/** Fills in the email and sends the code; the code step shows after. */
async function sendCode() {
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "you@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send sign-in code" }));
}

/** Types a code and submits it. */
function submitCode(code = "123456") {
  fireEvent.change(screen.getByLabelText("Sign-in code"), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

beforeEach(() => {
  vi.clearAllMocks();
  sendVerificationOtp.mockResolvedValue({ data: {}, error: null });
});

describe("SignInForm when the connection drops", () => {
  it("says so when the code can't be sent, and the button works again", async () => {
    sendVerificationOtp.mockImplementation(offline);
    render(<SignInForm />);
    await sendCode();
    expect(await screen.findByText(SEND_FAILED)).toBeTruthy();
    const button = screen.getByRole("button", { name: "Send sign-in code" });
    expect(button.getAttribute("aria-busy")).toBeNull();
  });

  it("says so when signing in with the code fails, and keeps the attempts", async () => {
    signInEmailOtp.mockImplementationOnce(offline);
    render(<SignInForm />);
    await sendCode();
    await screen.findByLabelText("Sign-in code");

    submitCode();
    expect(await screen.findByText(SIGN_IN_CONNECTION_FAILED)).toBeTruthy();
    const button = screen.getByRole("button", { name: "Sign in" });
    expect(button.getAttribute("aria-busy")).toBeNull();

    // A lost connection isn't a wrong guess: all 3 attempts are left.
    signInEmailOtp.mockResolvedValueOnce({
      data: null,
      error: { code: "INVALID_OTP", status: 400 },
    });
    submitCode();
    expect(await screen.findByText(/You have 2 attempts left/)).toBeTruthy();
  });

  it("says so when a new code can't be sent", async () => {
    render(<SignInForm />);
    await sendCode();
    await screen.findByLabelText("Sign-in code");

    sendVerificationOtp.mockImplementation(offline);
    fireEvent.click(screen.getByRole("button", { name: "Send a new code" }));
    expect(await screen.findByText(SEND_FAILED)).toBeTruthy();
    const button = screen.getByRole("button", { name: "Send a new code" });
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});

describe("SignInForm when something unexpected breaks", () => {
  it("doesn't blame the connection when the code can't be sent", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    sendVerificationOtp.mockRejectedValue(new Error("A bug"));
    render(<SignInForm />);
    await sendCode();
    expect(await screen.findByText(SEND_UNEXPECTED)).toBeTruthy();
  });
});
