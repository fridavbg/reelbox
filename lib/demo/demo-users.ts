import { db } from "@/lib/db";
import { DEMO_LIFETIME_HOURS } from "./demo-settings";
import { buildDemoData } from "./sample-data";

// Demo users old enough to delete. `isAnonymous: true` is what keeps this
// from ever touching a real account.
export function expiredDemoUsersFilter(now: Date) {
  return {
    isAnonymous: true,
    createdAt: { lt: new Date(now.getTime() - DEMO_LIFETIME_HOURS * 3600_000) },
  } as const;
}

// Gives a new demo user their own copy of the sample saves, all or nothing.
export async function seedDemoUser(userId: string, now = new Date()) {
  const rows = buildDemoData(userId, now);
  await db().$transaction([
    db().tag.createMany({ data: rows.tags }),
    db().collection.createMany({ data: rows.collections }),
    db().post.createMany({ data: rows.posts }),
    db().postTag.createMany({ data: rows.postTags }),
    db().postCollection.createMany({ data: rows.postCollections }),
    db().import.createMany({ data: rows.imports }),
  ]);
}

// Their saves, tags, collections, imports and sessions are deleted with them.
export async function deleteExpiredDemoUsers(now = new Date()) {
  const { count } = await db().user.deleteMany({
    where: expiredDemoUsersFilter(now),
  });
  return count;
}
