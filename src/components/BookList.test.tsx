import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import css from "../index.css?raw";
import type { BookRow, Comment, User } from "../lib/types";
import { UI_TEXT } from "../lib/uiText";
import { BookList } from "./BookList";

function comment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: "c1",
    book_id: "b1",
    user_id: "u1",
    updated_by: "u1",
    text: "A quiet masterpiece.",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function book(overrides: Partial<BookRow> = {}): BookRow {
  return {
    id: "b1",
    book_api_id: "OL1W",
    title: "Dune",
    authors: ["Frank Herbert"],
    subjects: [],
    synopsis: "",
    cover_i: 12345,
    created_at: "2026-01-01T00:00:00Z",
    votes: [],
    comments: [],
    ...overrides,
  };
}

function renderWith(books: BookRow[]) {
  return render(
    <BookList
      books={books}
      usersById={new Map()}
      currentUser={null}
      onToggleVote={() => {}}
      onAddComment={() => {}}
      onEditComment={() => {}}
    />,
  );
}

const alice: User = {
  id: "u1",
  name: "Alice",
  created_at: "2026-01-01T00:00:00Z",
};

function renderSignedIn(
  books: BookRow[],
  onToggleVote: (
    bookId: string,
    field: "recommended" | "read",
    value: boolean,
  ) => void,
  onAddComment: (bookId: string, text: string) => void,
  onEditComment: (commentId: string, text: string) => void,
) {
  return render(
    <BookList
      books={books}
      usersById={new Map([[alice.id, alice]])}
      currentUser={alice}
      onToggleVote={onToggleVote}
      onAddComment={onAddComment}
      onEditComment={onEditComment}
    />,
  );
}

function manyBooks(count: number): BookRow[] {
  return Array.from({ length: count }, (_, i) =>
    book({ id: `b${i}`, book_api_id: `OL${i}`, title: `Book ${i}` }),
  );
}

function displaySelect() {
  return screen.getByRole("combobox", {
    name: UI_TEXT.list.displayLabel,
  }) as HTMLSelectElement;
}

function clickPage(n: number) {
  fireEvent.click(
    screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(n) }),
  );
}

describe("BookList row structure", () => {
  it("renders each row as a top section followed by a bottom section", () => {
    const { container } = renderWith([book()]);
    const entry = container.querySelector(".book-entry")!;

    const top = entry.querySelector(".book-entry-top");
    const bottom = entry.querySelector(".book-entry-bottom");
    expect(top).toBeInTheDocument();
    expect(bottom).toBeInTheDocument();
    expect(
      top!.compareDocumentPosition(bottom!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("puts the cover on the left and the metadata column on the right of the top section", () => {
    const { container } = renderWith([book()]);

    const top = container.querySelector(".book-entry-top")!;
    expect(top.querySelector(".book-cover")).toBeInTheDocument();
    expect(top.querySelector(".book-metadata")).toBeInTheDocument();
  });

  it("puts the title/badge row first, then authors and subjects in the metadata column", () => {
    const { container } = renderWith([
      book({ authors: ["Frank Herbert"], subjects: ["Science Fiction"] }),
    ]);

    const metaChildren = [
      ...container.querySelector(".book-metadata")!.children,
    ].map((el) => el.className);
    expect(metaChildren).toEqual([
      "book-title-row",
      "book-authors",
      "book-subjects",
    ]);
  });

  it("shares the first metadata row between the title and the rating badge", () => {
    const { container } = renderWith([book()]);

    const top = container.querySelector(".book-entry-top")!;
    const titleRow = top.querySelector(".book-title-row")!;
    expect(titleRow).toBe(
      top.querySelector(".book-metadata")!.firstElementChild,
    );
    const rowChildren = [...titleRow.children].map((el) => el.className);
    expect(rowChildren).toEqual(["book-title", "badge"]);
    expect(screen.getByText("0%")).toBeInTheDocument();
    const badge = container.querySelector(".badge") as HTMLElement;
    expect(badge).toHaveAttribute(
      "data-tooltip",
      UI_TEXT.list.percentBadgeTooltip(0),
    );
    expect(badge).toHaveAttribute(
      "aria-label",
      UI_TEXT.list.percentBadgeTooltip(0),
    );
  });

  it("left-aligns the title and places authors and subjects below the title row", () => {
    const { container } = renderWith([
      book({ authors: ["Frank Herbert"], subjects: ["Science Fiction"] }),
    ]);

    const top = container.querySelector(".book-entry-top")!;
    const titleRow = top.querySelector(".book-title-row")!;
    expect(
      titleRow.compareDocumentPosition(top.querySelector(".book-authors")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      top
        .querySelector(".book-authors")!
        .compareDocumentPosition(top.querySelector(".book-subjects")!) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("puts synopsis, counts, toggles, and comments in the bottom section", () => {
    const { container } = renderWith([
      book({
        synopsis: "A desert planet.",
        comments: [comment()],
      }),
    ]);

    const bottom = container.querySelector(".book-entry-bottom")!;
    expect(bottom.querySelector(".book-synopsis")).toHaveTextContent(
      "A desert planet.",
    );
    expect(bottom.querySelector(".book-counts")).toBeInTheDocument();
    expect(bottom.querySelector(".book-toggles")).toBeInTheDocument();
    expect(bottom.querySelector(".comments")).toBeInTheDocument();
  });

  it("collapsing hides only the comments, keeping the top and rest of the bottom visible", () => {
    const { container } = renderWith([
      book({ synopsis: "A desert planet.", comments: [comment()] }),
    ]);

    fireEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.list.commentsHeader(1, false),
      }),
    );

    expect(container.querySelector(".comments-body")).not.toBeInTheDocument();
    expect(container.querySelector(".book-entry-top")).toBeInTheDocument();
    expect(container.querySelector(".book-synopsis")).toBeInTheDocument();
    expect(container.querySelector(".book-stats")).toBeInTheDocument();
  });

  it("stacks the top section into a column at the 360px breakpoint", () => {
    expect(css).toMatch(
      /@media \(max-width: 360px\) \{[\s\S]*?\.book-entry-top\s*\{[^}]*flex-direction\s*:\s*column/i,
    );
  });

  it("keeps the top section as a row at the 480px breakpoint", () => {
    expect(css).not.toMatch(
      /@media \(max-width: 480px\) \{[\s\S]*?\.book-entry-top\s*\{[^}]*flex-direction\s*:\s*column/i,
    );
  });

  it("keeps the metadata column able to shrink beside the cover", () => {
    expect(css).toMatch(/\.book-metadata\s*\{[^}]*flex:\s*1/);
    expect(css).toMatch(/\.book-metadata\s*\{[^}]*min-width:\s*0/);
  });

  it("reveals a hover tooltip on the recommended rating badge", () => {
    expect(css).toMatch(
      /\.badge\s*::after\s*\{[^}]*content:\s*attr\(data-tooltip\)/,
    );
    expect(css).toMatch(/\.badge\s*::after\s*\{[^}]*visibility:\s*hidden/);
    expect(css).toMatch(/\.badge:hover::after\s*\{[^}]*visibility:\s*visible/);
  });

  it("keeps the badge tooltip inside the card without clipping text", () => {
    expect(css).toMatch(/\.badge\s*::after\s*\{[^}]*white-space:\s*normal/);
    expect(css).toMatch(/\.badge\s*::after\s*\{[^}]*max-width:\s*240px/);
  });
});

describe("BookList voting", () => {
  it("disables the recommend and read toggles when signed out", () => {
    const { container } = renderWith([book()]);

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(2);
    for (const cb of checkboxes) {
      expect(cb).toBeDisabled();
    }
  });

  it("calls onToggleVote with the flipped recommend value when signed in", () => {
    const onToggleVote = vi.fn();
    renderSignedIn([book()], onToggleVote, vi.fn(), vi.fn());

    fireEvent.click(
      screen.getByRole("checkbox", { name: UI_TEXT.list.recommendToggle }),
    );
    expect(onToggleVote).toHaveBeenCalledWith("b1", "recommended", true);
  });

  it("calls onToggleVote with the flipped read value when signed in", () => {
    const onToggleVote = vi.fn();
    const myVote = {
      book_id: "b1",
      user_id: alice.id,
      recommended: true,
      read: true,
    };
    renderSignedIn([book({ votes: [myVote] })], onToggleVote, vi.fn(), vi.fn());

    fireEvent.click(
      screen.getByRole("checkbox", { name: UI_TEXT.list.readToggle }),
    );
    expect(onToggleVote).toHaveBeenCalledWith("b1", "read", false);
  });

  it("shows the recommended percent badge computed from all users", () => {
    const users: User[] = [
      { id: "a", name: "A", created_at: "2026-01-01T00:00:00Z" },
      { id: "b", name: "B", created_at: "2026-01-01T00:00:00Z" },
      { id: "c", name: "C", created_at: "2026-01-01T00:00:00Z" },
      { id: "d", name: "D", created_at: "2026-01-01T00:00:00Z" },
    ];
    const vote = (userId: string, recommended: boolean, read: boolean) => ({
      book_id: "b1",
      user_id: userId,
      recommended,
      read,
    });
    const { container } = render(
      <BookList
        books={[
          book({
            votes: [
              vote("a", true, false),
              vote("b", true, false),
              vote("c", true, true),
              vote("d", false, true),
            ],
          }),
        ]}
        usersById={new Map(users.map((u) => [u.id, u]))}
        currentUser={alice}
        onToggleVote={() => {}}
        onAddComment={() => {}}
        onEditComment={() => {}}
      />,
    );

    expect(screen.getByText("75%")).toBeInTheDocument();
    const badge = container.querySelector(".badge") as HTMLElement;
    expect(badge).toHaveAttribute(
      "data-tooltip",
      UI_TEXT.list.percentBadgeTooltip(75),
    );
    expect(badge).toHaveAttribute(
      "aria-label",
      UI_TEXT.list.percentBadgeTooltip(75),
    );
    expect(screen.getByText("Recommended: 3")).toBeInTheDocument();
    expect(screen.getByText("Read: 2")).toBeInTheDocument();
  });
});

describe("BookList collapse controls", () => {
  it("collapse-all hides every row comments and expand-all restores them", () => {
    const { container } = renderWith([
      book({ comments: [comment()] }),
      book({
        id: "b2",
        title: "Neuromancer",
        book_api_id: "OL2W",
        comments: [comment({ id: "c2", text: "Second book" })],
      }),
    ]);

    expect(container.querySelectorAll(".comments-body").length).toBe(2);

    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.list.collapseAll }),
    );
    expect(container.querySelector(".comments-body")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.list.expandAll }),
    );
    expect(container.querySelectorAll(".comments-body").length).toBe(2);
  });

  it("expanding a collapsed row restores its comments", () => {
    const { container } = renderWith([book({ comments: [comment()] })]);

    const toggle = screen.getByRole("button", {
      name: UI_TEXT.list.commentsHeader(1, false),
    });
    fireEvent.click(toggle);
    expect(container.querySelector(".comments-body")).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", {
        name: UI_TEXT.list.commentsHeader(1, true),
      }),
    );
    expect(container.querySelectorAll(".comments-body").length).toBe(1);
  });
});

describe("BookList comments", () => {
  it("shows the login note when signed out", () => {
    const { container } = renderWith([book({ comments: [comment()] })]);

    expect(screen.getByText(UI_TEXT.list.selectUserNote)).toBeInTheDocument();
    expect(container.querySelector(".comment-add")).not.toBeInTheDocument();
  });

  it("adds a comment when signed in without an existing comment", () => {
    const onAddComment = vi.fn();
    renderSignedIn([book()], vi.fn(), onAddComment, vi.fn());

    fireEvent.change(
      screen.getByPlaceholderText(UI_TEXT.list.commentPlaceholder),
      { target: { value: "Great book" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.list.commentSubmit }),
    );

    expect(onAddComment).toHaveBeenCalledWith("b1", "Great book");
  });

  it("disables submit when the comment is blank", () => {
    const onAddComment = vi.fn();
    renderSignedIn([book()], vi.fn(), onAddComment, vi.fn());

    const submit = screen.getByRole("button", {
      name: UI_TEXT.list.commentSubmit,
    });
    expect(submit).toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText(UI_TEXT.list.commentPlaceholder),
      { target: { value: "   " } },
    );
    expect(submit).toBeDisabled();
  });

  it("renders comments oldest-first by creation time, stable for equal timestamps", () => {
    const input = [
      comment({ id: "c2", text: "Z-late", created_at: "2026-02-01T00:00:00Z" }),
      comment({ id: "c3", text: "A-old", created_at: "2026-01-01T00:00:00Z" }),
      comment({ id: "c1", text: "Y-same", created_at: "2026-02-01T00:00:00Z" }),
    ];
    const { container } = renderSignedIn(
      [book({ comments: input })],
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    const texts = [...container.querySelectorAll(".comment-text")].map(
      (el) => el.textContent,
    );
    expect(texts).toEqual(["A-old", "Y-same", "Z-late"]);
  });

  it("keeps the add form visible when the current user already commented", () => {
    const own = comment({ id: "c1", user_id: alice.id, updated_by: alice.id });
    const { container } = renderSignedIn(
      [book({ comments: [own] })],
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(
      screen.getByPlaceholderText(UI_TEXT.list.commentPlaceholder),
    ).toBeInTheDocument();
    expect(container.querySelector(".comment-add")).toBeInTheDocument();
  });

  it("submits an additional comment even after the user already commented", () => {
    const own = comment({
      id: "c1",
      user_id: alice.id,
      updated_by: alice.id,
      text: "Earlier",
    });
    const onAddComment = vi.fn();
    renderSignedIn([book({ comments: [own] })], vi.fn(), onAddComment, vi.fn());

    fireEvent.change(
      screen.getByPlaceholderText(UI_TEXT.list.commentPlaceholder),
      { target: { value: "A later thought" } },
    );
    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.list.commentSubmit }),
    );

    expect(onAddComment).toHaveBeenCalledWith("b1", "A later thought");
    expect(screen.getByText("Earlier")).toBeInTheDocument();
  });

  it("saves an edited comment via the edit button", () => {
    const own = comment({
      id: "c1",
      user_id: alice.id,
      updated_by: alice.id,
      text: "Original",
    });
    const onEditComment = vi.fn();
    renderSignedIn(
      [book({ comments: [own] })],
      vi.fn(),
      vi.fn(),
      onEditComment,
    );

    fireEvent.click(screen.getByRole("button", { name: UI_TEXT.list.edit }));
    fireEvent.change(screen.getByDisplayValue("Original"), {
      target: { value: "Updated" },
    });
    fireEvent.click(screen.getByRole("button", { name: UI_TEXT.list.save }));

    expect(onEditComment).toHaveBeenCalledWith("c1", "Updated");
    expect(screen.queryByDisplayValue("Updated")).not.toBeInTheDocument();
  });

  it("cancels an edit without saving", () => {
    const own = comment({
      id: "c1",
      user_id: alice.id,
      updated_by: alice.id,
      text: "Original",
    });
    const onEditComment = vi.fn();
    renderSignedIn(
      [book({ comments: [own] })],
      vi.fn(),
      vi.fn(),
      onEditComment,
    );

    fireEvent.click(screen.getByRole("button", { name: UI_TEXT.list.edit }));
    fireEvent.change(screen.getByDisplayValue("Original"), {
      target: { value: "Updated" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.common.cancel }),
    );

    expect(onEditComment).not.toHaveBeenCalled();
    expect(screen.getByText("Original")).toBeInTheDocument();
  });

  it("does not offer a comment edit button for other users comments", () => {
    const other = comment({ id: "c1", user_id: "u2", updated_by: "u2" });
    renderSignedIn([book({ comments: [other] })], vi.fn(), vi.fn(), vi.fn());

    expect(
      screen.queryByRole("button", { name: UI_TEXT.list.edit }),
    ).not.toBeInTheDocument();
  });

  it("does not offer a comment edit button for edited-away comments", () => {
    const editedAway = comment({
      id: "c1",
      user_id: alice.id,
      updated_by: "u2",
    });
    renderSignedIn(
      [book({ comments: [editedAway] })],
      vi.fn(),
      vi.fn(),
      vi.fn(),
    );

    expect(
      screen.queryByRole("button", { name: UI_TEXT.list.edit }),
    ).not.toBeInTheDocument();
  });
});

describe("BookList empty and optional content", () => {
  it("shows the empty note when there are no books", () => {
    renderWith([]);

    expect(screen.getByText(UI_TEXT.list.emptyNote)).toBeInTheDocument();
  });

  it("omits the authors line when a book has no authors", () => {
    const { container } = renderWith([book({ authors: [] })]);

    expect(container.querySelector(".book-authors")).not.toBeInTheDocument();
    expect(screen.getByText("Dune")).toBeInTheDocument();
  });

  it("omits the subjects line when a book has no subjects", () => {
    const { container } = renderWith([book({ subjects: [] })]);

    expect(container.querySelector(".book-subjects")).not.toBeInTheDocument();
  });

  it("omits the synopsis line when a book has no synopsis", () => {
    const { container } = renderWith([book({ synopsis: "" })]);

    expect(container.querySelector(".book-synopsis")).not.toBeInTheDocument();
  });

  it("resorts the rows when the sort selection changes", () => {
    const { container } = renderWith([
      book({ id: "b1", title: "Zebra" }),
      book({ id: "b2", title: "Apple", book_api_id: "OL2W" }),
    ]);

    fireEvent.change(
      screen.getByRole("combobox", { name: UI_TEXT.list.sortLabel }),
      { target: { value: "title-asc" } },
    );

    const titles = [...container.querySelectorAll(".book-title")].map(
      (el) => el.textContent,
    );
    expect(titles[0]).toBe("Apple");
    expect(titles[1]).toBe("Zebra");
  });
});

describe("BookList covers", () => {
  it("renders the large cover thumbnail when a cover id resolves", () => {
    const { container } = renderWith([book()]);

    expect(
      screen.getByRole("img", { name: UI_TEXT.cover.alt("Dune") }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://covers.openlibrary.org/b/id/12345-L.jpg",
    );
    expect(container.querySelector(".book-cover")?.className).toBe(
      "book-cover book-cover--l",
    );
  });

  it("shows the placeholder image when only a work OLID exists and no cover id", () => {
    const { container } = renderWith([
      book({ cover_i: null, book_api_id: "OL1W" }),
    ]);

    expect(
      screen.getByRole("img", { name: UI_TEXT.cover.noCover }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).not.toHaveAttribute(
      "src",
      /^https:\/\/covers\.openlibrary\.org\/b\/olid\//,
    );
  });

  it("shows the placeholder image when the cover image fails to load", () => {
    const { container } = renderWith([book()]);
    const img = container.querySelector("img")!;

    fireEvent.error(img);

    const placeholder = screen.getByRole("img", {
      name: UI_TEXT.cover.noCover,
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute(
      "src",
      "/images/book_cover_not_found.png",
    );
  });

  it("shows the placeholder image when no cover can be resolved", () => {
    renderWith([book({ cover_i: null, book_api_id: "" })]);

    const placeholder = screen.getByRole("img", {
      name: UI_TEXT.cover.noCover,
    });
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute(
      "src",
      "/images/book_cover_not_found.png",
    );
  });
});

describe("BookList display and pagination", () => {
  it("shows a Display dropdown at the top-right of the toolbar with Infinite, 10, and 50, Infinite default", () => {
    const { container } = renderWith([book()]);

    const display = displaySelect();
    const options = [...display.querySelectorAll("option")].map(
      (o) => o.textContent,
    );
    expect(options).toEqual([
      UI_TEXT.list.displayInfinite,
      UI_TEXT.list.displaySize10,
      UI_TEXT.list.displaySize50,
    ]);
    expect(display).toHaveValue("infinite");

    const toolbar = container.querySelector(".list-toolbar")!;
    const right = toolbar.querySelector(".toolbar-right")!;
    expect(toolbar.lastElementChild).toBe(right);
    expect(right.querySelector(".sort-box")).toBeInTheDocument();
    expect(right.querySelector(".btn-group")).toBeInTheDocument();
    expect(
      container.querySelector(".list-toolbar .sort-box"),
    ).toBeInTheDocument();
  });

  it("resets to Infinite and shows every book after the component remounts", () => {
    const { container, unmount } = renderWith(manyBooks(37));

    fireEvent.change(displaySelect(), { target: { value: "10" } });
    expect(container.querySelectorAll(".book-entry").length).toBe(10);

    unmount();
    const remounted = renderWith(manyBooks(37));

    expect(displaySelect()).toHaveValue("infinite");
    expect(remounted.container.querySelectorAll(".book-entry").length).toBe(37);
  });

  it("renders no pagination controls in Infinite mode", () => {
    const { container } = renderWith(manyBooks(37));

    expect(container.querySelector(".pagination")).not.toBeInTheDocument();
  });

  it("splits 37 books into 4 pages of 10, with 7 on the last page", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(container.querySelectorAll(".book-entry").length).toBe(10);
    clickPage(4);
    expect(container.querySelectorAll(".book-entry").length).toBe(7);
    expect(screen.getByText("Book 36")).toBeInTheDocument();
  });

  it("shows every page number when the page count is five or fewer", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(3) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(4) }),
    ).toBeInTheDocument();
    expect(screen.queryByText(UI_TEXT.list.ellipsis)).not.toBeInTheDocument();
    expect(container.querySelector(".pagination")).toBeInTheDocument();
  });

  it("shows every page number for exactly five pages", () => {
    const { container } = renderWith(manyBooks(50));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(container.querySelector(".pagination")).toBeInTheDocument();
    for (const n of [1, 2, 3, 4, 5]) {
      expect(
        screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(n) }),
      ).toBeInTheDocument();
    }
    expect(screen.queryByText(UI_TEXT.list.ellipsis)).not.toBeInTheDocument();
  });

  it("compacts exactly six pages to 1, 2, ellipsis, and 6", () => {
    renderWith(manyBooks(51));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(6) }),
    ).toBeInTheDocument();
    expect(screen.getByText(UI_TEXT.list.ellipsis)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.list.pageNumberAria(3) }),
    ).not.toBeInTheDocument();
  });

  it("compacts page controls to 1, 2, ellipsis, and the last page above five pages", () => {
    const { container } = renderWith(manyBooks(61));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(7) }),
    ).toBeInTheDocument();
    expect(screen.getByText(UI_TEXT.list.ellipsis)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.list.pageNumberAria(5) }),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".pagination")).toBeInTheDocument();
    const ellipsis = container.querySelector(".pagination-ellipsis")!;
    expect(ellipsis).toHaveAttribute("aria-hidden", "true");
  });

  it("disables Previous on the first page and Next on the last page", () => {
    renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    const previous = screen.getByRole("button", {
      name: UI_TEXT.list.previous,
    });
    const next = screen.getByRole("button", { name: UI_TEXT.list.next });
    expect(previous).toBeDisabled();
    expect(next).toBeEnabled();

    clickPage(4);
    expect(previous).toBeEnabled();
    expect(next).toBeDisabled();
  });

  it("advances to the next page with the Next control", () => {
    renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    fireEvent.click(screen.getByRole("button", { name: UI_TEXT.list.next }));

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).toHaveAttribute("aria-current", "page");
  });

  it("steps back a page with the Previous control", () => {
    renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(3);

    fireEvent.click(
      screen.getByRole("button", { name: UI_TEXT.list.previous }),
    );

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(3) }),
    ).not.toHaveAttribute("aria-current");
  });

  it("removes pagination and shows every book when switched back to Infinite", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(3);
    expect(container.querySelector(".pagination")).toBeInTheDocument();

    fireEvent.change(displaySelect(), { target: { value: "infinite" } });

    expect(displaySelect()).toHaveValue("infinite");
    expect(container.querySelector(".pagination")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".book-entry").length).toBe(37);
  });

  it("marks the active page and jumps to a selected numbered page", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).not.toHaveAttribute("aria-current");

    expect(
      container.querySelector(".pagination-page--current"),
    ).toHaveTextContent("1");
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(2) }),
    ).not.toHaveClass("pagination-page--current");

    clickPage(3);
    expect(container.querySelectorAll(".book-entry").length).toBe(10);
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(3) }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      container.querySelector(".pagination-page--current"),
    ).toHaveTextContent("3");
    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(4) }),
    ).not.toHaveClass("pagination-page--current");
  });

  it("resets to page 1 when the sort changes", () => {
    const { container } = renderWith(manyBooks(37));
    const sort = screen.getByRole("combobox", {
      name: UI_TEXT.list.sortLabel,
    });
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(3);

    fireEvent.change(sort, { target: { value: "title-asc" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toHaveAttribute("aria-current", "page");
    expect(container.querySelectorAll(".book-entry").length).toBe(10);
    expect(screen.getByText("Book 0")).toBeInTheDocument();
  });

  it("resets to page 1 when the Display value changes", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(3);

    fireEvent.change(displaySelect(), { target: { value: "50" } });

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toHaveAttribute("aria-current", "page");
    expect(container.querySelectorAll(".book-entry").length).toBe(37);
  });

  it("resets to page 1 when a filter changes", () => {
    const { container } = renderWith(manyBooks(37));
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(3);

    fireEvent.click(screen.getByRole("button", { name: UI_TEXT.list.filter }));
    fireEvent.change(
      screen.getByPlaceholderText(UI_TEXT.filter.titlePlaceholder),
      { target: { value: "Book 3" } },
    );

    expect(
      screen.getByRole("button", { name: UI_TEXT.list.pageNumberAria(1) }),
    ).toHaveAttribute("aria-current", "page");
    expect(container.querySelectorAll(".book-entry").length).toBe(8);
  });

  it("clamps to the last existing page when the result set shrinks below the active page", () => {
    const baseProps = (books: BookRow[]) => ({
      books,
      usersById: new Map<string, User>(),
      currentUser: null as User | null,
      onToggleVote: () => {},
      onAddComment: () => {},
      onEditComment: () => {},
    });
    const { container, rerender } = render(
      <BookList {...baseProps(manyBooks(37))} />,
    );
    fireEvent.change(displaySelect(), { target: { value: "10" } });
    clickPage(4);

    rerender(<BookList {...baseProps(manyBooks(5))} />);

    expect(screen.queryByText(UI_TEXT.list.emptyNote)).not.toBeInTheDocument();
    expect(container.querySelectorAll(".book-entry").length).toBe(5);
  });
});
