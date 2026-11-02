import type { Metadata } from "next";
import Link from "next/link";
import { Alert } from "@/components/Alert/Alert";
import { ImportForm } from "@/components/ImportForm/ImportForm";
import { Layout } from "@/components/Layout/Layout";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import { DEMO_CANT_IMPORT } from "@/lib/import/import-messages";
import { requireUser } from "@/lib/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Import your saves · Reelbox" };

/**
 * The import page. Demo users see why they can't import instead of the form;
 * the import route refuses them too.
 *
 * @returns The page.
 */
export default async function ImportPage() {
  const user = await requireUser();
  const isDemo = Boolean(user.isAnonymous);

  return (
    <Layout actions={<SignOutButton demo={isDemo} />}>
      {isDemo ? (
        <div className={styles.demo}>
          <h1 className={styles.title}>Import your saves</h1>
          <Alert variant="info">{DEMO_CANT_IMPORT}</Alert>
          <Link href="/saves">Back to the sample saves</Link>
        </div>
      ) : (
        <ImportForm />
      )}
    </Layout>
  );
}
