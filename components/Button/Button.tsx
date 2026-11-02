import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.scss";

type Variant = "primary" | "secondary" | "text";

/**
 * The button look, for links and labels that should look like a button.
 *
 * @param variant - Which button style.
 * @param className - Extra classes to add.
 * @returns The class names to put on the element.
 */
export function buttonClassName(variant: Variant, className?: string) {
  return [styles.button, styles[variant], className].filter(Boolean).join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
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
      className={buttonClassName(variant, className)}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
