# Reelbox – Research & Decisions

_Last updated: 2026-11-03 (decisions from #4, #5, #7, #8, #10, #25, #31 and #34; risks from #7, #8, #10, #24, #31 and #34)_

Reelbox is a portfolio web app that helps people who save lots of Instagram reels for inspiration organize their saves, using the official Instagram data export.

---

## Decisions so far

| Area | Decision |
| --- | --- |
| Audience | People who save lots of reels/posts for inspiration |
| Core value | Organizing saves (Notion export is a later feature) |
| Input | Official Instagram "Download your information" export, **Saved** only, **JSON** |
| Organizing (MVP) | Manual tags + suggestions from creator and Instagram collections |
| Organizing (v2) | AI categorization |
| Duplicates | Dedupe by post shortcode; DB unique constraint on `(user_id, shortcode)`; re-import never overwrites tags |
| Import records | Store `imported_at`, `earliest_saved_at`, `latest_saved_at`, `new_count`, `duplicate_count`, `invalid_count` |
| Unsaved posts | Keep them; flag "No longer saved on Instagram" only if the post's saved date is inside the new import's range. Details under "No longer saved" (#9) |
| Auth | Passwordless email codes + demo account for recruiters |
| Auth library | Better Auth (#5): Auth.js is in maintenance mode and points new projects to Better Auth. Two defaults changed: codes are stored hashed, and rate limits are kept in Postgres because serverless instances don't share memory |
| Email service | Gmail SMTP from a dedicated projects account, with an app password per project (#34). Replaces Brevo (#5), which sends from its shared `brevosend.com` domain when the sender has no domain of its own; Spamhaus listed that domain and the emails bounced. A domain would fix it but isn't free. Resend only emails your own address until a domain is verified |
| ORM | Prisma 7 on the plain `pg` driver (#4): familiar, type-safe queries and versioned SQL migrations, while the app stays plain Postgres and portable |
| Database pool | 10 s connection timeout, idle connections kept 4 minutes, TCP keep-alive (#34). Prisma 7 uses `pg`'s defaults, which have no connection timeout and close idle connections after 10 s; Prisma 6 had a 5 s timeout and 300 s idle. Measured on the dev branch: reconnecting after 15 s idle went from 820 ms to 104 ms, and a stalled connection now fails after 10 s instead of hanging. Idle connections are kept less than 5 minutes because Neon suspends then and closes them anyway |
| Hosting region | Functions in Frankfurt (`fra1`), next to the Neon database (#25): Vercel's default, Washington D.C., put ~90 ms on every query. Starting the demo went from 3.7 s to 0.28 s |
| Export input | The ZIP or the two JSON files, read in the browser. Only `saved_posts.json` and `saved_collections.json` are unpacked, so messages and the rest never leave the device; the JSON files are also too large for one serverless request (#7) |
| ZIP library | fflate: small, no dependencies (#7) |
| Export parsing | Meta's `label_values` format, validated per entry with Zod. Broken entries are reported with a reason instead of failing the whole import; text is re-read as UTF-8 to repair Meta's encoding bug (#7) |
| Links from the export | Post and profile links are rebuilt from the shortcode and username, never copied, so a manipulated file can't plant a foreign or `javascript:` link (#7) |
| Saved dates | Only dates from Instagram's launch (6 Oct 2010) to one day in the future; a fake date would stretch the range that decides "no longer saved" (#7) |
| Posts only in a collection | Reported as invalid: they have no saved date, which the "no longer saved" rule needs (#7). Importing them with an unknown saved date is planned in #39 |
| Import upload | The browser parses the export and sends only the saves and collections as gzip-compressed JSON (`application/gzip`), unpacked by the route itself so it can stop at 20 MB unpacked. A real export of about 2,200 saves is 2.05 MB as JSON and 0.72 MB compressed (#8) |
| Import validation | The route checks the upload again with Zod, with limits on every list and text, and rebuilds every link; the browser's parsing is never trusted (#8) |
| Import size limit | Vercel accepts requests up to 4.5 MB, about 13,000 saves compressed. The browser checks the size before sending, and a larger export gets a message asking for a shorter date range. The 20,000-save limit stays as the server's own bound (#8) |
| Import transaction | One interactive Prisma transaction with a 30 s timeout; rows are inserted in batches of 1,000, one after another, since the transaction uses a single connection. A failure leaves nothing behind (#8) |
| Collections as tags | Each Instagram collection becomes a tag, matched by name without case. Only new posts get collection tags, so a re-import never changes existing tags; a collection tag the user deleted or renamed may come back on new posts, accepted to avoid a schema change (#8) |
| Parallel imports | The unique constraints stop the second of two imports at once, and it answers 409 "Another import is still running". Detecting this in `saveImport` itself is #38 (#8) |
| Import tests | The import's logic is a pure function (`buildImport`) tested without a database; the thin database layer was checked by hand against the development branch (#8) |
| No longer saved | A post the user already has is flagged when it's missing from the new export and its saved date is inside the export's range: from the first to the last saved time, both included, the same range the `imports` row stores. A post that's already flagged keeps the time it was first flagged; the flag time is the import's own, and only unflagged posts are flagged, so two identical re-imports at once keep the first time. The rules live in `buildImport` and are unit tested; `saveImport` applies them in the import's transaction, in batches of 1,000 (#9) |
| Unreadable saves | An entry the browser couldn't read (e.g. no saved date) still shows the post is saved, so it's never flagged and an earlier flag is cleared; its saved date stays. The browser sends their shortcodes, only for links to posts, at most one per unreadable save (checked against the upload's unreadable count), so a long link that isn't a post can't fail the import (#50). Pages loaded before that still send raw links, which the route turns into shortcodes, dropping anything else. Both fields are optional, so a page loaded before either existed can still import (#9) |
| Saved again | A post that's in the export again loses its flag and takes the export's saved date, since unsaving and saving again on Instagram gives it a new date. Tags are never touched. Dates are updated one post at a time: usually a handful, and older exports change none (#9) |
| Older exports | An export whose newest save is older than the newest save of any earlier import, e.g. a ZIP picked by mistake, still adds new posts but never flags, clears or re-dates: it says nothing about what's saved now. Found in code review (#9) |
| No longer saved badge | Words plus a lucide `BookmarkX` icon, in the neutral `badge` color, not a warning color: the save is still in the library. It sits just above "Open on Instagram", pinned to the bottom with the link, so the rows above line up with cards that have no badge. Chosen over "under the date", which pushed the tags down on flagged cards only. The import summary says how many saves were flagged, and that they stay with their tags (#9) |
| Re-import testing | Checked by hand with a changed copy of a real export in `/private/`, never committed: 3 saves removed, 1 save's date removed and 1 save's date moved, picking only saves in no collection (a save listed in a collection but missing from saved posts counts as unreadable). Read-only queries confirmed 3 flags, the moved date, a repeated import keeping the first flag time, and re-importing the original clearing everything (#9) |
| Demo and import | Demo accounts can't import their own export: their data is deleted after a day, so real data doesn't belong there (#8). They can try the real import with a sample export instead: built in the browser from the demo's sample saves, read and uploaded like a real one. The route accepts a demo user's upload only if it equals the sample built for that demo, date for date, so nothing else gets in. The seed and the sample date everything from the demo's creation time rounded to a whole second, because export dates are whole seconds. The sample shows every part of the summary: new saves, saves already there, 2 that can't be read, a collection that becomes a tag, and one save left out so it's flagged (#42) |
| Saves pagination | 24 saves per page, newest first, with **Load more**. A cursor (the last save's saved date and id) instead of skipping rows, so saves imported meanwhile don't repeat cards; the id decides between saves with the same date. Tested by paging through an in-memory library with tied dates (#10) |
| Load more | A Server Action called from the grid appends the next page and moves focus to its first card. It checks the session and the cursor itself, like an API route; a bad cursor is an error, never the first page again (#10) |
| Dates on cards | Formatted in the browser's time zone (`useSyncExternalStore`): the server renders UTC, the browser renders again with its own zone, so dates near midnight may change once while the page loads. Chosen over always-UTC (off by a day near midnight) and a time-zone cookie (more code) (#10) |
| Date format | Months are the app's own three-letter names: recent `Intl` data writes September as "Sept" in `en-GB`, unlike the wireframes (#10) |
| No thumbnails | The export has no images. Reading them from post pages is scraping; oEmbed needs a Meta app and review; embeds load Instagram's scripts on every card. Cards show the save's kind as a small icon and word instead, with the caption and creator (#10, #41) |
| Demo links | The demo's saves are invented, so their cards say "Sample save, not on Instagram" instead of linking to a post that doesn't exist (#10). The same goes for the creator: `@username` is plain text in the demo (#41) |
| Card layout | Caption first on screen, but the HTML starts with the creator heading (display name, or the username as plain text when there's none or it's empty), so screen readers can jump card to card by heading. CSS `order` moves the kind and caption up; nothing among them can be focused, so the Tab order is unchanged (#41) |
| Card captions | Plain text, cut after 3 lines with `-webkit-line-clamp`. The server sends at most 300 characters, counted as whole characters so emoji aren't cut in half, and cut at a word when there's a space in the last fifth: CSS only hides the rest, so screen readers would otherwise read up to 5,000 characters per card. Line breaks become spaces so blank lines don't use up the 3 lines (#41) |
| Card alignment | The caption always takes 3 lines, even when short or missing, so the creator, date and tags sit in the same place on every card. The `@username` row is always there and 44 px tall, also as plain text in the demo, and the loading skeleton has the same rows and frame (shared in `styles/_save-card.scss`). Chosen over lining up only cards in the same row (`subgrid`), which moves things from row to row (#41) |
| Profile links | `@username` links to the creator's profile in a new tab, 44 px tall, with hidden text saying where it goes. The link comes from the stored `creatorUrl`, which the import rebuilds from the username (#41) |
| Save page | Tags are managed on the save's own page, `/saves/[id]`, as in the locked wireframe. An id that isn't a UUID or isn't one of the user's saves gets the same "Save not found" page, so it never reveals whether another user's save exists; the id is checked before the query, since Postgres refuses a malformed UUID with an error. With `loading.tsx` streaming the page, Next sends that page with status 200 instead of 404, accepted since these pages aren't indexed (#11) |
| Card link | The card's heading links to the save's page, and its `::after` stretches over the whole card, so tapping anywhere opens it; the profile and Instagram links sit above it with `z-index`. Hidden text adds ", edit tags" to the name. The card gets the focus ring and a darker border on hover through `:has()`, the border only where hover exists. Chosen over a separate "Edit tags" link (one more stop per card when tabbing) and making the whole card a link (links can't contain links) (#11) |
| Link underlines | Links are underlined 1 px, 1.5 px on hover with the color going to ink, as the `$underline` and `$underline-hover` tokens; the color change alone was too faint. Text buttons and the import summary's toggle use the same (#11) |
| Tag names | Trimmed, 1 to 30 characters counted as whole characters, so an emoji counts as one. One tag per name regardless of case (the existing `nameKey`): adding "recipes" when "Recipes" exists reuses it and keeps its name. Checked in the browser for quick messages and again in the Server Function (#11) |
| Long tags | The 30-character limit is for new tags only. Tags made from Instagram collections keep the collection's full name, up to 500 characters (`MAX_IMPORTED_TAG_LENGTH`, also the import's limit for collection names), and an existing tag of that length can be added to other saves by tapping it, typing its name or Undo. `addTag` looks the tag up by its key first and only checks the limit when it creates one: one extra lookup per add, on the unique index. Chosen over cutting collection names to 30 characters on import, which would change the user's tag names and leave long tags from earlier imports unusable (#61) |
| Tag saving | Server Functions (`addTag`, `removeTag`) that check the session, the input and that the save is the user's, like an API route. The tag is found or created in one upsert, so two quick adds can't create it twice. Removing a tag from a save keeps the tag itself, even on no saves, so it's still offered and can be filtered by; deleting tags belongs with renaming them (#11) |
| Instant tag changes | Chips appear and disappear at once (`useOptimistic`) and the server saves in the background; a failed save puts them back with a message. Chosen after measuring waiting for the server: about 40 ms per query from Frankfurt, but the session check, the save, the page's new data and a dev-mode render made each change feel slow, and the first query after Neon's idle suspend took 725 ms (#11) |
| Offered tags | Below the tag field: the 6 tags on the most saves until something is typed, with "Show all" for the rest, then up to 6 tags containing the text, those starting with it first. Tags on the save are left out. Chosen over a `<datalist>`, which the browser draws itself and can't be styled, and over a custom dropdown, which is much harder to make work with screen readers (#11) |
| Undo | Removing a tag is instant, with "Removed <name>" and Undo in a toast instead of a confirmation. The toast has no timer, so nobody has to race to read it or reach the button; the next change replaces it, so only the last removal can be undone. A × hides it, since it's pinned over the bottom of the page and would otherwise cover what's there; a failed undo shows it again. Its `role="status"` region is always in the page, since screen readers only announce changes to a region that was already there. Undo comes last in the tab order, after the field and the offered tags: accepted for now, since focus stays among the tags after a removal and moving it to the toast would pull it away from them (#11) |
| Tag suggestions | On a save's page, above the most used tags: the user's tags on the same creator's other saves (most used first) and tags named after the save's collections, under a heading saying where each group comes from, at most 6 per group. Collection suggestions also cover saves added to a collection after their first import, which the import doesn't tag. Left out: tags already on the save, a tag both sources suggest (shown once, under the creator), and ignored ones. Ignoring is remembered per save in `ignored_suggestions`, by name key, since a collection's suggestion may not be a tag yet. A new tag named after one of the save's collections may be longer than 30 characters, like the ones the import makes. Worked out on the server, so the browser never gets the user's other saves. Left as they are after code review: the page loads the save before its suggestions, one extra round trip of a few milliseconds with the database in the same region; and an ignore isn't checked against the current suggestions, since a user can only add rows to their own saves, which are deleted with them (#13) |
| Tag filter in the URL | `/saves?tag=recipes` uses the tag's `nameKey`, so links are readable and match whatever the case; `/saves?untagged=1` is its own parameter, so a tag named "untagged" can't clash. One tag at a time; the tag wins if both are given. Zod reads the URL, and anything malformed (empty, longer than 1,000 characters, repeated) shows all saves instead of an error. The key's limit isn't the 30 characters of a typed tag: tags made from Instagram collections can be up to 500, and lowercasing can make a key longer than its name. Found in code review. A well-formed tag the user doesn't have stays a filter and gets the empty state, so a shared link never shows someone else's tag: every query is scoped to the user (#12) |
| Filter chips | A row of links above the grid: All, Untagged, then the user's tags A–Z with counts. Links instead of a dropdown: the filter lives in the URL without client code, survives a reload and can be shared, and all tags are visible at once. The row scrolls sideways on mobile and wraps from tablet up. The current chip has `aria-current="page"`, amber fill and a check mark, not color alone. Tags on no saves are hidden unless they're the current filter, and the row is hidden while no tag is on a save (#12) |
| Filtered grid | `listSaves` takes the filter, combined with the cursor under `AND` so neither can overwrite the other's `OR`. "Load more" sends the filter back, and the Server Action checks it again; a bad filter is an error, never all saves. The grid is keyed by the filter, so changing it starts a fresh list. The count line ("12 saves tagged Recipes") comes from counts the page already loads, with no extra query. Adding or removing a tag calls `revalidatePath("/saves", "layout")` instead of `refresh()`, which also drops the browser's copies of visited saves pages, so going back to a filtered grid doesn't show it as it was before the change. Found in code review (#12) |
| Back to saves | A card links to its save's page with the grid's filter in the URL (`/saves/<id>?tag=recipes`), and "Back to saves" reads it back, so it returns to the same filtered grid. A small client component with `useSearchParams`, since the not-found page gets no search params. Found in code review (#12) |
| Empty filter | When nothing matches, the grid is replaced by "No saves tagged <name>" or "Every save has a tag", with a "Show all saves" button. The tag is named as the user wrote it, or as in the URL for a tag they don't have (#12) |
| Tag keys | `nameKey` only trims and lowercases, so "my  tag" and "my tag", or "café" written in two Unicode forms, are still separate tags. Normalizing them needs a migration that merges tags, so it's #58 (#12) |
| Google fonts in builds | Next 16.3 broke `next dev` and `next build` when Google Fonts answered with `/l/font?kit=…&skey=…` URLs, which happens on and off. Upgraded to 16.4.6 (fixed in 16.4.3). Builds still download the font from Google, so a Google outage can still fail one; hosting the font in the repo with `next/font/local` is the fallback (#41) |
| Sessions | Stored without IP address or browser; expired sessions deleted on sign-in (#31) |
| Privacy policy | Static pages; the durations they state come from the app's settings, checked by a test (#31) |
| Stack | Next.js (one fullstack app) + TypeScript, Postgres on Neon, Zod, Vitest + Playwright, Vercel |
| Styling | Sass (SCSS modules), mobile-first, shared variables + breakpoint mixin |
| Design (locked 2026-10-02) | Low-fi wireframes: 12 screens (10 mobile, 2 desktop) incl. empty, loading, error states. Design system "Saves Organizer" (to be renamed Reelbox): slate neutrals (#313E50, #3A435E, #455561, #5C6672, #6C6F7F) + amber accent #F2A541 (always ink text on it; links use #8A4B08), IBM Plex Sans, 4px spacing grid, no shadows. Changes after lock = new issue with a reason. |
| Out of scope | Scraping, auto-unsave, live Instagram sync |

## Roadmap

Versions follow semantic versioning: `MAJOR.MINOR.PATCH`. Each version = a GitHub milestone; each feature = an issue.

### v1.0 – MVP

1. Sign in with email code / demo login
2. Upload export → see import summary (date range, new / duplicate / invalid counts)
3. Browse saves in a grid with creator and date
4. Add/remove tags; filter by tag
5. Tag suggestions (by creator, by Instagram collection)
6. "No longer saved on Instagram" badge
7. Demo: try the import with a sample export (#42)

### v1.x – Useful, can wait

- Search
- Bulk tagging

### v2.0 – Future possibilities

- AI categorization
- Notion export

### Rejected for now

- Scraping / unofficial Instagram API
- Auto-unsave on Instagram
- Live Instagram sync

### New feature ideas (unsorted)

- _Add ideas here, then triage into a version or "Rejected"_

## Open questions

- [x] Real export format: inspected my own export (#4). `saved_posts.json` and `saved_collections.json` hold post URLs (shortcode from `/reel/…` or `/p/…`), creator, saved date, collections and Meta's ids. Text has broken encoding (emoji and letters like "å" arrive as mangled bytes) and needs re-reading as UTF-8
- [x] Are captions/hashtags in the export? **Yes**, both are included (#4)
- [x] Auth library with email-code support: Better Auth (#5)
- [x] Email-sending service and its free-tier limits: Brevo (#5), free plan 300 emails per day; replaced by Gmail SMTP (#34), about 500 emails per day, shared by all projects on the account
- [x] ORM choice: Prisma (#4)
- [ ] Vercel Hobby terms (believed non-commercial only)

## Risks

- Export format differs from expectations or changes later → validate with Zod, clear error messages; the parser accepts unknown fields, but Meta's older format (`string_map_data`) isn't supported and is rejected with a clear message (#7)
- Neon cold start on first demo visit → loading state. Waking after 5 minutes idle measured at about 1.5 s on the dev branch (#34)
- In development, the first visit to a page right after its code changes can hang on the loading state while Next compiles it; a reload fixes it. Not seen with a production build (#10)
- Vercel freezes idle function instances, so a kept connection can be dead when the instance wakes, and the query fails with "Connection terminated unexpectedly" → keep-alive for now (#34); if it shows up in production, retry once on that error. Vercel's `attachDatabasePool` would fix it too, but ties the app to Vercel
- Email codes landing in spam → demo account as fallback
- Exports above about 13,000 saves don't fit in one request (Vercel's 4.5 MB limit) → the page explains it before sending and asks for an export with a shorter date range; splitting large uploads can come later if real users hit it (#8)
- Imports are heavy database work: each one holds a connection for its whole transaction → fair-use limits per user are planned in #37 (#8)
- Sign-in emails reach the Gmail inbox with SPF, DKIM and DMARC passing, but some security extensions (e.g. NordVPN Threat Protection) may still flag them → #24 found that Brevo adds an open-tracking image, a likely trigger (not confirmed). It can't be removed on the free plan, so tracking is set to anonymous and the privacy policy explains it (#31). Revisit with an email provider that allows turning tracking off → resolved by Gmail SMTP (#34), which adds no tracking
- Shared sending domains carry other senders' reputation: on 2026-10-27 every sign-in email bounced with `550 12361222.brevosend.com listed in Spamhaus DBL`. Spamhaus had listed all of `brevosend.com` as a phishing domain (DBL code `127.0.1.4`), so every Brevo sender without their own domain was blocked. Brevo accepts the email before the bounce, so the app still showed "code sent" → switch to Gmail SMTP (#34); the demo login still works without email
- Anyone can request sign-in codes for any address: the per-IP rate limit protects one inbox from one sender, but a coordinated attempt from many IPs could use up the Gmail quota (about 500 emails per day, shared by all projects on the account; going over blocks sending for up to a day) → per-email limit in #27
- The Gmail app password can read and send all email in the projects account → dedicated account, one app password per project so each can be revoked alone; stored only in `.env` and Vercel

---

## Key research findings

- **No API for saves:** the Instagram Graph API only serves Business/Creator accounts and has no saved-posts endpoint.
- **Export is the legal input:** the JSON export contains `saved_posts.json` and `saved_collections.json`.
- **Captions and hashtags are in the export** (verified in #4, contrary to earlier sources): this makes tag suggestions much better. The export's text encoding is broken and must be repaired before storing.
- **Real export format (#7):** a list of labelled fields per post (`label_values`), with Owner, Hashtags and Brand partner as nested groups. About 7 MB per file for 2,200 saves, which is above Vercel's 4.5 MB request limit, so parsing happens in the browser.
- **Import timing (#8):** on a preview deployment in `fra1`, a first import of 2,179 saves (55 collections as tags) took 2.3 s on the server, and re-importing the same export 1.4 s. The upload was 0.72 MB. The transaction's limit is 30 s, so there is room for exports several times larger.
- **No auto-unsave:** bulk-unsave tools use browser automation (ToS risk).
- **Neon over Supabase for the demo:** Supabase free projects pause after 1 week and need manual restore; Neon wakes on the next request.

---

## Sources

### Instagram API

| Source | Type | What it tells us |
| --- | --- | --- |
| [WP Social Ninja: Instagram Graph API guide 2026](https://wpsocialninja.com/instagram-graph-api/) | Fact (secondary) | Graph API is the only supported route; personal accounts have no API access. |
| [Zernio: Instagram Graph API 2026](https://zernio.com/blog/instagram-graph-api) | Fact (secondary) | API is for your own account's data via consent; no endpoint for saves. |
| [DEV: How to Use Instagram Graph API in 2026](https://dev.to/apilover/how-to-use-instagram-graph-api-in-2026-2762) | Fact (secondary) | Business and Creator accounts get access; personal accounts must convert. |

### Instagram data export

| Source | Type | What it tells us |
| --- | --- | --- |
| [instagram-to-sqlite (GitHub)](https://www.github.com/gavindsouza/instagram-to-sqlite) | Fact (file list) | Export's `saved` folder contains `saved_collections.json` and `saved_posts.json`. |
| [instagram-saved-mcp (PyPI)](https://pypi.org/project/instagram-saved-mcp/) | Claim to verify | Export holds saved URLs and collections; tool "enriches" posts from public pages, suggesting captions are missing. |
| [ig2raindrop-cli (PyPI)](https://pypi.org/project/ig2raindrop-cli/) | Fact (how-to) | Request path: Settings → Your Activity → Download Your Information, format JSON. |

### Clearing / unsaving

| Source | Type | What it tells us |
| --- | --- | --- |
| [RFG Creative: unsave all saved posts](https://rfgcreative.com/misc/how-to-unsave-all-saved-posts-on-instagram-at-once.html) | Claim to verify | Says iPhone has "select all"; Android is one by one. |
| [Unsave all Instagram posts + tips](https://erpstaging.fha.gov.ng/?p=35167) | Claim (low-quality site) | No direct "unsave all"; API has no bulk actions. |
| [InstaUnsave-Turbo (Firefox)](https://firefox.marketplace.browsertotal.com/fr/firefox/addon/instaunsave-turbo/) | Example | Bulk unsave via DOM manipulation. |
| [Unsave All – Bulk Remove (Chrome)](https://chromeboard.com/extension/unsave-all-—-bulk-remove-fojiknjgjiegeeibbiaoppjehddeeilc) | Example | Freemium extension; exports removed saves. |
| [UnSaveAll (iOS)](https://apps.apple.com/app/unsaveall/id6761158798) | Example | iPhone app for bulk unsaving. |

### Similar tools & competitors

| Tool | Input | What it does | Gap we fill |
| --- | --- | --- | --- |
| [ig2raindrop-cli](https://pypi.org/project/ig2raindrop-cli/) | Export JSON or unofficial login | Imports saves into Raindrop.io | CLI only; no tagging UI |
| [instagram-saved-mcp](https://pypi.org/project/instagram-saved-mcp/) | Export ZIP | Local searchable library for AI assistants | Developer setup; no visual browsing |
| [instagram-to-sqlite](https://www.github.com/gavindsouza/instagram-to-sqlite) | Export JSON | Loads export into SQLite | Chat data only |
| [4K Stogram](https://www.4kdownload.com/products/stogram-8) | Desktop app, account login | Downloads posts, reels, captions, saved posts | Support discontinued (last version May 2024); downloads, doesn't organize |

Meta's "Transfer a copy of your information" destinations (Google Drive, Dropbox, Google Photos, etc.) only copy your own posts or dump raw files. None organize saves. Also a competitor: Instagram's own collections, or a spreadsheet of links.

### Stack & hosting

| Source | Type | What it tells us |
| --- | --- | --- |
| [Supabase pricing](https://Supabase.io/pricing) | Fact (primary) | Free projects pause after 1 week of inactivity. |
| [Automation Atlas: Supabase free tier 2026](https://automationatlas.io/answers/supabase-free-tier-limits-2026/) | Fact (secondary) | Paused project is unreachable until restored manually. |
| [Neon pricing](https://neon.com/pricing) | Fact (primary) | Free: 100 CU-hours, 0.5 GB per project; scales to zero after 5 min. |
| [Neon: no minimum charge FAQ](https://neon.com/faqs/postgres-services-no-minimum-charge) | Fact (primary) | Standard Postgres; free plan details. |
| [selfhost.dev: Neon pricing](https://selfhost.dev/blog/neon-pricing-cost-of-serverless-postgres/) | Fact (secondary) | No credit card needed; compute resumes on next query. |

### Naming & trademark

| Source | Type | What it tells us |
| --- | --- | --- |
| [TechCrunch: Instagram cracks down on apps using "Insta" and "Gram"](https://techcrunch.com/2013/08/19/instagram-cracks-down-on-connected-apps-using-insta-and-gram/amp/) | Fact (secondary, 2013) | Instagram's brand guidelines bar third-party apps from using "Insta"/"Gram" in their names. |
| [Martech: Instagram deterring "Insta"/"Gram" in brand names](https://martech.org/instagram-deterring-app-developers-from-using-insta-or-gram-in-names) | Fact (secondary, 2013) | Same policy; developers were asked to rename. |

Open question: check Meta's current brand resources page for wording rules before launch.

### To add later

- [ ] Meta's official Instagram Platform docs
- [ ] Instagram Help Center: "Download your information"
- [ ] Notion API docs (v2 feature)
- [ ] Anonymized sample of my own `saved_posts.json` (parser test fixture)
