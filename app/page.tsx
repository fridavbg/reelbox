import { redirect } from "next/navigation";
import { Layout } from "@/components/Layout/Layout";
import { SignInForm } from "@/components/SignInForm/SignInForm";
import { getSession } from "@/lib/session";
import styles from "./page.module.scss";

export default async function Home() {
  if (await getSession()) redirect("/saves");

  return (
    <Layout>
      <div className={styles.page}>
        <SignInForm />
        <p className={styles.note}>
          Works with Instagram&apos;s official data export. We never ask for
          your Instagram password.
        </p>
      </div>
    </Layout>
  );
}
