// Sample saves for the demo. Creators, captions and shortcodes are invented,
// so no real person's account appears in the demo.

type SamplePost = {
  shortcode: string;
  kind: "REEL" | "POST";
  creator: string;
  creatorName?: string;
  caption?: string;
  hashtags: string[];
  // How long before the demo starts it was saved.
  savedDaysAgo: number;
  tags: string[];
  collections: string[];
};

export const SAMPLE_TAGS = [
  "Recipes",
  "Weeknight",
  "Interior",
  "Travel",
  "Workouts",
];

export const SAMPLE_COLLECTIONS = [
  { externalId: "demo-collection-dinner", name: "Dinner ideas" },
  { externalId: "demo-collection-home", name: "Home" },
  { externalId: "demo-collection-trips", name: "Trips" },
];

const kitchen = { creator: "demo.kitchen", creatorName: "Demo Kitchen" };
const greens = { creator: "demo.greens", creatorName: "Green Plates" };
const home = { creator: "demo.homestudio", creatorName: "Home Studio" };
const rooms = { creator: "demo.smallrooms", creatorName: "Small Rooms" };
const wander = { creator: "demo.wanderer", creatorName: "Wanderer" };
const move = { creator: "demo.movement", creatorName: "Daily Movement" };
const misc = { creator: "demo.sketchbook", creatorName: "Sketchbook" };

export const SAMPLE_POSTS: SamplePost[] = [
  {
    ...kitchen,
    shortcode: "DemoRcp0001",
    kind: "REEL",
    caption: "15-minute garlic noodles. Pantry staples only.",
    hashtags: ["recipes", "weeknight", "noodles"],
    savedDaysAgo: 2,
    tags: ["Recipes", "Weeknight"],
    collections: ["Dinner ideas"],
  },
  {
    ...kitchen,
    shortcode: "DemoRcp0002",
    kind: "REEL",
    caption: "One-pan lemon chicken with crispy potatoes.",
    hashtags: ["onepan", "dinner"],
    savedDaysAgo: 5,
    tags: ["Recipes", "Weeknight"],
    collections: ["Dinner ideas"],
  },
  {
    ...greens,
    shortcode: "DemoRcp0003",
    kind: "REEL",
    caption: "Roasted chickpea salad that keeps for three days.",
    hashtags: ["mealprep", "vegetarian"],
    savedDaysAgo: 9,
    tags: ["Recipes"],
    collections: [],
  },
  {
    ...kitchen,
    shortcode: "DemoRcp0004",
    kind: "POST",
    caption: "Five sauces to keep in the fridge. Save for later.",
    hashtags: ["sauces", "kitchenbasics"],
    savedDaysAgo: 21,
    tags: ["Recipes"],
    collections: ["Dinner ideas"],
  },
  {
    ...greens,
    shortcode: "DemoRcp0005",
    kind: "REEL",
    caption: "Creamy tomato soup, no cream.",
    hashtags: ["soup", "vegan"],
    savedDaysAgo: 34,
    tags: ["Recipes", "Weeknight"],
    collections: [],
  },
  {
    ...kitchen,
    shortcode: "DemoRcp0006",
    kind: "REEL",
    caption: "Sheet-pan gnocchi with whatever vegetables you have.",
    hashtags: ["sheetpan", "weeknight"],
    savedDaysAgo: 60,
    tags: [],
    collections: ["Dinner ideas"],
  },
  {
    ...greens,
    shortcode: "DemoRcp0007",
    kind: "POST",
    caption: "Overnight oats, four ways.",
    hashtags: ["breakfast", "mealprep"],
    savedDaysAgo: 95,
    tags: ["Recipes"],
    collections: [],
  },
  {
    ...kitchen,
    shortcode: "DemoRcp0008",
    kind: "REEL",
    caption: "The only pancake recipe you need.",
    hashtags: ["breakfast", "baking"],
    savedDaysAgo: 140,
    tags: [],
    collections: [],
  },
  {
    ...home,
    shortcode: "DemoHom0001",
    kind: "REEL",
    caption: "Renter-friendly shelf hack: no drilling.",
    hashtags: ["interior", "renterfriendly"],
    savedDaysAgo: 3,
    tags: ["Interior"],
    collections: ["Home"],
  },
  {
    ...rooms,
    shortcode: "DemoHom0002",
    kind: "POST",
    caption: "How to make a 20 m² studio feel twice as big.",
    hashtags: ["smallspaces", "interiordesign"],
    savedDaysAgo: 12,
    tags: ["Interior"],
    collections: ["Home"],
  },
  {
    ...home,
    shortcode: "DemoHom0003",
    kind: "REEL",
    caption: "Warm lighting in three steps.",
    hashtags: ["lighting", "cozyhome"],
    savedDaysAgo: 27,
    tags: ["Interior"],
    collections: ["Home"],
  },
  {
    ...rooms,
    shortcode: "DemoHom0004",
    kind: "REEL",
    caption: "Before and after: hallway storage.",
    hashtags: ["storage", "beforeandafter"],
    savedDaysAgo: 48,
    tags: [],
    collections: ["Home"],
  },
  {
    ...home,
    shortcode: "DemoHom0005",
    kind: "POST",
    caption: "Paint colours that work in north-facing rooms.",
    hashtags: ["paint", "interior"],
    savedDaysAgo: 77,
    tags: ["Interior"],
    collections: [],
  },
  {
    ...rooms,
    shortcode: "DemoHom0006",
    kind: "REEL",
    caption: "Plants that survive a dark bathroom.",
    hashtags: ["plants", "bathroom"],
    savedDaysAgo: 120,
    tags: [],
    collections: [],
  },
  {
    ...home,
    shortcode: "DemoHom0007",
    kind: "REEL",
    caption: "Thrifted chair makeover in an afternoon.",
    hashtags: ["diy", "upcycling"],
    savedDaysAgo: 210,
    tags: ["Interior"],
    collections: ["Home"],
  },
  {
    ...wander,
    shortcode: "DemoTrv0001",
    kind: "REEL",
    caption: "Three days in Lisbon on a budget.",
    hashtags: ["lisbon", "travel"],
    savedDaysAgo: 7,
    tags: ["Travel"],
    collections: ["Trips"],
  },
  {
    ...wander,
    shortcode: "DemoTrv0002",
    kind: "POST",
    caption: "Packing list for a week with only a backpack.",
    hashtags: ["packing", "carryon"],
    savedDaysAgo: 18,
    tags: ["Travel"],
    collections: ["Trips"],
  },
  {
    ...wander,
    shortcode: "DemoTrv0003",
    kind: "REEL",
    caption: "Quiet beaches near Split, before the crowds.",
    hashtags: ["croatia", "beaches"],
    savedDaysAgo: 41,
    tags: ["Travel"],
    collections: ["Trips"],
  },
  {
    ...wander,
    shortcode: "DemoTrv0004",
    kind: "REEL",
    caption: "Night train from Stockholm to Narvik.",
    hashtags: ["nighttrain", "slowtravel"],
    savedDaysAgo: 88,
    tags: [],
    collections: ["Trips"],
  },
  {
    ...wander,
    shortcode: "DemoTrv0005",
    kind: "POST",
    caption: "How I plan a trip in one evening.",
    hashtags: ["travelplanning"],
    savedDaysAgo: 160,
    tags: ["Travel"],
    collections: [],
  },
  {
    ...wander,
    shortcode: "DemoTrv0006",
    kind: "REEL",
    caption: "Street food tour in Taipei.",
    hashtags: ["taipei", "streetfood"],
    savedDaysAgo: 300,
    tags: ["Travel", "Recipes"],
    collections: ["Trips"],
  },
  {
    ...move,
    shortcode: "DemoWrk0001",
    kind: "REEL",
    caption: "10-minute mobility routine for desk days.",
    hashtags: ["mobility", "deskjob"],
    savedDaysAgo: 4,
    tags: ["Workouts"],
    collections: [],
  },
  {
    ...move,
    shortcode: "DemoWrk0002",
    kind: "REEL",
    caption: "Bodyweight workout, no equipment.",
    hashtags: ["homeworkout", "bodyweight"],
    savedDaysAgo: 15,
    tags: ["Workouts"],
    collections: [],
  },
  {
    ...move,
    shortcode: "DemoWrk0003",
    kind: "POST",
    caption: "Beginner running plan: 0 to 5 km.",
    hashtags: ["running", "beginner"],
    savedDaysAgo: 55,
    tags: ["Workouts"],
    collections: [],
  },
  {
    ...move,
    shortcode: "DemoWrk0004",
    kind: "REEL",
    caption: "Stretches for after a long walk.",
    hashtags: ["stretching"],
    savedDaysAgo: 190,
    tags: [],
    collections: [],
  },
  {
    ...misc,
    shortcode: "DemoMsc0001",
    kind: "REEL",
    caption: "Sketching people in cafés: quick tips.",
    hashtags: ["sketching", "drawing"],
    savedDaysAgo: 1,
    tags: [],
    collections: [],
  },
  {
    ...misc,
    shortcode: "DemoMsc0002",
    kind: "POST",
    hashtags: [],
    savedDaysAgo: 30,
    tags: [],
    collections: [],
  },
  {
    ...misc,
    shortcode: "DemoMsc0003",
    kind: "REEL",
    caption: "Watercolour skies in five minutes.",
    hashtags: ["watercolour", "art"],
    savedDaysAgo: 66,
    tags: [],
    collections: [],
  },
  {
    ...misc,
    shortcode: "DemoMsc0004",
    kind: "REEL",
    caption: "Bullet journal layout for the new month.",
    hashtags: ["journaling", "planning"],
    savedDaysAgo: 400,
    tags: [],
    collections: [],
  },
];

// Rows from an import that couldn't be read, shown in the import summary.
const SAMPLE_INVALID_COUNT = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

export type DemoRows = ReturnType<typeof buildDemoData>;

// Everything one demo user gets, with ids, ready to insert.
export function buildDemoData(userId: string, now: Date) {
  const id = () => crypto.randomUUID();
  const at = (daysAgo: number) => new Date(now.getTime() - daysAgo * DAY_MS);

  const tags = SAMPLE_TAGS.map((name) => ({
    id: id(),
    userId,
    name,
    nameKey: name.trim().toLowerCase(),
    createdAt: now,
  }));
  const tagId = new Map(tags.map((tag) => [tag.name, tag.id]));

  const collections = SAMPLE_COLLECTIONS.map((collection) => ({
    id: id(),
    userId,
    ...collection,
    createdAt: now,
  }));
  const collectionId = new Map(collections.map((c) => [c.name, c.id]));

  const posts = SAMPLE_POSTS.map((post) => ({
    id: id(),
    userId,
    shortcode: post.shortcode,
    url: `https://www.instagram.com/${post.kind === "REEL" ? "reel" : "p"}/${post.shortcode}/`,
    kind: post.kind,
    caption: post.caption ?? null,
    creatorUsername: post.creator,
    creatorName: post.creatorName ?? null,
    creatorUrl: null,
    hashtags: post.hashtags,
    fbid: null,
    savedAt: at(post.savedDaysAgo),
    noLongerSavedAt: null,
  }));

  const postTags = SAMPLE_POSTS.flatMap((post, index) =>
    post.tags.map((name) => ({
      postId: posts[index].id,
      tagId: tagId.get(name)!,
      createdAt: now,
    })),
  );

  const postCollections = SAMPLE_POSTS.flatMap((post, index) =>
    post.collections.map((name) => ({
      postId: posts[index].id,
      collectionId: collectionId.get(name)!,
    })),
  );

  const savedDates = posts.map((post) => post.savedAt.getTime());
  const imports = [
    {
      id: id(),
      userId,
      importedAt: at(1),
      earliestSavedAt: new Date(Math.min(...savedDates)),
      latestSavedAt: new Date(Math.max(...savedDates)),
      newCount: posts.length,
      duplicateCount: 0,
      invalidCount: SAMPLE_INVALID_COUNT,
    },
  ];

  return { tags, collections, posts, postTags, postCollections, imports };
}
