# Reelbox

Web app for people who save lots of Instagram reels for inspiration: upload Instagram's official data export, then tag, filter and find your saves.

## Context

- Decisions, roadmap, risks and sources: `docs/research.md`
- Issues and acceptance criteria: [project board](https://github.com/users/fridavbg/projects/4) (`gh issue view <number>`)

## Stack

- Next.js (App Router) + TypeScript (strict), one fullstack app
- Postgres on Neon; Zod for validation at every boundary
- Sass: SCSS modules (`*.module.scss`), mobile-first, shared `_tokens.scss` + `respond-to` breakpoint mixin
- Vitest (unit) + Playwright (end-to-end); GitHub Actions CI
- Hosted on Vercel, kept portable (no vendor-only services); free-tier infrastructure only
- To decide in their issues: auth library (email codes), email service, ORM

## Product rules

- Input is the official Instagram data export only. No scraping, unofficial APIs, Instagram login or auto-unsave.
- The product name never uses "Instagram", "Insta" or "Gram".

## Data rules

- Posts are deduplicated by shortcode, with a unique constraint on `(user_id, shortcode)`.
- Re-imports never change a user's tags.
- An import is all-or-nothing (one transaction).
- A post is flagged "no longer saved" only if its saved date is inside the new import's date range.
- Every query is scoped to the signed-in user.

## UI rules

- Use design tokens only; no hard-coded colors in components. Design changes need an issue.
- Amber accent (`accent`) always has ink text; links use `accent-strong`.
- Every view has empty, loading, success and error states.
- Accessibility: semantic buttons, links and labels; 44px touch targets; 4.5:1 text contrast; state is never shown by color alone.

## Security and privacy

- No secrets in the repo: `.env` is gitignored, `.env.example` documents variables.
- Real export data lives in `/private/` (gitignored) and is never committed; tests use an anonymized fixture.

## Workflow

- One issue at a time, on a branch named after it (e.g. `parse-and-validate-the-instagram-export`).
- Small commits referencing the issue: `feat: parse saved posts (#7)`.
- Lint and tests must pass before merging.
