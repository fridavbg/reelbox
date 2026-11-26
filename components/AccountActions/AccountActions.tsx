import Link from "next/link";
import { SignOutButton } from "@/components/SignOutButton/SignOutButton";
import styles from "./AccountActions.module.scss";

/**
 * The header's actions on pages about the user's saves: Import (demo users
 * get the sample export there), and signing out or leaving the demo.
 *
 * @param props - Whether the user is a demo visitor.
 * @returns The links and button for `Layout`'s `actions`.
 */
export function AccountActions({ demo }: { demo: boolean }) {
  return (
    <>
      <Link href="/import" className={styles.link}>
        Import
      </Link>
      <SignOutButton demo={demo} />
    </>
  );
}
