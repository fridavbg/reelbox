/**
 * Postgres allows 65,535 values per query. A post has about 15 columns, so
 * 1,000 rows stays well below that.
 */
export const BATCH_SIZE = 1_000;

/**
 * Inserts rows in batches of at most {@link BATCH_SIZE}, one batch at a time.
 * Inside an interactive transaction Prisma uses a single connection, so
 * running batches in parallel isn't supported.
 *
 * @param rows - Rows to insert, in order.
 * @param insert - Inserts one batch, e.g. a Prisma `createMany`.
 * @returns Once every batch is inserted.
 */
export async function insertInBatches<T>(
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>,
) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await insert(rows.slice(i, i + BATCH_SIZE));
  }
}
