"use client";

import { useEffect, useRef, useState } from "react";
import {
  runImport,
  type ImportOptions,
  type ImportResult,
} from "@/lib/import/run-import";

/** Where an import is: not started, running, failed or done. */
export type ImportState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; error: string; files: File[] }
  | { status: "done"; result: Extract<ImportResult, { ok: true }> };

/**
 * Sends the compressed upload to the import route.
 *
 * @param upload - The gzip-compressed upload.
 * @returns The route's answer.
 */
const send = (upload: Blob) =>
  fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/gzip" },
    body: upload,
  });

/**
 * Runs an import and keeps track of where it is. Focus moves to the new
 * heading after an import, so keyboard and screen reader users follow along.
 *
 * @returns The state, `start` with the files to import (and `runImport`'s
 *   options), `importMore` to go back to the start, and the ref for the
 *   heading that takes focus.
 */
export function useImport() {
  const [state, setState] = useState<ImportState>({ status: "idle" });
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Set at once, unlike state, so two fast clicks or drops start one import.
  const running = useRef(false);
  // Set by "Import another export", so the first page load doesn't move focus.
  const focusAfterReset = useRef(false);

  useEffect(() => {
    if (
      state.status === "error" ||
      state.status === "done" ||
      (state.status === "idle" && focusAfterReset.current)
    ) {
      focusAfterReset.current = false;
      headingRef.current?.focus();
    }
  }, [state.status]);

  function importMore() {
    focusAfterReset.current = true;
    setState({ status: "idle" });
  }

  async function start(files: File[], options?: ImportOptions) {
    if (files.length === 0 || running.current) return;
    running.current = true;
    setState({ status: "loading" });
    // runImport never throws, so the ref is always cleared.
    const result = await runImport(files, send, options);
    running.current = false;
    setState(
      result.ok
        ? { status: "done", result }
        : { status: "error", error: result.error, files },
    );
  }

  return { state, start, importMore, headingRef };
}
