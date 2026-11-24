import { Check } from "lucide-react";
import Link from "next/link";
import { filterHref, type SavesFilter } from "@/lib/saves/saves-filter";
import {
  ALL_SAVES,
  chipCountWords,
  TAG_FILTER_LABEL,
  UNTAGGED_SAVES,
} from "@/lib/saves/saves-text";
import { tagKey, type UserTag } from "@/lib/tags";
import styles from "./TagFilter.module.scss";

type Props = {
  /** The filter in the URL; its chip is marked as current. */
  filter: SavesFilter;
  /** All the user's tags with their counts, in alphabetical order. */
  tags: UserTag[];
  /** How many saves the user has. */
  totalCount: number;
  /** How many of them have no tag. */
  untaggedCount: number;
};

type Chip = { filter: SavesFilter; label: string; count: number };

/**
 * The row of filter chips above the grid: all saves, untagged saves, then
 * each tag that's on a save. Each chip is a link, so the filter lives in the
 * URL: it survives a reload and can be shared. The current chip is filled
 * and has a check mark, so it doesn't rely on color alone.
 *
 * Hidden while no tag is on a save, since there's nothing to filter by.
 *
 * @param props - The current filter, the tags and the counts.
 * @returns The chips, or nothing.
 */
export function TagFilter({ filter, tags, totalCount, untaggedCount }: Props) {
  const current = filter.kind === "tag" ? filter.key : null;
  // A tag on no saves leads to an empty grid, unless the user is already there.
  const tagChips: Chip[] = tags
    .filter((tag) => tag.count > 0 || tagKey(tag.name) === current)
    .map(({ name, count }) => ({
      filter: { kind: "tag", key: tagKey(name) },
      label: name,
      count,
    }));
  if (!tagChips.some((chip) => chip.count > 0)) return null;

  const chips: Chip[] = [
    { filter: { kind: "all" }, label: ALL_SAVES, count: totalCount },
    {
      filter: { kind: "untagged" },
      label: UNTAGGED_SAVES,
      count: untaggedCount,
    },
    ...tagChips,
  ];
  const currentHref = filterHref(filter);

  return (
    <nav aria-label={TAG_FILTER_LABEL} className={styles.filter}>
      <ul className={styles.chips}>
        {chips.map((chip) => {
          const href = filterHref(chip.filter);
          const isCurrent = href === currentHref;
          return (
            <li key={href}>
              <Link
                href={href}
                className={styles.link}
                aria-current={isCurrent ? "page" : undefined}
              >
                <span className={styles.chip}>
                  {isCurrent && (
                    <Check
                      size={16}
                      aria-hidden="true"
                      className={styles.check}
                    />
                  )}
                  {chip.label}{" "}
                  <span className={styles.count}>
                    {chip.count}
                    <span className={styles.countWords}>
                      {chipCountWords(chip.count)}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
