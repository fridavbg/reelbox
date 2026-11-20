import type { PostKind } from "@/generated/prisma/client";

type Props = {
  kind: PostKind;
  className?: string;
};

/**
 * A small reel or post icon in the text color. Decorative: the word next to
 * it says the kind, so screen readers skip the icon.
 *
 * @param props - The save's kind and an optional class.
 * @returns The icon.
 */
export function KindIcon({ kind, className }: Props) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.75"
        y="1.75"
        width="12.5"
        height="12.5"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {kind === "REEL" ? (
        <path d="M6.5 5.4v5.2L10.6 8z" fill="currentColor" />
      ) : (
        <>
          <circle cx="5.75" cy="5.75" r="1.25" fill="currentColor" />
          <path
            d="M2.5 12l3.5-3.5 2.5 2.5 2-2 3 3"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
