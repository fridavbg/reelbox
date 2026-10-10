import type { ReactNode } from "react";
import styles from "./Prose.module.scss";

type Props = {
  title: string;
  /** ISO date, e.g. "2026-10-10". */
  updated: string;
  children: ReactNode;
};

/** A readable column of long-form text, such as the privacy policy. */
export function Prose({ title, updated, children }: Props) {
  const label = new Date(`${updated}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <article className={styles.prose}>
      <header className={styles.intro}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.updated}>
          Last updated <time dateTime={updated}>{label}</time>
        </p>
      </header>
      {children}
    </article>
  );
}
