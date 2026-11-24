import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/Button/Button";
import { AccountActions } from "@/components/AccountActions/AccountActions";
import { Layout } from "@/components/Layout/Layout";
import { SaveList } from "@/components/SaveList/SaveList";
import { TagFilter } from "@/components/TagFilter/TagFilter";
import { db } from "@/lib/db";
import { DEMO_LIFETIME_HOURS } from "@/lib/demo/demo-settings";
import { DEMO_CANT_IMPORT } from "@/lib/import/import-messages";
import { EXPORT_STEPS_ID } from "@/lib/import/import-settings";
import { listTags } from "@/lib/saves/get-save";
import { listSaves } from "@/lib/saves/list-saves";
import {
  filterFromSearchParams,
  filterHref,
  filterWhere,
} from "@/lib/saves/saves-filter";
import {
  NO_SAVES_TEXT,
  NO_SAVES_TITLE,
  savesCountText,
} from "@/lib/saves/saves-text";
import { requireUser } from "@/lib/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Your saves · Reelbox" };

/**
 * The saves page: the first page of saves, newest first, with "Load more"
 * for the rest, filtered by the tag in the URL. A user without saves is
 * guided to the import instead.
 *
 * @param props - The route's search params, with the filter.
 * @returns The page.
 */
export default async function SavesPage({ searchParams }: PageProps<"/saves">) {
  const filter = filterFromSearchParams(await searchParams);
  const user = await requireUser();
  const isDemo = Boolean(user.isAnonymous);
  const [saveCount, untaggedCount, tags, firstPage] = await Promise.all([
    db().post.count({ where: { userId: user.id } }),
    db().post.count({
      where: { userId: user.id, ...filterWhere({ kind: "untagged" }, user.id) },
    }),
    listTags(user.id),
    listSaves(user.id, filter),
  ]);

  return (
    <Layout actions={<AccountActions demo={isDemo} />}>
      {saveCount === 0 && !isDemo ? (
        <div className={styles.empty}>
          <div className={styles.illustration} aria-hidden="true">
            {Array.from({ length: 6 }, (_, i) => (
              <span key={i} />
            ))}
          </div>
          <h1 className={styles.emptyTitle}>{NO_SAVES_TITLE}</h1>
          <p className={styles.text}>{NO_SAVES_TEXT}</p>
          <Link href="/import" className={buttonClassName("primary")}>
            Import your saves
          </Link>
          <Link href={`/import#${EXPORT_STEPS_ID}`} className={styles.help}>
            How do I get my export?
          </Link>
        </div>
      ) : (
        <div className={styles.saves}>
          <div className={styles.intro}>
            <h1 className={styles.title}>Your saves</h1>
            {isDemo && (
              <>
                <p className={styles.text}>
                  You&apos;re trying the demo with sample saves. Changes are
                  deleted after {DEMO_LIFETIME_HOURS} hours.
                </p>
                <p className={styles.text}>{DEMO_CANT_IMPORT}</p>
              </>
            )}
            <p className={styles.count}>{savesCountText(saveCount)}</p>
          </div>
          <TagFilter
            filter={filter}
            tags={tags}
            totalCount={saveCount}
            untaggedCount={untaggedCount}
          />
          <SaveList
            // A new filter starts a new list, so no saves or cursor carry over.
            key={filterHref(filter)}
            filter={filter}
            initialSaves={firstPage.saves}
            initialCursor={firstPage.nextCursor}
            demo={isDemo}
          />
        </div>
      )}
    </Layout>
  );
}
