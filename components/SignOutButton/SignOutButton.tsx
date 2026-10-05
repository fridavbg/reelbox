"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button/Button";
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
    if (demo) {
      const { error } = await authClient.deleteAnonymousUser();
      // If deleting fails, still sign out; the cleanup removes it later.
      if (error) await authClient.signOut();
    } else {
      await authClient.signOut();
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
