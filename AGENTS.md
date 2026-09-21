# AGENTS.md

This file is auto-loaded into every AI coding session for this project. Follow the project's conventions; read the linked guides before writing code.

## Standards

- **Coding standards** — TypeScript/React conventions, file structure, naming, and verification: see [coding-standards.md](./coding-standards.md)
- **UI guidelines** — design tokens, CSS class naming, components, and accessibility: see [ui-guidelines.md](./ui-guidelines.md)

## Conventions summary

- React 19 + TypeScript + Vite, Supabase for persistence, plain CSS in `src/index.css`.
- Components in `src/components/`, pure helpers in `src/lib/`, all UI strings in `UI_TEXT` (`src/lib/uiText.ts`).
- Run `npm run check` (`npm run lint` + `npm run build` + `npm run test`) before finishing work.
- Write behavior tests first and keep them updated on every code change (see [coding-standards.md](./coding-standards.md) "Testing" and the `tdd` skill). A `githooks/pre-commit` gate enforces lint + tests on commit — enable it once with `git config core.hooksPath .githooks`.
- When you add or change unit-tested source files, run mutation testing (Stryker) on those files only and fix surviving mutants in the covered code: per changed file use `npm run test:mutation:file src/<path>` (`stryker run --mutate <path>`; ~1 min). Do not run the full `npm run test:mutation` suite as a gate — mutation testing applies only to changed files. Append any new unit-tested source file to the `mutate` whitelist in `stryker.config.json` so Stryker tracks it. Mutation runs are on-demand, not part of the commit gate.
- **Do not upgrade Vitest past the 4.x major line.** @stryker-mutator/vitest-runner 10 is incompatible with Vitest 5 (mutation workers report every mutant as surviving — a false-passing score — and the run crashes at debug log level on Vitest 5's circular config). Vitest is pinned to `^4.1.10` in `package.json`; keep it there.
- This is an OpenSpec project: consult `openspec/` for active changes and specs before implementing.