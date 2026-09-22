import { describe, expect, it } from "vitest";
import { coverUrl } from "./bookCovers";

describe("coverUrl", () => {
  it("resolves a cover-id URL at the large size", () => {
    expect(coverUrl(1234567)).toBe(
      "https://covers.openlibrary.org/b/id/1234567-L.jpg",
    );
  });

  it("returns null when no cover id exists", () => {
    expect(coverUrl(null)).toBeNull();
    expect(coverUrl(undefined)).toBeNull();
  });
});
