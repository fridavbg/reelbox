import { Layout } from "@/components/Layout/Layout";
import { SAVES_LOADING } from "@/lib/saves/saves-text";
import styles from "./loading.module.scss";

/**
 * Shown by Next while the saves page loads, e.g. while the database wakes
 * up after a quiet spell. Grey cards in the shape of a save card (kind,
 * 3 caption lines, creator, date) stand in for the grid.
 *
 * @returns The loading page.
 */
export default function SavesLoading() {
  return (
    <Layout>
      <div className={styles.loading}>
        <p className={styles.note} role="status">
          {SAVES_LOADING}
        </p>
        <ul className={styles.grid} aria-hidden="true">
          {Array.from({ length: 4 }, (_, i) => (
            <li key={i} className={styles.card}>
              <span className={styles.kind} />
              <span className={styles.captionArea}>
                <span className={styles.line} />
                <span className={styles.line} />
                <span className={styles.shortLine} />
              </span>
              <span className={styles.name} />
              <span className={styles.date} />
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
