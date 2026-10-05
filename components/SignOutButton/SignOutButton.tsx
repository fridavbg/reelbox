"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button/Button";
import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function signOut() {
    setLoading(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button
      variant="secondary"
      onClick={signOut}
      loading={loading}
      loadingLabel="Signing out…"
    >
      Sign out
    </Button>
  );
}
