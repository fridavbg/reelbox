import type { Metadata } from "next";
import { DemoImport } from "@/components/DemoImport/DemoImport";
import { ImportForm } from "@/components/ImportForm/ImportForm";
import { Layout } from "@/components/Layout/Layout";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Import your saves · Reelbox" };

/**
 * The import page. Demo users can't choose their own files; they can try the
 * import with the sample export instead, and the route accepts only that.
 *
 * @returns The page.
 */
export default async function ImportPage() {
  const user = await requireUser();
  const isDemo = Boolean(user.isAnonymous);

  return (
    <Layout actions={<SignOutButton demo={isDemo} />}>
      {isDemo ? (
        <DemoImport createdAt={user.createdAt.toISOString()} />
      ) : (
        <ImportForm />
      )}
    </Layout>
  );
}
