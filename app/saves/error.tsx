"use client";

import { useEffect } from "react";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { Layout } from "@/components/Layout/Layout";
import { SAVES_LOAD_FAILED } from "@/lib/saves/saves-text";
import styles from "./error.module.scss";

type Props = {
  error: Error & { digest?: string };
  /** Loads the page from the server again. */
  retry: () => void;
};

/**
 * Shown by Next when the saves page throws, e.g. when the database can't be
 * reached. "Try again" loads the page again without a full reload.
 *
 * @param props - The error, and Next's retry function.
 * @returns The error page.
 */
export default function SavesError({ error, retry }: Props) {
  useEffect(() => {
    // Shows up in the browser console; the server logs the full error.
    console.error(error);
  }, [error]);

  return (
    <Layout>
      <div className={styles.error}>
        <h1 className={styles.title}>Your saves</h1>
        <Alert variant="error">
          <p>{SAVES_LOAD_FAILED}</p>
        </Alert>
        <Button variant="primary" onClick={retry}>
          Try again
        </Button>
      </div>
    </Layout>
  );
}
