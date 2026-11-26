import { Clapperboard, ImageIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AccountActions } from "@/components/AccountActions/AccountActions";
import { BackToSaves } from "@/components/BackToSaves/BackToSaves";
import { Layout } from "@/components/Layout/Layout";
import { NoLongerSavedBadge } from "@/components/NoLongerSavedBadge/NoLongerSavedBadge";
import { OpenOnInstagram } from "@/components/OpenOnInstagram/OpenOnInstagram";
import { ProfileLink } from "@/components/ProfileLink/ProfileLink";
import { SavedOn } from "@/components/SavedOn/SavedOn";
import { TagEditor } from "@/components/TagEditor/TagEditor";
import { getSave, listTags } from "@/lib/saves/get-save";
import { getSuggestions } from "@/lib/saves/get-suggestions";
import { kindText } from "@/lib/saves/save-card-text";
import { collectionsText } from "@/lib/saves/saves-text";
import { requireUser } from "@/lib/session";
import styles from "./page.module.scss";

export const metadata: Metadata = { title: "Tag a saved post · Reelbox" };

const kindIcons = { REEL: Clapperboard, POST: ImageIcon };

/**
 * One save on its own page, where its tags are managed. Only the
 * signed-in user's own saves are found; any other id is a 404.
 *
 * @param props - The route's params, with the save's id.
 * @returns The page.
 */
export default async function SavePage({ params }: PageProps<"/saves/[id]">) {
  const { id } = await params;
  const user = await requireUser();
  const [save, userTags] = await Promise.all([
    getSave(user.id, id),
    listTags(user.id),
  ]);
  if (!save) notFound();
  // Needs the save's creator, tags and collections, so it comes after.
  const suggestions = await getSuggestions(user.id, save);

  const isDemo = Boolean(user.isAnonymous);
  const KindIcon = kindIcons[save.kind];

  return (
    <Layout actions={<AccountActions demo={isDemo} />}>
      <div className={styles.page}>
        <BackToSaves className={styles.back} />

        <article className={styles.save}>
          <p className={styles.kind}>
            <KindIcon size={16} aria-hidden="true" />
            {kindText(save.kind)}
          </p>
          {/* `||`, not `??`: an empty name counts as none. */}
          <h1 className={styles.title}>
            {save.creatorName || `@${save.creatorUsername}`}
          </h1>
          <p className={styles.username}>
            <ProfileLink
              username={save.creatorUsername}
              url={save.creatorUrl}
              demo={isDemo}
            />
          </p>
          {save.caption && <p className={styles.caption}>{save.caption}</p>}
          <p className={styles.meta}>
            <SavedOn savedAt={save.savedAt} />
            {save.collections.length > 0 &&
              ` · ${collectionsText(save.collections)}`}
          </p>
          {save.noLongerSavedAt && <NoLongerSavedBadge />}
          <OpenOnInstagram
            url={save.url}
            kind={save.kind}
            creatorUsername={save.creatorUsername}
            demo={isDemo}
          />
        </article>

        <section className={styles.tags} aria-labelledby="tags-title">
          <h2 id="tags-title" className={styles.sectionTitle}>
            Tags
          </h2>
          <TagEditor
            postId={save.id}
            tags={save.tags}
            userTags={userTags}
            suggestions={{
              creatorUsername: save.creatorUsername,
              ...suggestions,
            }}
            collections={save.collections}
          />
        </section>
      </div>
    </Layout>
  );
}
