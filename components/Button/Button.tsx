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

/**
 * A button that ignores clicks while `loading`. It stays enabled then, so
 * keyboard focus isn't lost, but a click runs no `onClick` and submits no
 * form, so callers never need their own "already loading" check.
 *
 * @param props - The button's attributes, its `variant`, and `loading` with
 *   the `loadingLabel` shown meanwhile.
 * @returns The button.
 */
export function Button({
  variant = "primary",
  loading = false,
  loadingLabel = "Sending…",
  type = "button",
  className,
  children,
  onClick,
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={buttonClassName(variant, className)}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      {...rest}
      onClick={(event) => {
        // Also cancels a form submit, including one from Enter in a field.
        if (loading) {
          event.preventDefault();
          return;
        }
        onClick?.(event);
      }}
    >
      {loading ? loadingLabel : children}
    </button>
  );
}
