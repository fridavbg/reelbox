"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { authCall } from "@/lib/auth-call";
import { authClient } from "@/lib/auth-client";

type Props = {
  // Leaving the demo deletes the demo user and its data right away.
  demo?: boolean;
};

export function SignOutButton({ demo = false }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    const succeeded = async (call: () => Promise<{ error: unknown }>) =>
      !(await authCall(call)).error;
    // Leaving the demo deletes it; if that fails, a plain sign-out still
    // ends the session, and the cleanup removes the demo later.
    const ended =
      (demo && (await succeeded(() => authClient.deleteAnonymousUser()))) ||
      (await succeeded(() => authClient.signOut()));
    // Still signed in, e.g. offline: stay, so the button can be tried again.
    if (!ended) {
      setLoading(false);
      return;
    }
    router.push("/");
  }

  return (
    <Button
      variant="secondary"
      onClick={signOut}
      loading={loading}
      loadingLabel={demo ? "Leaving the demo…" : "Signing out…"}
    >
      {demo ? "Leave demo" : "Sign out"}
    </Button>
  );
}
