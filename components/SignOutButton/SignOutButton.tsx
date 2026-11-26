"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { Toast } from "@/components/Toast/Toast";
import { authCall } from "@/lib/auth-call";
import { authClient } from "@/lib/auth-client";
import {
  LEAVE_DEMO_FAILED,
  LEAVE_DEMO_UNEXPECTED,
  SIGN_OUT_FAILED,
  SIGN_OUT_UNEXPECTED,
  failureMessage,
} from "@/lib/sign-in-messages";

type Failure = { code?: string; status?: number } | null;

// What to say when the session couldn't be ended.
const signOutMessages = {
  connection: SIGN_OUT_FAILED,
  unexpected: SIGN_OUT_UNEXPECTED,
};
const leaveDemoMessages = {
  connection: LEAVE_DEMO_FAILED,
  unexpected: LEAVE_DEMO_UNEXPECTED,
};

type Props = {
  // Leaving the demo deletes the demo user and its data right away.
  demo?: boolean;
};

export function SignOutButton({ demo = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function signOut() {
    setLoading(true);
    setError(undefined);
    const failure = async (call: () => Promise<{ error: Failure }>) =>
      (await authCall(call)).error;
    // Leaving the demo deletes it; if that fails, a plain sign-out still
    // ends the session, and the cleanup removes the demo later.
    let failed = demo
      ? await failure(() => authClient.deleteAnonymousUser())
      : null;
    if (!demo || failed) failed = await failure(() => authClient.signOut());
    // Still signed in, e.g. offline: stay, so the button can be tried again.
    if (failed) {
      setError(
        failureMessage(failed, demo ? leaveDemoMessages : signOutMessages),
      );
      setLoading(false);
      return;
    }
    router.push("/");
  }

  return (
    <>
      <Button
        variant="secondary"
        onClick={signOut}
        loading={loading}
        loadingLabel={demo ? "Leaving the demo…" : "Signing out…"}
      >
        {demo ? "Leave demo" : "Sign out"}
      </Button>
      {/* A toast, not an alert: the button sits in the header row. */}
      <Toast message={error} onDismiss={() => setError(undefined)} />
    </>
  );
}
