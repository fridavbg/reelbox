import { describe, expect, it } from "vitest";
import { BATCH_SIZE, insertInBatches } from "./insert-in-batches";

describe("insertInBatches", () => {
  it("inserts every row, in order, in batches no larger than the limit", async () => {
    const rows = Array.from({ length: BATCH_SIZE * 2 + 1 }, (_, i) => i);
    const calls: number[][] = [];
    await insertInBatches(rows, async (batch) => calls.push(batch));
    expect(calls.map((batch) => batch.length)).toEqual([
      BATCH_SIZE,
      BATCH_SIZE,
      1,
    ]);
    expect(calls.flat()).toEqual(rows);
  });

  it("makes no call when there's nothing to insert", async () => {
    const calls: number[][] = [];
    await insertInBatches([], async (batch: number[]) => calls.push(batch));
    expect(calls).toEqual([]);
  });

  it("inserts one batch at a time, waiting for each to finish", async () => {
    const rows = Array.from({ length: BATCH_SIZE + 1 }, (_, i) => i);
    const events: string[] = [];
    await insertInBatches(rows, async (batch) => {
      events.push(`start ${batch.length}`);
      await new Promise((resolve) => setTimeout(resolve, 1));
      events.push(`end ${batch.length}`);
    });
    expect(events).toEqual([
      `start ${BATCH_SIZE}`,
      `end ${BATCH_SIZE}`,
      "start 1",
      "end 1",
    ]);
  });
});
