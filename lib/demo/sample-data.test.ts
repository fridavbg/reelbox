import { describe, expect, it } from "vitest";
import { expiredDemoUsersFilter } from "./demo-users";
import { buildDemoData } from "./sample-data";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";
const now = new Date("2026-10-05T12:00:00Z");

describe("demo sample data", () => {
  const data = buildDemoData(userId, now);

  it("belongs only to the demo user", () => {
    for (const rows of [
      data.tags,
      data.collections,
      data.posts,
      data.imports,
    ]) {
      expect(rows.every((row) => row.userId === userId)).toBe(true);
    }
  });

  it("has realistic saves, tags and exactly one import", () => {
    expect(data.posts.length).toBeGreaterThanOrEqual(20);
    expect(data.tags.length).toBeGreaterThan(0);
    expect(data.postTags.length).toBeGreaterThan(0);
    expect(data.imports).toHaveLength(1);
  });

  it("keeps the unique rules the database enforces", () => {
    const unique = (values: string[]) => new Set(values).size === values.length;
    expect(unique(data.posts.map((post) => post.shortcode))).toBe(true);
    expect(unique(data.tags.map((tag) => tag.nameKey))).toBe(true);
    expect(unique(data.collections.map((c) => c.externalId))).toBe(true);
  });

  it("only links rows that exist", () => {
    const postIds = new Set(data.posts.map((post) => post.id));
    const tagIds = new Set(data.tags.map((tag) => tag.id));
    const collectionIds = new Set(data.collections.map((c) => c.id));
    for (const link of data.postTags) {
      expect(postIds.has(link.postId) && tagIds.has(link.tagId)).toBe(true);
    }
    for (const link of data.postCollections) {
      expect(postIds.has(link.postId)).toBe(true);
      expect(collectionIds.has(link.collectionId)).toBe(true);
    }
  });

  it("has an import that covers every save, all saved in the past", () => {
    const [summary] = data.imports;
    expect(summary.newCount).toBe(data.posts.length);
    for (const post of data.posts) {
      expect(post.savedAt.getTime()).toBeLessThan(now.getTime());
      expect(post.savedAt >= summary.earliestSavedAt).toBe(true);
      expect(post.savedAt <= summary.latestSavedAt).toBe(true);
    }
  });

  it("gives every demo user their own rows", () => {
    const other = buildDemoData(otherUserId, now);
    const ids = (d: typeof data) =>
      [...d.tags, ...d.collections, ...d.posts, ...d.imports].map((r) => r.id);
    const shared = ids(data).filter((id) => ids(other).includes(id));
    expect(shared).toEqual([]);
  });
});

describe("expired demo users", () => {
  it("only ever matches demo users", () => {
    expect(expiredDemoUsersFilter(now).isAnonymous).toBe(true);
  });

  it("matches demo users created more than 24 hours ago", () => {
    expect(expiredDemoUsersFilter(now).createdAt.lt).toEqual(
      new Date("2026-10-04T12:00:00Z"),
    );
  });
});
