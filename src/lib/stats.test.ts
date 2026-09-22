import type { BookRow, Vote } from "./types";
import { bookStats } from "./stats";

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

describe("bookStats", () => {
  it("counts recommended, read, and voters, and rounds percentRecommended", () => {
    const book = makeBook({
      votes: [vote(true, true), vote(true, false), vote(false, true)],
    });
    expect(bookStats(book, 4)).toEqual({
      recommended: 2,
      read: 2,
      percentRecommended: 50,
      voters: 3,
    });
  });

  it("reports zero percentRecommended when totalUsers is zero", () => {
    const book = makeBook({ votes: [vote(true, false)] });
    expect(bookStats(book, 0)).toEqual({
      recommended: 1,
      read: 0,
      percentRecommended: 0,
      voters: 1,
    });
  });

  it("rounds percentRecommended to the nearest integer", () => {
    const book = makeBook({ votes: [vote(true, false)] });
    expect(bookStats(book, 3).percentRecommended).toBe(33);
  });

  it("stays at zero for a book with no votes", () => {
    const book = makeBook();
    expect(bookStats(book, 8)).toEqual({
      recommended: 0,
      read: 0,
      percentRecommended: 0,
      voters: 0,
    });
  });

  it("reaches 100 percent when everyone recommends", () => {
    const book = makeBook({ votes: [vote(true, false), vote(true, true)] });
    expect(bookStats(book, 2).percentRecommended).toBe(100);
  });
});
