# Book Club

A shared reading list for a small book club. Members identify themselves by name (no accounts), search for books through the Open Library API, add them to a club-wide list, mark books read or recommended, and leave comments on each book.

## Features

- Book search by title or partial title, or by exact ISBN, via the [Open Library API](https://openlibrary.org/developers/api); results are limited to English editions, de-duplicated, capped at six rows, and cached in the browser for an hour
- Shared book list showing covers (Open Library cover images), synopsis, authors, subjects, and a recommended-rating badge
- Filtering, sorting, and a Display dropdown that switches between Infinite, 10, and 50 books at a time (with pagination)
- Per-book comments: add a comment, or edit your own
- Read / Recommended toggles and club-wide stats
- Member sign-in by name — no passwords, just a name to attribute additions and comments

## Tech stack

- React 19 + TypeScript + Vite
- Supabase (Postgres) for persistence
- Open Library API for book metadata and cover images
- Plain CSS

## Getting started

1. Install dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` from `.env.example` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) with your Supabase project credentials.

3. Apply the database schema to your Supabase database using the SQL in `supabase/schema.sql`.

4. Start the dev server:

   ```sh
   npm run dev
   ```

## Scripts

| Script                  | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `npm run dev`           | Start the Vite dev server                         |
| `npm run preview`       | Preview the production build                      |
| `npm run build`         | Type-check and build for production               |
| `npm run lint`          | Run oxlint                                        |
| `npm run test`          | Run the vitest suite once (`test:watch` to rerun) |
| `npm run check`         | Lint + build + test (the full gate)               |
| `npm run test:mutation` | Run the Stryker mutation suite                    |

## Development

- [Coding standards](./coding-standards.md) and [UI guidelines](./ui-guidelines.md)
- Tests are co-located with source (`src/lib/*.test.ts`, `src/components/*.test.tsx`) and follow TDD.
- A `githooks/pre-commit` gate runs lint + tests on every commit. Enable it once per clone:

  ```sh
  git config core.hooksPath .githooks
  ```
