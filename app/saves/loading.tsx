import { Layout } from "@/components/Layout/Layout";
import { SAVES_LOADING } from "@/lib/saves/saves-text";
import styles from "./loading.module.scss";

/**
 * One row of a grey card: a grey bar in a row as tall as the card's own.
 *
 * @param props - The class that sets the row's height and bar width.
 * @returns The row.
 */
function SkeletonRow({ className }: { className: string }) {
  return (
    <span className={`${styles.row} ${className}`}>
      <span className={styles.bar} />
    </span>
  );
}

/**
 * Shown by Next while the saves page loads, e.g. while the database wakes
 * up after a quiet spell. Grey cards with the same rows as a save card
 * (kind, 3 caption lines, name, username, date, link) stand in for the
 * grid.
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
              <SkeletonRow className={styles.kind} />
              <span className={styles.captionArea}>
                {Array.from({ length: 3 }, (_, line) => (
                  <SkeletonRow key={line} className={styles.captionLine} />
                ))}
              </span>
              <SkeletonRow className={styles.name} />
              <SkeletonRow className={styles.username} />
              <SkeletonRow className={styles.date} />
              <SkeletonRow className={styles.link} />
            </li>
          ))}
        </ul>
      </div>
    </Layout>
  );
}
