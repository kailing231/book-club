import type { BookFilters, BookRow, SortKey } from "./types";
import { bookStats } from "./stats";

export function applyFilters(
  books: BookRow[],
  filters: BookFilters,
): BookRow[] {
  const titleQ = filters.title.trim().toLowerCase();
  const authorQ = filters.authors.trim().toLowerCase();
  return books.filter((book) => {
    if (titleQ && !book.title.toLowerCase().includes(titleQ)) return false;
    if (authorQ && !book.authors.some((a) => a.toLowerCase().includes(authorQ)))
      return false;

    const missingIncluded = filters.subjectInclude.some(
      (g) =>
        !(book.subjects ?? []).some(
          (bg) => bg.toLowerCase() === g.toLowerCase(),
        ),
    );
    if (missingIncluded) return false;

    const hasExcluded = (book.subjects ?? []).some((bg) =>
      filters.subjectExclude.some((g) => g.toLowerCase() === bg.toLowerCase()),
    );
    if (hasExcluded) return false;

    return true;
  });
}

export function sortBooks(
  books: BookRow[],
  key: SortKey,
  totalUsers: number,
): BookRow[] {
  const arr = [...books];
  switch (key) {
    case "recommended":
      return arr.sort(
        (a, b) =>
          bookStats(b, totalUsers).recommended -
          bookStats(a, totalUsers).recommended,
      );
    case "read":
      return arr.sort(
        (a, b) => bookStats(b, totalUsers).read - bookStats(a, totalUsers).read,
      );
    case "added-oldest":
      return arr.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
    case "added-newest":
      return arr.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "comments-most":
      return arr.sort((a, b) => b.comments.length - a.comments.length);
    case "comments-least":
      return arr.sort((a, b) => a.comments.length - b.comments.length);
    case "title-asc":
      return arr.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
      );
    case "title-desc":
      return arr.sort((a, b) =>
        b.title.localeCompare(a.title, undefined, { sensitivity: "base" }),
      );
    case "rating":
    default:
      return arr.sort((a, b) => {
        const sa = bookStats(a, totalUsers);
        const sb = bookStats(b, totalUsers);
        if (sa.percentRecommended !== sb.percentRecommended) {
          return sb.percentRecommended - sa.percentRecommended;
        }
        return sb.recommended - sa.recommended;
      });
  }
}
