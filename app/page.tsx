import Image from "next/image";
import { redirect } from "next/navigation";
import { SignInForm } from "@/components/SignInForm/SignInForm";
import { getSession } from "@/lib/session";
import styles from "./page.module.scss";

export default async function Home() {
  if (await getSession()) redirect("/saves");

  return (
    <main className={styles.page}>
      <Image
        src="/reelbox-logo.svg"
        alt="Reelbox"
        width={143}
        height={32}
        priority
      />
      <SignInForm />
      <p className={styles.note}>
        Works with Instagram&apos;s official data export. We never ask for your
        Instagram password.
      </p>
    </main>
  );
}
