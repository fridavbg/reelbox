const utf8 = new TextDecoder("utf-8", { fatal: true });

/**
 * Repairs text from Instagram's export, which stores each UTF-8 byte as its
 * own character, for example "Ã¥" instead of "å". Works for any language and
 * for emoji. Text that isn't affected is returned unchanged.
 */
export function fixEncoding(text: string): string {
  // Affected text only uses characters up to U+00FF, with some above U+007F.
  if (!/[\u0080-\u00ff]/.test(text) || /[^\u0000-\u00ff]/.test(text)) {
    return text;
  }
  const bytes = Uint8Array.from(text, (char) => char.charCodeAt(0));
  try {
    return utf8.decode(bytes);
  } catch {
    // Not valid UTF-8, so it was real Latin-1 text like "café".
    return text;
  }
}
