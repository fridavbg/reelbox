import { Layout } from "@/components/Layout/Layout";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import { requireUser } from "@/lib/session";
import styles from "./page.module.scss";

export default async function SavesPage() {
  const user = await requireUser();

  return (
    <Layout actions={<SignOutButton />}>
      <div className={styles.intro}>
        <h1 className={styles.title}>Your saves</h1>
        <p className={styles.text}>
          Signed in as {user.email}. Importing your saves is coming next.
        </p>
      </div>
    </Layout>
  );
}
