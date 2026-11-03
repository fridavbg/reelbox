import { describe, expect, it } from "vitest";
import {
  afterCursor,
  encodeCursor,
  parseCursor,
  toPage,
  type SavesCursor,
} from "./saves-page";

const id = (n: number) =>
  `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
const cursor: SavesCursor = {
  savedAt: new Date("2026-09-30T12:34:56.789Z"),
  id: id(1),
};

describe("encodeCursor and parseCursor", () => {
  it("read back the cursor they wrote", () => {
    expect(parseCursor(encodeCursor(cursor))).toEqual(cursor);
  });

  it.each([
    ["not a string", 42],
    ["empty", ""],
    ["no separator", "2026-09-30T12:34:56.789Z"],
    ["a bad date", `yesterday_${id(1)}`],
    ["a bad id", "2026-09-30T12:34:56.789Z_123"],
    ["extra parts", `2026-09-30T12:34:56.789Z_${id(1)}_${id(2)}`],
  ])("reject a cursor that is %s", (_, value) => {
    expect(parseCursor(value)).toBeNull();
  });
});

describe("afterCursor", () => {
  it("matches everything on the first page", () => {
    expect(afterCursor(undefined)).toEqual({});
  });

  it("matches older saves, and saves from the same moment with a smaller id", () => {
    expect(afterCursor(cursor)).toEqual({
      OR: [
        { savedAt: { lt: cursor.savedAt } },
        { savedAt: cursor.savedAt, id: { lt: cursor.id } },
      ],
    });
  });
});

describe("paging through a library", () => {
  type Row = SavesCursor;
  type Filter = ReturnType<typeof afterCursor>;

  /**
   * Checks a row against the filter `afterCursor` builds, the way Postgres
   * would. Lowercase UUID strings sort like Postgres sorts the uuid type.
   *
   * @param row - A save.
   * @param filter - The filter from `afterCursor`.
   * @returns Whether the query would return the row.
   */
  const matches = (row: Row, filter: Filter): boolean => {
    if (!filter.OR) return true;
    const conditions = filter.OR as {
      savedAt: Date | { lt: Date };
      id?: { lt: string };
    }[];
    return conditions.some(({ savedAt, id }) => {
      const dateMatches =
        savedAt instanceof Date
          ? row.savedAt.getTime() === savedAt.getTime()
          : row.savedAt < savedAt.lt;
      return dateMatches && (!id || row.id < id.lt);
    });
  };

  /** Newest first, then by id, like the query's `orderBy`. */
  const newestFirst = (a: Row, b: Row) =>
    b.savedAt.getTime() - a.savedAt.getTime() || (a.id < b.id ? 1 : -1);

  /**
   * Fetches every page the way "Load more" does, until there's no next page.
   *
   * @param library - Every save, in any order.
   * @param pageSize - Saves per page.
   * @returns Each page's saves.
   */
  const allPages = (library: Row[], pageSize: number) => {
    const sorted = [...library].sort(newestFirst);
    const pages: Row[][] = [];
    let cursor: SavesCursor | undefined;
    do {
      const filter = afterCursor(cursor);
      const rows = sorted
        .filter((row) => matches(row, filter))
        .slice(0, pageSize + 1);
      const page = toPage(rows, pageSize);
      pages.push(page.saves);
      cursor = parseCursor(page.nextCursor) ?? undefined;
    } while (cursor);
    return pages;
  };

  const sameMoment = new Date("2026-09-30T12:00:00.000Z");
  // 10 saves: ids 1–7 share one saved date, so a page break falls among them.
  const library: Row[] = [
    ...Array.from({ length: 7 }, (_, i) => ({
      id: id(i + 1),
      savedAt: sameMoment,
    })),
    { id: id(8), savedAt: new Date("2026-10-01T00:00:00.000Z") },
    { id: id(9), savedAt: new Date("2026-09-01T00:00:00.000Z") },
    { id: id(10), savedAt: new Date("2025-01-01T00:00:00.000Z") },
  ];

  it.each([1, 3, 4, 9, 10, 11])(
    "shows every save exactly once, in order, with %i per page",
    (pageSize) => {
      const pages = allPages(library, pageSize);
      expect(pages.flat()).toEqual([...library].sort(newestFirst));
      expect(pages).toHaveLength(Math.max(1, Math.ceil(10 / pageSize)));
    },
  );
});

describe("toPage", () => {
  const rows = (count: number) =>
    Array.from({ length: count }, (_, i) => ({
      id: id(100 - i),
      savedAt: new Date(Date.UTC(2026, 8, 30 - i)),
    }));

  it("has no next page when the extra row is missing", () => {
    const page = toPage(rows(3), 3);
    expect(page.saves).toHaveLength(3);
    expect(page.nextCursor).toBeNull();
  });

  it("drops the extra row and points the cursor at the last save shown", () => {
    const all = rows(4);
    const page = toPage(all, 3);
    expect(page.saves).toEqual(all.slice(0, 3));
    expect(parseCursor(page.nextCursor)).toEqual({
      savedAt: all[2].savedAt,
      id: all[2].id,
    });
  });

  it("handles an empty library", () => {
    expect(toPage([], 3)).toEqual({ saves: [], nextCursor: null });
  });
});
