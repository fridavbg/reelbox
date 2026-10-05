"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { authClient } from "@/lib/auth-client";
import { DEMO_LIFETIME_HOURS } from "@/lib/demo/demo-settings";
import { DEMO_FAILED, RATE_LIMITED } from "@/lib/sign-in-messages";
import styles from "./DemoButton.module.scss";

// One click into a temporary account with sample saves; no email needed.
export function DemoButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  async function startDemo() {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    const { error: demoError } = await authClient.signIn.anonymous();
    if (!demoError) {
      router.push("/saves");
      return;
    }
    setError(demoError.status === 429 ? RATE_LIMITED : DEMO_FAILED);
    setLoading(false);
  }

  return (
    <div className={styles.demo}>
      <p className={styles.divider}>or</p>
      <Button
        variant="secondary"
        onClick={startDemo}
        loading={loading}
        loadingLabel="Starting the demo…"
        className={styles.button}
      >
        Try the demo
      </Button>
      <p className={styles.hint}>
        Explore sample saves without an account. Demo changes are deleted after{" "}
        {DEMO_LIFETIME_HOURS} hours.
      </p>
      {error && <Alert variant="error">{error}</Alert>}
    </div>
  );
}
