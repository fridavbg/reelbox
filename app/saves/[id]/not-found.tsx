import Link from "next/link";
import { Layout } from "@/components/Layout/Layout";
import {
  SAVE_NOT_FOUND_TEXT,
  SAVE_NOT_FOUND_TITLE,
} from "@/lib/saves/saves-text";
import styles from "./not-found.module.scss";

/**
 * Shown when the address isn't one of the user's saves: a wrong or old
 * link, or someone else's save. It never says which, so it can't reveal
 * whether another user's save exists.
 *
 * @returns The page.
 */
export default function SaveNotFound() {
  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.title}>{SAVE_NOT_FOUND_TITLE}</h1>
        <p>{SAVE_NOT_FOUND_TEXT}</p>
        <Link href="/saves" className={styles.back}>
          ← Back to saves
        </Link>
      </div>
    </Layout>
  );
}
