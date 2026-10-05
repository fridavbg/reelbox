import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "text";
  // Shows `loadingLabel` while a request runs.
  loading?: boolean;
  loadingLabel?: string;
};

export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Sending…",
  type = "button",
  className,
  children,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={[styles.button, styles[variant], className]
        .filter(Boolean)
        .join(" ")}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
