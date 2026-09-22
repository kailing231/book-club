export const DEFAULT_COVER_SIZE = "L" as const;

export function coverUrl(cover_i: number | null | undefined): string | null {
  if (cover_i !== null && cover_i !== undefined) {
    return `https://covers.openlibrary.org/b/id/${cover_i}-${DEFAULT_COVER_SIZE}.jpg`;
  }
  return null;
}
