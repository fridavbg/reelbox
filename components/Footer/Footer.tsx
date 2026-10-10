"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Footer.module.scss";

const links = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function Footer() {
  // Client component only to mark the current page for screen readers.
  const pathname = usePathname();

  return (
    <footer className={styles.footer}>
      <nav aria-label="Footer">
        <ul className={styles.links}>
          {links.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={styles.link}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </footer>
  );
}
