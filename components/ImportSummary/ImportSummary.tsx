import { CircleCheck } from "lucide-react";
import Link from "next/link";
import type { Ref } from "react";
import { Button, buttonClassName } from "@/components/Button/Button";
import type { InvalidEntry } from "@/lib/export/parse-export";
import type { ImportSummary as Summary } from "@/lib/import/build-import";
import {
  formatDay,
  tagsAddedText,
  unreadableCollectionsText,
  unreadableSavesText,
} from "@/lib/import/import-summary";
import styles from "./ImportSummary.module.scss";

type Props = {
  summary: Summary;
  earliestSavedAt: Date;
  latestSavedAt: Date;
  unreadableSaves: InvalidEntry[];
  unreadableCollections: InvalidEntry[];
  /** Goes back to the upload, for people with more than one export. */
  onImportMore: () => void;
  /** Set on the heading. */
  ref?: Ref<HTMLHeadingElement>;
};

/**
 * What an import did: the export's date range, the counts and what couldn't
 * be read. The heading takes focus when it appears, so screen readers
 * announce the result.
 *
 * @param props - The import's result, what "Import another export" does, and
 *   a ref for the heading.
 * @returns The summary section.
 */
export function ImportSummary({
  summary,
  earliestSavedAt,
  latestSavedAt,
  unreadableSaves,
  unreadableCollections,
  onImportMore,
  ref,
}: Props) {
  const tagsAdded = tagsAddedText(summary.tagsAddedCount);
  const collectionsMissing = unreadableCollectionsText(
    unreadableCollections.length,
  );
  return (
    <section className={styles.summary}>
      <div className={styles.heading}>
        <CircleCheck size={32} aria-hidden="true" className={styles.icon} />
        <h1 ref={ref} tabIndex={-1} className={styles.title}>
          Import complete
        </h1>
      </div>
      <p>
        This export covers saves from{" "}
        <strong>{formatDay(earliestSavedAt)}</strong> to{" "}
        <strong>{formatDay(latestSavedAt)}</strong>.
      </p>
      <dl className={styles.counts}>
        <div className={styles.count}>
          <dt>New</dt>
          <dd>{summary.newCount}</dd>
        </div>
        <div className={styles.count}>
          <dt>Already here</dt>
          <dd>{summary.duplicateCount}</dd>
        </div>
        <div className={styles.count}>
          <dt>Couldn&apos;t read</dt>
          <dd>{summary.invalidCount}</dd>
        </div>
      </dl>
      {unreadableSaves.length > 0 && (
        <details className={styles.details}>
          <summary>{unreadableSavesText(summary.invalidCount)}</summary>
          <ul>
            {/* The list never changes, so its position is a safe key. */}
            {unreadableSaves.map((entry, index) => (
              <li key={index}>
                {entry.reason}
                {/* Untrusted text from the export: never a link. */}
                {entry.url && <span className={styles.url}> {entry.url}</span>}
              </li>
            ))}
          </ul>
        </details>
      )}
      {tagsAdded && <p className={styles.note}>{tagsAdded}</p>}
      {collectionsMissing && (
        <p className={styles.note}>{collectionsMissing}</p>
      )}
      <div className={styles.actions}>
        <Link href="/saves" className={buttonClassName("primary")}>
          View my saves
        </Link>
        <Button variant="secondary" onClick={onImportMore}>
          Import another export
        </Button>
      </div>
      <p className={styles.tip}>
        Your saves are stored here now. You can clear them in Instagram if you
        like.
      </p>
    </section>
  );
}
