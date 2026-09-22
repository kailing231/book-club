import type { BookFilters, BookRow, Vote } from "./types";
import { applyFilters, sortBooks } from "./filterSort";

function makeBook(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: "b1",
    book_api_id: "b1",
    title: "Title",
    authors: [],
    subjects: [],
    synopsis: "",
    created_at: "2026-01-01",
    votes: [],
    comments: [],
    ...overrides,
  };
}

function vote(recommended: boolean, read: boolean): Vote {
  return { book_id: "b1", user_id: "u1", recommended, read };
}

const gatsby = makeBook({
  id: "a",
  title: "The Great Gatsby",
  authors: ["F. Scott Fitzgerald"],
  subjects: ["Classics"],
});
const dune = makeBook({
  id: "b",
  title: "Dune",
  authors: ["Frank Herbert"],
  subjects: ["Science Fiction", "Adventure"],
});
const moby = makeBook({
  id: "c",
  title: "Moby Dick",
  authors: ["Herman Melville"],
  subjects: ["Adventure"],
});

const all = [gatsby, dune, moby];

function filters(overrides: Partial<BookFilters> = {}): BookFilters {
  return {
    title: "",
    authors: "",
    subjectInclude: [],
    subjectExclude: [],
    ...overrides,
  };
}

describe("applyFilters", () => {
  it("returns all books for empty filters", () => {
    expect(applyFilters(all, filters())).toEqual(all);
  });

  it("matches title case-insensitively by substring", () => {
    expect(applyFilters(all, filters({ title: "DUne" }))).toEqual([dune]);
  });

  it("matches author case-insensitively by substring", () => {
    expect(applyFilters(all, filters({ authors: "fitz" }))).toEqual([gatsby]);
  });

  it("includes only books that have every included subject", () => {
    expect(
      applyFilters(all, filters({ subjectInclude: ["Adventure"] })),
    ).toEqual([dune, moby]);
    expect(
      applyFilters(
        all,
        filters({ subjectInclude: ["Science Fiction", "Adventure"] }),
      ),
    ).toEqual([dune]);
  });

  it("excludes books that have any excluded subject", () => {
    expect(
      applyFilters(all, filters({ subjectExclude: ["Adventure"] })),
    ).toEqual([gatsby]);
  });

  it("combines title and exclusion filters", () => {
    expect(
      applyFilters(
        all,
        filters({ title: "dick", subjectExclude: ["Science Fiction"] }),
      ),
    ).toEqual([moby]);
  });

  it("treats books missing the subjects field as having no subjects", () => {
    const legacy = makeBook({ id: "legacy", subjects: undefined as never });
    expect(
      applyFilters([legacy], filters({ subjectInclude: ["Adventure"] })),
    ).toEqual([]);
    expect(
      applyFilters([legacy], filters({ subjectExclude: ["Adventure"] })),
    ).toEqual([legacy]);
  });
});

describe("sortBooks", () => {
  it("sorts ascending and descending by title case-insensitively", () => {
    expect(sortBooks(all, "title-asc", 1).map((b) => b.title)).toEqual([
      "Dune",
      "Moby Dick",
      "The Great Gatsby",
    ]);
    expect(sortBooks(all, "title-desc", 1).map((b) => b.title)).toEqual([
      "The Great Gatsby",
      "Moby Dick",
      "Dune",
    ]);
  });

  it("sorts by read count descending", () => {
    const byRead = [
      makeBook({ id: "a", votes: [vote(true, true)] }),
      makeBook({
        id: "b",
        votes: [vote(true, true), vote(false, true), vote(false, true)],
      }),
      makeBook({ id: "c", votes: [] }),
    ];
    expect(sortBooks(byRead, "read", 3).map((b) => b.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("sorts by recommendation count descending", () => {
    const byRec = [
      makeBook({ id: "a", votes: [vote(true, false)] }),
      makeBook({ id: "b", votes: [vote(true, false), vote(true, false)] }),
      makeBook({ id: "c", votes: [] }),
    ];
    expect(sortBooks(byRec, "recommended", 3).map((b) => b.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("sorts by percentRecommended descending (rating default)", () => {
    const byRating = [
      makeBook({ id: "a", votes: [vote(true, false)] }),
      makeBook({ id: "b", votes: [vote(true, false), vote(true, false)] }),
      makeBook({ id: "c", votes: [] }),
    ];
    expect(sortBooks(byRating, "rating", 2).map((b) => b.id)).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("does not mutate the input array", () => {
    const before = all.map((b) => b.id);
    sortBooks(all, "title-asc", 1);
    expect(all.map((b) => b.id)).toEqual(before);
  });
});
