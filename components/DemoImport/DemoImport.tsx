"use client";

import Link from "next/link";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { useImport } from "@/components/ImportForm/use-import";
import { ImportSummary } from "@/components/ImportSummary/ImportSummary";
import { demoAnchor } from "@/lib/demo/demo-anchor";
import { sampleExportFiles } from "@/lib/demo/sample-export";
import { COLLECTIONS_FILE, POSTS_FILE } from "@/lib/export/export-settings";
import {
  DEMO_CANT_IMPORT,
  SAMPLE_EXPORT_NOTE,
  SAMPLE_IMPORT_REFUSED,
  unchangedNote,
} from "@/lib/import/import-messages";
import styles from "./DemoImport.module.scss";

type Props = {
  /** When the demo user was created, as an ISO date; dates the sample. */
  createdAt: string;
};

/**
 * The import page for demo users: they can't choose their own files, but
 * can run the real import with the sample export, read in the browser and
 * uploaded like a real one.
 *
 * @param props - When the demo started.
 * @returns The page in its current state.
 */
export function DemoImport({ createdAt }: Props) {
  const { state, start, importMore, headingRef } = useImport();

  function importSample() {
    const files = sampleExportFiles(demoAnchor(new Date(createdAt)));
    void start([
      new File([files.posts], POSTS_FILE, { type: "application/json" }),
      new File([files.collections], COLLECTIONS_FILE, {
        type: "application/json",
      }),
    ]);
  }

  if (state.status === "done") {
    return (
      <ImportSummary
        {...state.result}
        onImportMore={importMore}
        demo
        ref={headingRef}
      />
    );
  }

  const loading = state.status === "loading";
  // The route refuses a demo upload with "sign in to import your own", which
  // the note below already says; for the sample, it means something broke.
  const failed = state.status === "error" ? state.error : undefined;
  const error = failed === DEMO_CANT_IMPORT ? SAMPLE_IMPORT_REFUSED : failed;
  const note = error ? unchangedNote(error) : undefined;
  return (
    <div className={styles.demo}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        Import your saves
      </h1>
      {error && (
        <Alert variant="error">
          <p>{error}</p>
          {note && <p>{note}</p>}
        </Alert>
      )}
      <Alert variant="info">
        <p>{DEMO_CANT_IMPORT}</p>
        <p>{SAMPLE_EXPORT_NOTE}</p>
      </Alert>
      <div className={styles.action}>
        <Button
          onClick={importSample}
          loading={loading}
          loadingLabel="Importing the sample…"
        >
          Try with a sample export
        </Button>
        {/* Always in the page, so screen readers announce the change. */}
        <p role="status" className={styles.status}>
          {loading
            ? "Importing the sample export… This can take a moment."
            : ""}
        </p>
      </div>
      <Link href="/saves">Back to the sample saves</Link>
    </div>
  );
}
