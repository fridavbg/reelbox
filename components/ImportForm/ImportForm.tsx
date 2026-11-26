"use client";

import { Upload as UploadIcon } from "lucide-react";
import { useId, useState, type DragEvent } from "react";
import { Alert } from "@/components/Alert/Alert";
import { buttonClassName } from "@/components/Button/Button";
import { ImportSummary } from "@/components/ImportSummary/ImportSummary";
import {
  COLLECTIONS_FILE,
  MAX_ZIP_MB,
  POSTS_FILE,
} from "@/lib/export/export-settings";
import { unchangedNote } from "@/lib/import/import-messages";
import { EXPORT_STEPS_ID } from "@/lib/import/import-settings";
import styles from "./ImportForm.module.scss";
import { useImport } from "./use-import";

/**
 * Formats a file size so it's easy to read, e.g. "48 MB" or "820 KB".
 *
 * @param bytes - The size in bytes.
 * @returns The size, rounded, with its unit.
 */
function formatSize(bytes: number) {
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${Math.round(mb)} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

/**
 * The import page: choose or drop the export, then see the summary or what
 * went wrong.
 *
 * @returns The form in its current state.
 */
export function ImportForm() {
  const { state, start, importMore, headingRef } = useImport();
  const [dragging, setDragging] = useState(false);
  const inputId = useId();

  function handleDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void start([...event.dataTransfer.files]);
  }

  if (state.status === "done") {
    return (
      <ImportSummary
        {...state.result}
        onImportMore={importMore}
        ref={headingRef}
      />
    );
  }

  const loading = state.status === "loading";
  const note =
    state.status === "error" ? unchangedNote(state.error) : undefined;
  return (
    <div className={styles.page}>
      <h1 ref={headingRef} tabIndex={-1} className={styles.title}>
        Import your saves
      </h1>

      {state.status === "error" && (
        <>
          <ul className={styles.files} aria-label="Chosen files">
            {state.files.map((file) => (
              <li key={file.name}>
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{formatSize(file.size)}</span>
              </li>
            ))}
          </ul>
          <Alert variant="error">
            <p>{state.error}</p>
            {note && <p>{note}</p>}
          </Alert>
        </>
      )}

      <div className={styles.columns}>
        <section
          id={EXPORT_STEPS_ID}
          className={styles.steps}
          aria-labelledby={`${inputId}-steps`}
        >
          <h2 id={`${inputId}-steps`} className={styles.sectionTitle}>
            How to get your export
          </h2>
          <ol>
            <li>Instagram → Settings → Accounts Center</li>
            <li>
              Your information and permissions → Export your information →
              Create export → choose your profile → Export to device
            </li>
            <li>
              Customize information → Choose specific info to export → choose
              only Saved
            </li>
            <li>Format JSON, date range All time, then wait for the email</li>
          </ol>
        </section>

        <section
          className={[styles.drop, dragging && styles.dragging]
            .filter(Boolean)
            .join(" ")}
          aria-labelledby={`${inputId}-upload`}
          aria-busy={loading}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={(event) => {
            // Moving onto the icon or heading inside also fires dragleave.
            const to = event.relatedTarget;
            if (to instanceof Node && event.currentTarget.contains(to)) return;
            setDragging(false);
          }}
          onDrop={handleDrop}
        >
          <UploadIcon size={32} aria-hidden="true" className={styles.icon} />
          <h2 id={`${inputId}-upload`} className={styles.sectionTitle}>
            Upload your export
          </h2>
          {/* Always in the page, so screen readers announce the change. */}
          <p role="status" className={styles.status}>
            {loading
              ? "Importing your saves… Reading your export and saving it can take a minute."
              : ""}
          </p>
          {!loading && (
            <>
              <p className={styles.hint}>
                <span className={styles.desktopOnly}>
                  Drag it here, or choose it.{" "}
                </span>
                The ZIP, or {POSTS_FILE} and {COLLECTIONS_FILE} together · max{" "}
                {MAX_ZIP_MB} MB
              </p>
              {/* The input stays focusable; its label looks like a button. */}
              <input
                id={inputId}
                type="file"
                accept=".zip,.json"
                multiple
                className={styles.input}
                onChange={(event) => {
                  void start([...(event.target.files ?? [])]);
                  // Lets the same file be chosen again after an error.
                  event.target.value = "";
                }}
              />
              <label htmlFor={inputId} className={buttonClassName("primary")}>
                {state.status === "error"
                  ? "Choose another file"
                  : "Choose file"}
              </label>
            </>
          )}
        </section>
      </div>

      <p className={styles.privacy}>
        We only read your list of saved posts. Nothing is posted to or changed
        on Instagram.
      </p>
    </div>
  );
}
