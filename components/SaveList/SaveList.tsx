"use client";

import { useEffect, useRef, useState } from "react";
import { loadMoreSaves } from "@/app/saves/actions";
import { Alert } from "@/components/Alert/Alert";
import { Button } from "@/components/Button/Button";
import { SaveCard } from "@/components/SaveCard/SaveCard";
import type { SaveListItem } from "@/lib/saves/list-saves";
import { LOAD_MORE_FAILED } from "@/lib/saves/saves-text";
import { useBrowserTimeZone } from "@/lib/use-browser-time-zone";
import styles from "./SaveList.module.scss";

type Props = {
  /** The first page, rendered on the server. */
  initialSaves: SaveListItem[];
  /** The cursor for the second page, or null if there is none. */
  initialCursor: string | null;
  /** Demo saves are invented, so their cards don't link to Instagram. */
  demo?: boolean;
};

/**
 * The saves grid with "Load more". Each click adds the next page below the
 * saves already shown, and focus moves to the first new card so keyboard
 * and screen reader users continue from there.
 *
 * @param props - The first page, the cursor for the next, and whether the
 *   saves are demo saves.
 * @returns The grid and its button.
 */
export function SaveList({ initialSaves, initialCursor, demo = false }: Props) {
  const timeZone = useBrowserTimeZone();
  const [saves, setSaves] = useState(initialSaves);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  // Index of the first card added by the last "Load more".
  const [firstNew, setFirstNew] = useState<number | null>(null);
  const firstNewRef = useRef<HTMLElement>(null);
  // Set while a page is loading. A ref changes at once, unlike state, so a
  // quick second click can't load the same page again.
  const loadingRef = useRef(false);

  useEffect(() => {
    if (firstNew !== null) firstNewRef.current?.focus();
  }, [firstNew]);

  async function loadMore() {
    if (!cursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setFailed(false);
    try {
      const page = await loadMoreSaves(cursor);
      setFirstNew(saves.length);
      setSaves([...saves, ...page.saves]);
      setCursor(page.nextCursor);
    } catch {
      setFailed(true);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }

  return (
    <div className={styles.list}>
      <ul className={styles.grid}>
        {saves.map((save, index) => (
          <li key={save.id}>
            <SaveCard
              save={save}
              timeZone={timeZone}
              ref={index === firstNew ? firstNewRef : undefined}
              demo={demo}
            />
          </li>
        ))}
      </ul>
      {failed && (
        <Alert variant="error">
          <p>{LOAD_MORE_FAILED}</p>
        </Alert>
      )}
      {cursor && (
        <Button
          variant="secondary"
          className={styles.loadMore}
          onClick={loadMore}
          loading={loading}
          loadingLabel="Loading…"
        >
          Load more
        </Button>
      )}
    </div>
  );
}
