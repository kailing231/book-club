import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UI_TEXT } from "../lib/uiText";
import type { PreviewBook } from "../lib/types";
import { AddBooks } from "./AddBooks";

vi.mock("../lib/searchBooks", () => ({ searchBooks: vi.fn() }));

import { searchBooks as mockSearchBooks } from "../lib/searchBooks";

const mockedSearch = vi.mocked(mockSearchBooks);

function preview(overrides: Partial<PreviewBook> = {}): PreviewBook {
  return {
    book_api_id: "OL1W",
    title: "Dune",
    authors: ["Frank Herbert"],
    subjects: [],
    synopsis: "",
    cover_i: 12345,
    ...overrides,
  };
}

const siddhartha = preview({
  book_api_id: "OL2W",
  title: "Siddhartha",
  authors: ["Hermann Hesse"],
});

function deferred() {
  let resolve!: (books: PreviewBook[]) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<PreviewBook[]>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

async function openSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: UI_TEXT.addBooks.startAdding }),
  );
}

async function openAndSearch(books: PreviewBook[]) {
  const user = userEvent.setup();
  mockedSearch.mockResolvedValue(books);
  return renderAndSearch(user);
}

async function renderAndSearch(user: ReturnType<typeof userEvent.setup>) {
  const { container } = render(<AddBooks disabled={false} onAdd={() => {}} />);

  await openSection(user);
  await user.type(
    screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
    "dune",
  );
  await user.click(
    screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
  );
  return { user, container };
}

beforeEach(() => {
  mockedSearch.mockReset();
});

describe("AddBooks covers", () => {
  it("renders the large cover image for preview rows that carry a cover id", async () => {
    const { container } = await openAndSearch([preview()]);

    expect(
      screen.getByRole("img", { name: UI_TEXT.cover.alt("Dune") }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")?.getAttribute("src")).toBe(
      "https://covers.openlibrary.org/b/id/12345-L.jpg",
    );
  });

  it("renders the placeholder image when no cover can be resolved", async () => {
    const { container } = await openAndSearch([
      preview({ cover_i: null, book_api_id: "" }),
    ]);

    expect(
      screen.getByRole("img", { name: UI_TEXT.cover.noCover }),
    ).toBeInTheDocument();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      "/images/book_cover_not_found.png",
    );
  });

  it("passes the cover id through the confirm flow", async () => {
    const onAdd = vi.fn();
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    render(<AddBooks disabled={false} onAdd={onAdd} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.confirm }),
    );

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ cover_i: 12345 }),
      "",
      false,
    );
  });
});

describe("AddBooks search input", () => {
  it("starts with an empty query, no error, and no preview rows", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AddBooks disabled={false} onAdd={() => {}} />,
    );

    await openSection(user);

    expect(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
    ).toHaveValue("");
    expect(container.querySelector(".error")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("disables the Search button until a non-blank query is entered", async () => {
    const user = userEvent.setup();
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    const searchButton = screen.getByRole("button", {
      name: UI_TEXT.addBooks.search,
    });
    expect(searchButton).toBeDisabled();

    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    expect(searchButton).toBeEnabled();

    await user.clear(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
    );
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "   ",
    );
    expect(searchButton).toBeDisabled();
  });

  it("submits the trimmed query when Enter is pressed", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "   dune   {enter}",
    );

    expect(mockedSearch).toHaveBeenCalledWith("dune");
    expect(screen.getByText("Dune")).toBeInTheDocument();
  });

  it("does not search for a whitespace-only query", async () => {
    const user = userEvent.setup();
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "   {enter}",
    );

    expect(mockedSearch).not.toHaveBeenCalled();
  });

  it("shows the Searching state and disables Search while a request is in flight", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    mockedSearch.mockReturnValue(pending.promise);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    const searchingButton = screen.getByRole("button", {
      name: UI_TEXT.addBooks.searching,
    });
    expect(searchingButton).toBeDisabled();

    await act(async () => pending.resolve([preview()]));

    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    ).toBeEnabled();
  });

  it("clears the search text with the clear button but keeps the rows", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    const input = screen.getByPlaceholderText(
      UI_TEXT.addBooks.searchPlaceholder,
    );
    await user.type(input, "dune");
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.clearSearchAria }),
    );

    expect(input).toHaveValue("");
    expect(screen.getByText("Dune")).toBeInTheDocument();
  });
});

describe("AddBooks search results", () => {
  it("shows the no-results error, hides the list, and resets searching", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    expect(screen.getByText(UI_TEXT.addBooks.noResults)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    ).toBeEnabled();
  });

  it("does not show the no-results error when results are present", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    expect(
      screen.queryByText(UI_TEXT.addBooks.noResults),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("clears a previous error at the start of the next search", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <AddBooks disabled={false} onAdd={() => {}} />,
    );
    mockedSearch.mockResolvedValueOnce([]).mockResolvedValueOnce([preview()]);

    await openSection(user);
    const input = screen.getByPlaceholderText(
      UI_TEXT.addBooks.searchPlaceholder,
    );
    await user.type(input, "dune");
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    expect(screen.getByText(UI_TEXT.addBooks.noResults)).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.clearSearchAria }),
    );
    await user.type(input, "dune 2");
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    expect(
      screen.queryByText(UI_TEXT.addBooks.noResults),
    ).not.toBeInTheDocument();
    expect(container.querySelector(".error")).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).toBeInTheDocument();
  });

  it("shows a search-failed error when the request rejects and resets searching", async () => {
    const user = userEvent.setup();
    mockedSearch.mockRejectedValue(new Error("boom"));
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    expect(screen.getByText(UI_TEXT.addBooks.searchFailed)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    ).toBeEnabled();
  });

  it("keeps a late rejection from repainting the section after sign-out", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    mockedSearch.mockReturnValue(pending.promise);
    const { rerender, container } = render(
      <AddBooks disabled={false} onAdd={() => {}} />,
    );

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);
    rerender(<AddBooks disabled={false} onAdd={() => {}} />);
    await act(async () => pending.reject(new Error("boom")));
    await openSection(user);

    expect(container.querySelector(".error")).not.toBeInTheDocument();
  });

  it("clears all rows and the query with the clear-all button", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview(), siddhartha]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    const input = screen.getByPlaceholderText(
      UI_TEXT.addBooks.searchPlaceholder,
    );
    await user.type(input, "dune");
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    const clearAll = screen.getByRole("button", {
      name: UI_TEXT.addBooks.clear,
    });
    expect(clearAll).toBeEnabled();
    await user.click(clearAll);

    expect(input).toHaveValue("");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.clear }),
    ).toBeDisabled();
  });

  it("keeps searching while an older search is still in flight and ignores its late result", async () => {
    const user = userEvent.setup();
    const older = deferred();
    const newer = deferred();
    mockedSearch
      .mockReturnValueOnce(older.promise)
      .mockReturnValueOnce(newer.promise);
    const { rerender } = render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "a",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);
    rerender(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "b{enter}",
    );
    expect(mockedSearch).toHaveBeenNthCalledWith(1, "a");

    await act(async () => older.resolve([preview()]));

    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.searching }),
    ).toBeInTheDocument();

    await act(async () => newer.resolve([siddhartha]));

    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
    expect(screen.getByText("Siddhartha")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    ).toBeInTheDocument();
  });
});

describe("AddBooks preview rows", () => {
  it("renders the authors line only when the book has authors", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    const { container } = await renderAndSearch(user);
    const authors = container.querySelector(".preview-authors");
    expect(authors).toBeInTheDocument();
    expect(authors?.textContent).toBe(`by ${"Frank Herbert"}`);
  });

  it("omits the authors line when the book has no authors", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview({ authors: [] })]);
    const { container } = await renderAndSearch(user);
    expect(container.querySelector(".preview-authors")).not.toBeInTheDocument();
  });

  it("renders the subjects line joined by the list separator", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([
      preview({ subjects: ["Science Fiction", "Adventure"] }),
    ]);
    const { container } = await renderAndSearch(user);
    const subjects = container.querySelector(".preview-subjects");
    expect(subjects).toBeInTheDocument();
    expect(subjects?.textContent).toBe("Science Fiction, Adventure");
  });

  it("omits the subjects line when the book has no subjects", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    const { container } = await renderAndSearch(user);
    expect(
      container.querySelector(".preview-subjects"),
    ).not.toBeInTheDocument();
  });

  it("treats books with a missing subjects field as having no subjects", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([
      preview({ subjects: undefined as never, synopsis: "" }),
    ]);
    const { container } = await renderAndSearch(user);
    expect(
      container.querySelector(".preview-subjects"),
    ).not.toBeInTheDocument();
  });

  it("renders a short synopsis in full without an ellipsis", async () => {
    const user = userEvent.setup();
    const synopsis = "A short story.";
    mockedSearch.mockResolvedValue([preview({ synopsis })]);
    const { container } = await renderAndSearch(user);
    const paragraph = container.querySelector(".preview-synopsis");
    expect(paragraph?.textContent).toBe(synopsis);
  });

  it("truncates a long synopsis at 260 characters with an ellipsis", async () => {
    const user = userEvent.setup();
    const synopsis = "x".repeat(300);
    mockedSearch.mockResolvedValue([preview({ synopsis })]);
    const { container } = await renderAndSearch(user);
    const paragraph = container.querySelector(".preview-synopsis");
    expect(paragraph?.textContent).toBe(
      `${"x".repeat(260)}${UI_TEXT.addBooks.ellipsis}`,
    );
  });

  it("does not truncate a synopsis of exactly 260 characters", async () => {
    const user = userEvent.setup();
    const synopsis = "y".repeat(260);
    mockedSearch.mockResolvedValue([preview({ synopsis })]);
    const { container } = await renderAndSearch(user);
    const paragraph = container.querySelector(".preview-synopsis");
    expect(paragraph?.textContent).toBe(synopsis);
  });

  it("omits the synopsis line when there is no synopsis", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    const { container } = await renderAndSearch(user);
    expect(
      container.querySelector(".preview-synopsis"),
    ).not.toBeInTheDocument();
  });

  it("stores a typed comment only on the matching row", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview(), siddhartha]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    const rows = screen.getAllByRole("listitem");
    await user.type(
      within(rows[0]).getByPlaceholderText(UI_TEXT.addBooks.commentPlaceholder),
      "a must-read",
    );

    expect(
      within(rows[0]).getByPlaceholderText(UI_TEXT.addBooks.commentPlaceholder),
    ).toHaveValue("a must-read");
    expect(
      within(rows[1]).getByPlaceholderText(UI_TEXT.addBooks.commentPlaceholder),
    ).toHaveValue("");
  });
});

describe("AddBooks row actions", () => {
  it("removes only the clicked row with Not This", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview(), siddhartha]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    const rows = screen.getAllByRole("listitem");
    await user.click(
      within(rows[0]).getByRole("button", { name: UI_TEXT.addBooks.notThis }),
    );

    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
    expect(screen.getByText("Siddhartha")).toBeInTheDocument();
  });
});

describe("AddBooks confirm modal", () => {
  async function openModal(books: PreviewBook[], onAdd = () => {}) {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue(books);
    const { container } = render(<AddBooks disabled={false} onAdd={onAdd} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );
    return { user, container };
  }

  it("shows the book title and authors, removes the row, and closes on confirm", async () => {
    const onAdd = vi.fn();
    const { user, container } = await openModal([preview()], onAdd);

    expect(container.querySelector(".modal-text")).toHaveTextContent(
      "You are adding Dune by Frank Herbert",
    );

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.confirm }),
    );

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Dune" }),
      "",
      false,
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
  });

  it("closes without adding when Cancel is pressed", async () => {
    const onAdd = vi.fn();
    const { user } = await openModal([preview()], onAdd);

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.common.cancel }),
    );

    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    const { user } = await openModal([preview()]);

    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows Unknown when the book has no authors", async () => {
    const { container } = await openModal([preview({ authors: [] })]);

    expect(container.querySelector(".modal-text")).toHaveTextContent(
      "You are adding Dune by Unknown",
    );
  });

  it("passes the Recommended toggle state through confirm", async () => {
    const onAdd = vi.fn();
    const { user } = await openModal([preview()], onAdd);

    await user.click(
      screen.getByRole("checkbox", { name: UI_TEXT.addBooks.recommended }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.confirm }),
    );

    expect(onAdd).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Dune" }),
      "",
      true,
    );
  });

  it("allows adding a valid comment", async () => {
    const user = userEvent.setup();
    mockedSearch.mockResolvedValue([preview()]);
    render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.commentPlaceholder),
      "a great read",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});

describe("AddBooks reset", () => {
  it("collapses and clears all draft state when the section becomes disabled (sign-out)", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddBooks disabled={false} onAdd={() => {}} />);
    mockedSearch.mockResolvedValue([preview()]);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: UI_TEXT.addBooks.recommended }),
    );

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);

    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.startAdding }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.addBooks.search }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(<AddBooks disabled={false} onAdd={() => {}} />);

    expect(
      screen.queryByRole("button", { name: UI_TEXT.addBooks.search }),
    ).not.toBeInTheDocument();
    await openSection(user);
    expect(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
    ).toHaveValue("");
    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
  });

  it("clears a search error when the section becomes disabled", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddBooks disabled={false} onAdd={() => {}} />);
    mockedSearch.mockResolvedValue([]);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "nothing",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    expect(screen.getByText(UI_TEXT.addBooks.noResults)).toBeInTheDocument();

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);

    expect(
      screen.queryByText(UI_TEXT.addBooks.noResults),
    ).not.toBeInTheDocument();

    rerender(<AddBooks disabled={false} onAdd={() => {}} />);
    await openSection(user);
    expect(
      screen.queryByText(UI_TEXT.addBooks.noResults),
    ).not.toBeInTheDocument();
  });

  it("resets the Recommended toggle to off after re-opening the confirm modal", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<AddBooks disabled={false} onAdd={() => {}} />);
    mockedSearch.mockResolvedValue([preview()]);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );
    await user.click(
      screen.getByRole("checkbox", { name: UI_TEXT.addBooks.recommended }),
    );
    expect(
      screen.getByRole("checkbox", { name: UI_TEXT.addBooks.recommended }),
    ).toBeChecked();

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);
    rerender(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.add }),
    );

    expect(
      screen.getByRole("checkbox", { name: UI_TEXT.addBooks.recommended }),
    ).not.toBeChecked();
  });

  it("discards search results that resolve after the section becomes disabled", async () => {
    const user = userEvent.setup();
    const pending = deferred();
    mockedSearch.mockReturnValue(pending.promise);
    const { rerender } = render(<AddBooks disabled={false} onAdd={() => {}} />);

    await openSection(user);
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.addBooks.searchPlaceholder),
      "dune",
    );
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.addBooks.search }),
    );
    expect(mockedSearch).toHaveBeenCalledWith("dune");

    rerender(<AddBooks disabled={true} onAdd={() => {}} />);
    await act(async () => pending.resolve([preview()]));

    expect(
      screen.getByRole("button", { name: UI_TEXT.addBooks.startAdding }),
    ).toBeInTheDocument();
    rerender(<AddBooks disabled={false} onAdd={() => {}} />);
    await openSection(user);
    expect(screen.queryByText("Dune")).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
