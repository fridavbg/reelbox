import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./Layout.module.scss";

type Props = {
  children: ReactNode;
  // Header links and buttons, e.g. Import and the account menu.
  actions?: ReactNode;
};

export function Layout({ children, actions }: Props) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          <Image
            src="/reelbox-logo.svg"
            alt="Reelbox"
            width={143}
            height={32}
            priority
          />
        </Link>
        {actions && (
          <nav aria-label="Main" className={styles.nav}>
            {actions}
          </nav>
        )}
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
