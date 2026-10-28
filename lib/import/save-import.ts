import { db } from "@/lib/db";
import { buildImport, type ImportInput } from "./build-import";
import { insertInBatches } from "./insert-in-batches";

/**
 * Prisma's default of 5 seconds is too short for a first import of thousands
 * of saves, with a round trip to the database for every batch.
 */
const TRANSACTION_TIMEOUT_MS = 30_000;

/**
 * Imports parsed saves for one user, all or nothing. The library is read
 * inside the same transaction as the writes, and the unique constraints on
 * posts and tags still stop duplicates if two imports run at once: the later
 * one fails and changes nothing.
 *
 * @param userId - The signed-in user the saves belong to.
 * @param input - The cleaned export sent by the browser.
 * @returns The counts for the import summary.
 * @throws If any write fails; nothing is saved then.
 */
export async function saveImport(
  userId: string,
  input: ImportInput,
  now = new Date(),
) {
  return db().$transaction(
    async (tx) => {
      const posts = await tx.post.findMany({
        where: { userId },
        select: { shortcode: true },
      });
      const tags = await tx.tag.findMany({
        where: { userId },
        select: { id: true, name: true, nameKey: true },
      });
      const collections = await tx.collection.findMany({
        where: { userId },
        select: { id: true, externalId: true, name: true },
      });

      const rows = buildImport(
        userId,
        input,
        { shortcodes: posts.map((post) => post.shortcode), tags, collections },
        now,
      );

      // Parents first, so every link points at a row that exists.
      await insertInBatches(rows.posts, (data) => tx.post.createMany({ data }));
      await insertInBatches(rows.tags, (data) => tx.tag.createMany({ data }));
      await insertInBatches(rows.collections, (data) =>
        tx.collection.createMany({ data }),
      );
      for (const { id, name } of rows.collectionRenames) {
        await tx.collection.update({ where: { id }, data: { name } });
      }
      await insertInBatches(rows.postTags, (data) =>
        tx.postTag.createMany({ data }),
      );
      await insertInBatches(rows.postCollections, (data) =>
        tx.postCollection.createMany({ data }),
      );
      await tx.import.create({ data: rows.import });

      return rows.summary;
    },
    { timeout: TRANSACTION_TIMEOUT_MS },
  );
}
