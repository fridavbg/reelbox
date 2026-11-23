import { Layout } from "@/components/Layout/Layout";
import { SAVE_LOADING } from "@/lib/saves/saves-text";
import styles from "./loading.module.scss";

/**
 * Shown by Next while a save's page loads: grey bars for the back link,
 * the save and its tags, with one message for screen readers.
 *
 * @returns The loading page.
 */
export default function SaveLoading() {
  return (
    <Layout>
      <div className={styles.page}>
        <p className={styles.hidden} role="status">
          {SAVE_LOADING}
        </p>
        <div className={styles.bars} aria-hidden="true">
          {["back", "kind", "title", "line", "line", "short", "tags"].map(
            (bar, i) => (
              <span key={i} className={`${styles.bar} ${styles[bar]}`} />
            ),
          )}
        </div>
      </div>
    </Layout>
  );
}
