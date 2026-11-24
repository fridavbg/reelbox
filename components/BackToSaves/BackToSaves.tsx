"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  filterFromURLSearchParams,
  filterHref,
} from "@/lib/saves/saves-filter";
import { BACK_TO_SAVES } from "@/lib/saves/saves-text";

type Props = {
  /** The page's own styles for the link. */
  className?: string;
};

/**
 * "← Back to saves" on a save's page, back to the grid with the filter it
 * was opened from: the card's link carries it in the URL. A client
 * component, since the not-found page gets no search params of its own.
 *
 * @param props - The link's class.
 * @returns The link.
 */
export function BackToSaves({ className }: Props) {
  const filter = filterFromURLSearchParams(useSearchParams());
  return (
    <Link href={filterHref(filter)} className={className}>
      {BACK_TO_SAVES}
    </Link>
  );
}
