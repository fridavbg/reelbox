import Link from "next/link";
import { buttonClassName } from "@/components/Button/Button";
import { Layout } from "@/components/Layout/Layout";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import { db } from "@/lib/db";
import { DEMO_LIFETIME_HOURS } from "@/lib/demo/demo-settings";
import { DEMO_CANT_IMPORT } from "@/lib/import/import-messages";
import { savesImportedText } from "@/lib/import/import-summary";
import { requireUser } from "@/lib/session";
import styles from "./page.module.scss";

export default async function SavesPage() {
  const user = await requireUser();
  const isDemo = Boolean(user.isAnonymous);
  const saveCount = await db().post.count({ where: { userId: user.id } });

  return (
    <Layout actions={<SignOutButton demo={isDemo} />}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Your saves</h1>
        {isDemo ? (
          <>
            <p className={styles.text}>
              You&apos;re trying the demo with {saveCount} sample saves. Changes
              are deleted after {DEMO_LIFETIME_HOURS} hours.
            </p>
            <p className={styles.text}>{DEMO_CANT_IMPORT}</p>
          </>
        ) : (
          <>
            <p className={styles.text}>{savesImportedText(saveCount)}</p>
            <Link
              href="/import"
              className={buttonClassName("primary", styles.import)}
            >
              Import your saves
            </Link>
          </>
        )}
      </div>
    </Layout>
  );
}
