// The demo's sample export: the two files Instagram's export would contain,
// built from the demo's sample saves. Demo users import it through the real
// import, and the import route checks their upload against it.

import type { Field } from "@/lib/export/export-schema";
import { parseExport } from "@/lib/export/parse-export";
import type { ExportTexts } from "@/lib/export/read-export-files";
import { buildUpload, type UploadBody } from "@/lib/import/build-upload";
import { SAMPLE_COLLECTIONS, SAMPLE_POSTS, sampleSavedAt } from "./sample-data";

/** A seeded save the sample leaves out, so the import flags it. */
export const SAMPLE_LEFT_OUT_SHORTCODE = "DemoMsc0003";

type NewSave = {
  shortcode: string;
  kind: "REEL" | "POST";
  creator: string;
  creatorName: string;
  caption: string;
  hashtags: string[];
  // Newer than every seeded save, and at least 12 hours old, so a browser
  // whose clock is behind doesn't see a save from the future.
  savedHoursAgo: number;
};

/** The new collection; only new saves are in it, so it adds one tag. */
const NEW_COLLECTION = {
  externalId: "demo-collection-weekend",
  name: "Try this weekend",
};

const NEW_SAVES: (NewSave & { inNewCollection: boolean })[] = [
  {
    shortcode: "DemoRcp0009",
    kind: "REEL",
    creator: "demo.kitchen",
    creatorName: "Demo Kitchen",
    caption: "Crispy rice salad with whatever's left in the fridge.",
    hashtags: ["leftovers", "salad"],
    savedHoursAgo: 12,
    inNewCollection: true,
  },
  {
    shortcode: "DemoHom0008",
    kind: "REEL",
    creator: "demo.homestudio",
    creatorName: "Home Studio",
    caption: "Hallway makeover for under €50.",
    hashtags: ["hallway", "budgetdecor"],
    savedHoursAgo: 14,
    inNewCollection: true,
  },
  {
    shortcode: "DemoMsc0005",
    kind: "REEL",
    creator: "demo.claycorner",
    creatorName: "Clay Corner",
    caption: "Throwing a mug on the wheel, start to finish.",
    hashtags: ["pottery", "ceramics"],
    savedHoursAgo: 16,
    inNewCollection: true,
  },
  {
    shortcode: "DemoTrv0007",
    kind: "REEL",
    creator: "demo.wanderer",
    creatorName: "Wanderer",
    caption: "Two days in Porto without a car.",
    hashtags: ["porto", "travel"],
    savedHoursAgo: 18,
    inNewCollection: false,
  },
  {
    shortcode: "DemoRcp0010",
    kind: "REEL",
    creator: "demo.greens",
    creatorName: "Green Plates",
    caption: "Three-bean chili for a crowd.",
    hashtags: ["chili", "batchcooking"],
    savedHoursAgo: 20,
    inNewCollection: false,
  },
  {
    shortcode: "DemoWrk0005",
    kind: "POST",
    creator: "demo.movement",
    creatorName: "Daily Movement",
    caption: "A 10-minute warm-up before any run.",
    hashtags: ["running", "warmup"],
    savedHoursAgo: 22,
    inNewCollection: false,
  },
];

const HOUR_MS = 60 * 60 * 1000;

/**
 * Stores text the way Instagram's export does: each UTF-8 byte as its own
 * character, e.g. "Ã¥" for "å". The parser repairs it, as for a real export.
 */
const exportText = (text: string) =>
  String.fromCharCode(...new TextEncoder().encode(text));

const seconds = (date: Date) => Math.floor(date.getTime() / 1000);

const postUrl = (kind: "REEL" | "POST", shortcode: string) =>
  `https://www.instagram.com/${kind === "REEL" ? "reel" : "p"}/${shortcode}/`;

const urlField = (url: string): Field => ({
  label: "URL",
  value: url,
  href: url,
});

/** A titled group of items, each holding its own fields. */
const group = (title: string, items: Field[][]): Field => ({
  title,
  dict: items.map((fields) => ({ title: "", dict: fields })),
});

type ExportPost = {
  shortcode: string;
  kind: "REEL" | "POST";
  creator: string;
  creatorName?: string;
  caption?: string;
  hashtags: string[];
  savedAt: Date;
};

/** One entry of saved_posts.json. */
function postEntry(post: ExportPost) {
  const owner: Field[] = [{ label: "Username", value: post.creator }];
  if (post.creatorName) {
    owner.push({ label: "Name", value: exportText(post.creatorName) });
  }
  const fields: Field[] = [urlField(postUrl(post.kind, post.shortcode))];
  if (post.caption) {
    fields.push({ label: "Caption", value: exportText(post.caption) });
  }
  fields.push(group("Owner", [owner]));
  fields.push(
    group(
      "Hashtags",
      post.hashtags.map((tag) => [{ label: "Name", value: `#${tag}` }]),
    ),
  );
  return { timestamp: seconds(post.savedAt), media: [], label_values: fields };
}

/**
 * Builds the sample's two export files for one demo.
 *
 * @param anchor - When the demo started, from `demoAnchor`.
 * @returns The text of saved_posts.json and saved_collections.json.
 */
export function sampleExportFiles(anchor: Date): {
  posts: string;
  collections: string;
} {
  const kept = SAMPLE_POSTS.filter(
    (post) => post.shortcode !== SAMPLE_LEFT_OUT_SHORTCODE,
  );
  const posts = [
    ...kept.map((post) =>
      postEntry({ ...post, savedAt: sampleSavedAt(anchor, post.savedDaysAgo) }),
    ),
    ...NEW_SAVES.map((save) =>
      postEntry({
        ...save,
        savedAt: new Date(anchor.getTime() - save.savedHoursAgo * HOUR_MS),
      }),
    ),
    // Two saves that can't be read: one without a link, and one whose link
    // is a profile, not a post.
    {
      timestamp: seconds(anchor) - 13 * 60 * 60,
      media: [],
      label_values: [
        group("Owner", [[{ label: "Username", value: "demo.lostlink" }]]),
      ],
    },
    {
      timestamp: seconds(anchor) - 15 * 60 * 60,
      media: [],
      label_values: [urlField("https://www.instagram.com/demo.someone/")],
    },
  ];

  const links = (shortcodes: { kind: "REEL" | "POST"; shortcode: string }[]) =>
    group(
      "Media",
      shortcodes.map((post) => [urlField(postUrl(post.kind, post.shortcode))]),
    );
  const collections = [
    ...SAMPLE_COLLECTIONS.map(({ externalId, name }) => ({
      fbid: externalId,
      name,
      posts: kept.filter((post) => post.collections.includes(name)),
    })),
    {
      fbid: NEW_COLLECTION.externalId,
      name: NEW_COLLECTION.name,
      posts: NEW_SAVES.filter((save) => save.inNewCollection),
    },
  ].map((collection) => ({
    timestamp: seconds(anchor),
    fbid: collection.fbid,
    media: [],
    label_values: [
      { label: "Name", value: exportText(collection.name) },
      { label: "Type", value: "Collection" },
      links(collection.posts),
    ],
  }));

  return {
    posts: JSON.stringify(posts),
    collections: JSON.stringify(collections),
  };
}

/**
 * The upload the browser sends after reading the sample export: the same
 * parsing and upload code as a real import.
 *
 * @param anchor - When the demo started, from `demoAnchor`.
 * @returns The upload, before compression.
 * @throws If the sample doesn't parse, which would be a bug in this file.
 */
export function expectedSampleUpload(anchor: Date): UploadBody {
  const files: ExportTexts = sampleExportFiles(anchor);
  const parsed = parseExport(files, anchor);
  if (!parsed.ok)
    throw new Error(`The sample export is broken: ${parsed.error}`);
  return buildUpload(parsed.export);
}
