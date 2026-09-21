# Coding Standards

These standards describe how this codebase is written today. Follow them for all new and modified code. They are living guidance — update them when the project's patterns change.

## Stack

- React 19 + TypeScript, bundled with Vite.
- Supabase (`@supabase/supabase-js`) for persistence.
- Styling: hand-written plain CSS in `src/index.css` (see [ui-guidelines.md](./ui-guidelines.md)).
- Test runner: Vitest (`npm run test`, watch mode: `npm run test:watch`, config: `vitest.config.ts`, jsdom + React Testing Library).
- Linting: Oxlint (`npm run lint`). Build: `npm run build` (type-check via `tsc -b`, then `vite build`).

## File structure

- **Components** live in `src/components/`, one component per file, PascalCase filename (`Modal.tsx`, `Toggle.tsx`).
- **Pure helpers and logic** live in `src/lib/` as focused modules (`filterSort.ts`, `stats.ts`, `validation.ts`).
- **All static user-facing strings** live in the `UI_TEXT` constant in `src/lib/uiText.ts` — never hard-code labels, placeholders, or notes in components.
- **Types** are defined in `src/lib/types.ts` and re-imported where needed (`import type { Book } from '../lib/types'`).
- **Environment secrets** are read via `import.meta.env.VITE_*` variables; see `.env.example`. Never commit real credentials.

## TypeScript conventions

- Strict-ish, explicit types on public interfaces; the compiler flags unused locals/parameters (`noUnusedLocals`, `noUnusedParameters`).
- Use `interface` for object shapes, `type` for unions.
- Prefer `import type` for type-only imports (`verbatimModuleSyntax` is on).
- Component props are declared as an exported-or-inline `interface XxxProps` in the same file.

## React conventions

- Components are plain functions using hooks — no class components.
- Follow the Rules of Hooks (`react/rules-of-hooks` is an error).
- Keep components presentational and small; extract repeated markup into components (`Toggle`, `Modal`, `FilterSidebar`).
- Derive values with `useMemo` when the input array is heavy (`FilterSidebar.tsx` computes `sortedGenres`).
- Accessible by default: use semantic elements, `aria-label` on icon-only controls, and proper `role`/`aria-checked` for custom widgets.

## Naming

- Components: PascalCase, noun-ish (`BookList`, `FilterSidebar`).
- Helpers/functions: camelCase (`sortBooks`, `filterBooks`).
- Constants that are read-only exports: ALL_CAPS or exported object constants (`UI_TEXT`).
- CSS classes: kebab-case, BEM-ish — see [ui-guidelines.md](./ui-guidelines.md).

## Style

- Quote style is mixed today: most of `src/lib` and `App.tsx` use single quotes without semicolons, while `BookList.tsx`, `AddBooks.tsx`, and `uiText.ts` use double quotes with semicolons. Match the style of the file you are editing; no formatter or lint rule enforces this.
- Concise, declarative code over verbose comments; add a brief comment only where the intent is not obvious (e.g., the header note in `uiText.ts`).
- Keep functions small and single-purpose; pure helpers in `src/lib` stay free of UI concerns.

## Testing

- Run tests with Vitest: `npm run test` (CI/one-shot) or `npm run test:watch` during development. Tests live next to the code they cover: `src/lib/*.test.ts` for pure helpers, `src/components/*.test.tsx` for React components.
- Follow test-driven development — see the `tdd` skill. Write the failing test first, then the minimal code to pass it, one vertical slice (one test → one implementation) at a time.
- Test behavior through public interfaces, never implementation details. Assert known-good literals, not values recomputed the same way the code computes them.
- Component tests use React Testing Library and interact through roles and labels (`getByRole`, `getByLabelText`) — the same accessibility contract the markup exposes.
- Mock only at system boundaries (external APIs, time, storage); see `.agents/skills/tdd/mocking.md`.
- Mutation testing (Stryker) is on-demand, not part of `npm run check`: run it only on changed files with `npm run test:mutation:file src/<path>` (~1 min) and fix surviving mutants in the covered code — see AGENTS.md.
- Every code change ships with its tests updated. The `githooks/pre-commit` gate (enable once with `git config core.hooksPath .githooks`) runs lint + the full suite and blocks commits that would land broken or stale tests.

## Verification

- Run `npm run check` (lint + build + test) before considering work done.
- New code should match the conventions above and pass type-checking without new suppressions.