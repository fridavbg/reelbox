import { CircleAlert } from "lucide-react";
import { useId, type InputHTMLAttributes } from "react";
import styles from "./TextInput.module.scss";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  // Replaces the helper text and marks the field invalid.
  error?: string;
  inputClassName?: string;
};

export function TextInput({
  label,
  helperText,
  error,
  inputClassName,
  className,
  id,
  ...rest
}: Props) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const messageId = `${inputId}-message`;
  const message = error ?? helperText;

  return (
    <div className={[styles.field, className].filter(Boolean).join(" ")}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <input
        id={inputId}
        className={[styles.input, error && styles.invalid, inputClassName]
          .filter(Boolean)
          .join(" ")}
        aria-invalid={error ? true : undefined}
        aria-describedby={message ? messageId : undefined}
        {...rest}
      />
      {error ? (
        <p id={messageId} className={styles.error} role="alert">
          <CircleAlert size={18} aria-hidden="true" className={styles.icon} />
          {error}
        </p>
      ) : (
        helperText && (
          <p id={messageId} className={styles.helper}>
            {helperText}
          </p>
        )
      )}
    </div>
  );
}
