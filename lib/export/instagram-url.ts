export type PostKind = "POST" | "REEL";

export type PostLink = { kind: PostKind; shortcode: string; url: string };

const HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
  "m.instagram.com",
]);
// A Map, not an object: an object would also "find" inherited names like
// "constructor" in a link such as instagram.com/constructor/abc.
const KINDS = new Map<string, PostKind>([
  ["p", "POST"],
  ["reel", "REEL"],
  ["reels", "REEL"],
]);
// Shortcodes are case-sensitive, so they're kept exactly as written.
export const SHORTCODE = /^[A-Za-z0-9_-]+$/;

/**
 * Reads a post or reel link, such as `https://www.instagram.com/reel/AbC123/`,
 * and returns its shortcode with one normalized URL. Returns null for anything
 * else, like profile or story links.
 */
export function parsePostLink(link: string): PostLink | null {
  let url: URL;
  try {
    url = new URL(link.trim());
  } catch {
    return null;
  }
  if (!HOSTS.has(url.hostname)) return null;

  const [segment, shortcode] = url.pathname.split("/").filter(Boolean);
  const kind = KINDS.get(segment);
  if (!kind || !shortcode || !SHORTCODE.test(shortcode)) return null;

  const path = kind === "REEL" ? "reel" : "p";
  return {
    kind,
    shortcode,
    url: `https://www.instagram.com/${path}/${shortcode}/`,
  };
}

// Instagram usernames: letters, digits, "." and "_", at most 30 characters.
const USERNAME = /^[A-Za-z0-9._]{1,30}$/;

/**
 * Builds the profile link for a username, or returns null if it isn't a valid
 * Instagram username. Links are always built, never copied from the export,
 * so a manipulated file can't plant a foreign or `javascript:` link.
 */
export function profileUrl(username: string): string | null {
  return USERNAME.test(username)
    ? `https://www.instagram.com/${username}/`
    : null;
}
