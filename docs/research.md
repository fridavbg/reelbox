# Reelbox – Research & Decisions

_Last updated: 2026-10-10 (decisions from #4, #5 and #25; risks from #24 and #31)_

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
| Unsaved posts | Keep them; flag "No longer saved on Instagram" only if the post's saved date is inside the new import's range |
| Auth | Passwordless email codes + demo account for recruiters |
| Auth library | Better Auth (#5): Auth.js is in maintenance mode and points new projects to Better Auth. Two defaults changed: codes are stored hashed, and rate limits are kept in Postgres because serverless instances don't share memory |
| Email service | Brevo (#5): free, and sends from a verified personal address without owning a domain. Resend only emails your own address until a domain is verified |
| ORM | Prisma 7 on the plain `pg` driver (#4): familiar, type-safe queries and versioned SQL migrations, while the app stays plain Postgres and portable |
| Hosting region | Functions in Frankfurt (`fra1`), next to the Neon database (#25): Vercel's default, Washington D.C., put ~90 ms on every query. Starting the demo went from 3.7 s to 0.28 s |
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
- [x] Email-sending service and its free-tier limits: Brevo (#5), free plan 300 emails per day, shared by marketing and transactional emails
- [x] ORM choice: Prisma (#4)
- [ ] Vercel Hobby terms (believed non-commercial only)

## Risks

- Export format differs from expectations or changes later → validate with Zod, clear error messages
- Neon cold start on first demo visit → loading state
- Email codes landing in spam → demo account as fallback
- Sign-in emails reach the Gmail inbox with SPF, DKIM and DMARC passing, but some security extensions (e.g. NordVPN Threat Protection) may still flag them → #24 found that Brevo adds an open-tracking image, a likely trigger (not confirmed). It can't be removed on the free plan, so tracking is set to anonymous and the privacy policy explains it (#31). Revisit with an email provider that allows turning tracking off
- Anyone can request sign-in codes for any address: the per-IP rate limit protects one inbox from one sender, but a coordinated attempt from many IPs could use up the free Brevo quota (300 emails per day) → per-email limit in #27

---

## Key research findings

- **No API for saves:** the Instagram Graph API only serves Business/Creator accounts and has no saved-posts endpoint.
- **Export is the legal input:** the JSON export contains `saved_posts.json` and `saved_collections.json`.
- **Captions and hashtags are in the export** (verified in #4, contrary to earlier sources): this makes tag suggestions much better. The export's text encoding is broken and must be repaired before storing.
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
