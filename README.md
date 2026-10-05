# Reelbox

A web app for people who save lots of reels for inspiration. Upload your official Instagram data export, then tag, filter and find your saves.

Work in progress.

## Stack

Next.js (App Router) and TypeScript, Postgres on Neon with Prisma, Zod, Sass modules, Vitest and Playwright. Hosted on Vercel.

## Getting started

Requires Node 24.

```bash
npm install                # also generates the Prisma client
cp .env.example .env       # then fill in the database URLs
npm run db:migrate         # apply migrations to your development database
npm run dev                # http://localhost:3000
```

Use a separate development database (for example a Neon branch), not production.

## Scripts

| Script               | What it does                                            |
| -------------------- | ------------------------------------------------------- |
| `npm run dev`        | Start the development server                            |
| `npm run build`      | Production build                                        |
| `npm run lint`       | ESLint                                                  |
| `npm run format`     | Format with Prettier                                    |
| `npm run typecheck`  | Type-check the project                                  |
| `npm test`           | Run the unit tests (Vitest)                             |
| `npm run db:migrate` | Create and apply migrations on the development database |
| `npm run db:deploy`  | Apply pending migrations without resetting anything     |
| `npm run db:studio`  | Browse the database in Prisma Studio                    |

## Deployment

Vercel deploys every branch as a preview and `main` to production. Production builds apply pending database migrations before building (`npm run build:vercel`, set in `vercel.json`), so the database is updated before the new code goes live. Preview builds skip migrations.

Vercel needs `DATABASE_URL` (pooled) for the app and, for production only, `DATABASE_URL_UNPOOLED` (direct) for migrations.

## Database

Every table belongs to a user, and deleting a user deletes all their data.

```mermaid
erDiagram
  users ||--o{ posts : saves
  users ||--o{ tags : creates
  users ||--o{ collections : has
  users ||--o{ imports : runs
  posts ||--o{ post_tags : ""
  tags ||--o{ post_tags : ""
  posts ||--o{ post_collections : ""
  collections ||--o{ post_collections : ""
```

| Table              | Purpose                                                                      | Key constraint                                                       |
| ------------------ | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `users`            | Account                                                                      | Unique `email`                                                       |
| `posts`            | A saved post or reel: shortcode, URL, caption, creator, hashtags, saved date | Unique `(user_id, shortcode)`                                        |
| `collections`      | Collections from the export                                                  | Unique `(user_id, external_id)`                                      |
| `post_collections` | Which posts are in which collections                                         | Primary key `(post_id, collection_id)`                               |
| `tags`             | The user's own tags                                                          | Unique `(user_id, name_key)`, so "Recipes" and "recipes" are one tag |
| `post_tags`        | Which tags are on which posts                                                | Primary key `(post_id, tag_id)`                                      |
| `imports`          | One row per upload: date range covered and new / duplicate / invalid counts  | —                                                                    |

The schema lives in `prisma/schema.prisma`; migrations are in `prisma/migrations/`.

## License

MIT
