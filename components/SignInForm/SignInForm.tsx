"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { TextInput } from "@/components/TextInput/TextInput";
import { authClient } from "@/lib/auth-client";
import {
  RATE_LIMITED,
  SEND_FAILED,
  codeError,
  emailError,
  signInErrorMessage,
} from "@/lib/sign-in-messages";
import { ALLOWED_ATTEMPTS, CODE_VALID_MINUTES } from "@/lib/sign-in-settings";
import styles from "./SignInForm.module.scss";

type Step = "email" | "code";

export function SignInForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [loading, setLoading] = useState(false);
  // Shown to the user; the server enforces the real limit.
  const [attemptsLeft, setAttemptsLeft] = useState(ALLOWED_ATTEMPTS);

  async function sendCode(): Promise<boolean> {
    const { error: sendError } = await authClient.emailOtp.sendVerificationOtp({
      email: email.trim(),
      type: "sign-in",
    });
    if (sendError) {
      setError(sendError.status === 429 ? RATE_LIMITED : SEND_FAILED);
      return false;
    }
    setAttemptsLeft(ALLOWED_ATTEMPTS);
    setCode("");
    return true;
  }

  async function handleEmailSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const invalid = emailError(email);
    setError(invalid);
    if (invalid) return;

    setLoading(true);
    if (await sendCode()) {
      setNotice(undefined);
      setStep("code");
    }
    setLoading(false);
  }

  async function handleCodeSubmit(event: FormEvent) {
    event.preventDefault();
    if (loading) return;
    const invalid = codeError(code);
    setError(invalid);
    if (invalid) return;

    setLoading(true);
    const { error: signInError } = await authClient.signIn.emailOtp({
      email: email.trim(),
      otp: code.trim(),
    });
    if (!signInError) {
      router.push("/saves");
      router.refresh();
      return;
    }
    const left =
      signInError.code === "INVALID_OTP" ? attemptsLeft - 1 : attemptsLeft;
    setAttemptsLeft(left);
    setError(signInErrorMessage(signInError, left));
    setNotice(undefined);
    setLoading(false);
  }

  async function handleResend() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    if (await sendCode()) {
      setNotice(`We sent a new code to ${email.trim()}.`);
    }
    setLoading(false);
  }

  function changeEmail() {
    setStep("email");
    setCode("");
    setError(undefined);
    setNotice(undefined);
  }

  if (step === "email") {
    return (
      <div className={styles.step}>
        <div className={styles.intro}>
          <h1 className={styles.display}>
            Organize the reels you save for inspiration
          </h1>
          <p className={styles.text}>
            Upload your Instagram export, tag your saves, and find them again.
          </p>
        </div>
        <form className={styles.form} onSubmit={handleEmailSubmit} noValidate>
          <TextInput
            label="Email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(emailError(event.target.value));
            }}
            error={error}
            helperText="No password. We email you a 6-digit code."
          />
          <Button type="submit" loading={loading} className={styles.submit}>
            Send sign-in code
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.step}>
      <Button variant="text" onClick={changeEmail}>
        ← Use a different email
      </Button>
      <div className={styles.intro}>
        <h1 className={styles.title}>Check your email</h1>
        <p className={styles.text}>
          We sent a 6-digit code to {email.trim()}. It expires in{" "}
          {CODE_VALID_MINUTES} minutes.
        </p>
      </div>
      <form className={styles.form} onSubmit={handleCodeSubmit} noValidate>
        <TextInput
          label="Sign-in code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          value={code}
          onChange={(event) => {
            const digits = event.target.value.replace(/\D/g, "");
            setCode(digits);
            if (error && !codeError(digits)) setError(undefined);
          }}
          error={error}
          inputClassName={styles.codeInput}
        />
        <Button
          type="submit"
          loading={loading}
          loadingLabel="Signing in…"
          className={styles.submit}
        >
          Sign in
        </Button>
      </form>
      {notice && <Alert variant="info">{notice}</Alert>}
      <div className={styles.resend}>
        <p>Didn&apos;t get it? Check your spam folder.</p>
        <Button variant="text" onClick={handleResend} disabled={loading}>
          Send a new code
        </Button>
      </div>
    </div>
  );
}
