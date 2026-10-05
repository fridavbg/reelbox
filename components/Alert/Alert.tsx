import { CircleAlert, CircleCheck, Info } from "lucide-react";
import type { ReactNode } from "react";
import styles from "./Alert.module.scss";

type Variant = "error" | "success" | "info";

const icons = { error: CircleAlert, success: CircleCheck, info: Info };

type Props = {
  variant: Variant;
  title?: string;
  children: ReactNode;
};

// Always icon + words, never color alone.
export function Alert({ variant, title, children }: Props) {
  const Icon = icons[variant];
  return (
    <div
      className={[styles.alert, styles[variant]].join(" ")}
      role={variant === "error" ? "alert" : "status"}
    >
      <Icon size={20} aria-hidden="true" className={styles.icon} />
      <div className={styles.body}>
        {title && <p className={styles.title}>{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  );
}
