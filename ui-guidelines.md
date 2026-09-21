# UI Guidelines

Guidelines for building UI in this project. All styles live in `src/index.css` as plain CSS — there is no component library, utility framework, or CSS-in-JS. Keep it that way unless a change explicitly introduces a new tool.

## Core UI Rules

1. Mobile-first.
2. No user-facing text hard-coded in React components.
3. No hard-coded colours when a design token exists.
4. Reuse existing UI components before creating new variants.
5. Every asynchronous operation must define loading, success and error behaviour.
6. Every list must define loading, populated, empty and error states.
7. Missing Open Library data must never break the layout.
8. Accessibility is part of the component definition, not a later enhancement.
9. Prefer semantic HTML elements over generic divs.
10. UI changes must work at both mobile and desktop widths.
