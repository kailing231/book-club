import { useEffect, useMemo, useState } from "react";
import type { BookFilters, BookRow, SortKey, User } from "../lib/types";
import { applyFilters, sortBooks } from "../lib/filterSort";
import { bookStats } from "../lib/stats";
import { sortComments } from "../lib/sortComments";
import { BookCover } from "./BookCover";
import { FilterSidebar } from "./FilterSidebar";
import { Toggle } from "./Toggle";
import { UI_TEXT } from "../lib/uiText";
import {
  sanitizeText,
  isValidComment,
  MAX_COMMENT_LENGTH,
} from "../lib/validation";

interface BookListProps {
  books: BookRow[];
  usersById: Map<string, User>;
  currentUser: User | null;
  onToggleVote: (
    bookId: string,
    field: "recommended" | "read",
    value: boolean,
  ) => void;
  onAddComment: (bookId: string, text: string) => void;
  onEditComment: (commentId: string, text: string) => void;
}

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "rating", label: UI_TEXT.list.sort.rating },
  { value: "recommended", label: UI_TEXT.list.sort.recommendedCount },
  { value: "read", label: UI_TEXT.list.sort.readCount },
  { value: "added-oldest", label: UI_TEXT.list.sort.addedOldest },
  { value: "added-newest", label: UI_TEXT.list.sort.addedNewest },
  { value: "comments-most", label: UI_TEXT.list.sort.commentsMost },
  { value: "comments-least", label: UI_TEXT.list.sort.commentsLeast },
  { value: "title-asc", label: UI_TEXT.list.sort.titleAsc },
  { value: "title-desc", label: UI_TEXT.list.sort.titleDesc },
];

const EMPTY_FILTERS: BookFilters = {
  title: "",
  authors: "",
  subjectInclude: [],
  subjectExclude: [],
};

const DISPLAY_OPTIONS: { value: string; label: string }[] = [
  { value: "infinite", label: UI_TEXT.list.displayInfinite },
  { value: "10", label: UI_TEXT.list.displaySize10 },
  { value: "50", label: UI_TEXT.list.displaySize50 },
];

export function BookList({
  books,
  usersById,
  currentUser,
  onToggleVote,
  onAddComment,
  onEditComment,
}: BookListProps) {
  const [sortKey, setSortKey] = useState<SortKey>("rating");
  const [filters, setFilters] = useState<BookFilters>(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [newComments, setNewComments] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{
    bookId: string;
    commentId: string;
    text: string;
  } | null>(null);
  const [pageSize, setPageSize] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (pageSize !== null) setPage(1);
  }, [sortKey, filters, pageSize]);

  const visible = useMemo(
    () => sortBooks(applyFilters(books, filters), sortKey, usersById.size),
    [books, filters, sortKey, usersById.size],
  );

  const pageCount =
    pageSize === null
      ? null
      : Math.max(1, Math.ceil(visible.length / pageSize));
  const currentPage =
    pageCount === null ? 1 : Math.min(Math.max(page, 1), pageCount);

  const displayedBooks = useMemo(() => {
    if (pageSize === null) return visible;
    const count = Math.max(1, Math.ceil(visible.length / pageSize));
    const current = Math.min(Math.max(page, 1), count);
    return visible.slice((current - 1) * pageSize, current * pageSize);
  }, [visible, pageSize, page]);

  const allSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const b of visible) for (const g of b.subjects ?? []) set.add(g);
    return [...set];
  }, [visible]);

  const hasActiveFilters =
    filters.title.trim() !== "" ||
    filters.authors.trim() !== "" ||
    filters.subjectInclude.length > 0 ||
    filters.subjectExclude.length > 0;

  function toggleCollapse(bookId: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(bookId)) next.delete(bookId);
      else next.add(bookId);
      return next;
    });
  }

  function collapseAll() {
    setCollapsed(new Set(books.map((b) => b.id)));
  }

  function expandAll() {
    setCollapsed(new Set());
  }

  function submitComment(bookId: string) {
    const text = sanitizeText(newComments[bookId] ?? "");
    if (!isValidComment(text)) return;
    onAddComment(bookId, text);
    setNewComments((prev) => ({ ...prev, [bookId]: "" }));
  }

  function submitEdit() {
    if (!editing) return;
    const text = sanitizeText(editing.text);
    if (!isValidComment(text)) return;
    onEditComment(editing.commentId, text);
    setEditing(null);
  }

  return (
    <section
      className="card list-section"
      aria-label={UI_TEXT.list.sectionAria}
    >
      <div className="list-toolbar">
        <label className="sort-box">
          <span className="sort-label">{UI_TEXT.list.sortLabel}</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="toolbar-right">
          <div className="btn-group">
            <button
              type="button"
              className={`btn btn--small ${hasActiveFilters ? "btn--active" : ""}`}
              onClick={() => setFiltersOpen(true)}
            >
              {UI_TEXT.list.filter}
            </button>
            <button
              type="button"
              className="btn btn--small btn--secondary"
              onClick={collapseAll}
            >
              {UI_TEXT.list.collapseAll}
            </button>
            <button
              type="button"
              className="btn btn--small btn--secondary"
              onClick={expandAll}
            >
              {UI_TEXT.list.expandAll}
            </button>
            <label className="sort-box">
              <span className="sort-label">{UI_TEXT.list.displayLabel}</span>
              <select
                value={pageSize === null ? "infinite" : String(pageSize)}
                onChange={(e) =>
                  setPageSize(
                    e.target.value === "infinite"
                      ? null
                      : Number(e.target.value),
                  )
                }
              >
                {DISPLAY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <FilterSidebar
        open={filtersOpen}
        allSubjects={allSubjects}
        filters={filters}
        onChange={setFilters}
        onClose={() => setFiltersOpen(false)}
      />

      {visible.length === 0 ? (
        <p className="note">{UI_TEXT.list.emptyNote}</p>
      ) : (
        <ul className="book-list">
          {displayedBooks.map((book) => (
            <BookEntry
              key={book.id}
              book={book}
              usersById={usersById}
              currentUser={currentUser}
              collapsed={collapsed.has(book.id)}
              onToggleCollapse={() => toggleCollapse(book.id)}
              onToggleVote={onToggleVote}
              newComment={newComments[book.id] ?? ""}
              onNewCommentChange={(t) =>
                setNewComments((prev) => ({ ...prev, [book.id]: t }))
              }
              onSubmitComment={() => submitComment(book.id)}
              editing={editing}
              onStartEdit={(comment) =>
                setEditing({
                  bookId: book.id,
                  commentId: comment.id,
                  text: comment.text,
                })
              }
              onEditChange={(text) =>
                setEditing((prev) => (prev ? { ...prev, text } : prev))
              }
              onCancelEdit={() => setEditing(null)}
              onSubmitEdit={submitEdit}
            />
          ))}
        </ul>
      )}

      {pageSize !== null && (
        <PaginationControls
          pageCount={pageCount ?? 1}
          currentPage={currentPage}
          onPage={(next) =>
            setPage(Math.min(Math.max(next, 1), pageCount ?? 1))
          }
        />
      )}
    </section>
  );
}

interface PaginationControlsProps {
  pageCount: number;
  currentPage: number;
  onPage: (page: number) => void;
}

function PaginationControls({
  pageCount,
  currentPage,
  onPage,
}: PaginationControlsProps) {
  const pageNumbers: (number | "ellipsis")[] =
    pageCount <= 5
      ? Array.from({ length: pageCount }, (_, i) => i + 1)
      : [1, 2, "ellipsis", pageCount];

  return (
    <nav className="pagination" aria-label={UI_TEXT.list.paginationLabel}>
      <button
        type="button"
        className="btn btn--small btn--secondary"
        aria-label={UI_TEXT.list.previous}
        disabled={currentPage === 1}
        onClick={() => onPage(currentPage - 1)}
      >
        {UI_TEXT.list.previous}
      </button>
      {pageNumbers.map((item, i) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${i}`}
            className="pagination-ellipsis"
            aria-hidden="true"
          >
            {UI_TEXT.list.ellipsis}
          </span>
        ) : (
          <button
            key={item}
            type="button"
            className={`pagination-page btn btn--small btn--secondary${
              item === currentPage ? " pagination-page--current" : ""
            }`}
            aria-label={UI_TEXT.list.pageNumberAria(item)}
            aria-current={item === currentPage ? "page" : undefined}
            onClick={() => onPage(item)}
          >
            {item}
          </button>
        ),
      )}
      <button
        type="button"
        className="btn btn--small btn--secondary"
        aria-label={UI_TEXT.list.next}
        disabled={currentPage === pageCount}
        onClick={() => onPage(currentPage + 1)}
      >
        {UI_TEXT.list.next}
      </button>
    </nav>
  );
}

interface BookEntryProps {
  book: BookRow;
  usersById: Map<string, User>;
  currentUser: User | null;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleVote: (
    bookId: string,
    field: "recommended" | "read",
    value: boolean,
  ) => void;
  newComment: string;
  onNewCommentChange: (text: string) => void;
  onSubmitComment: () => void;
  editing: { bookId: string; commentId: string; text: string } | null;
  onStartEdit: (comment: BookRow["comments"][number]) => void;
  onEditChange: (text: string) => void;
  onCancelEdit: () => void;
  onSubmitEdit: () => void;
}

function BookEntry({
  book,
  usersById,
  currentUser,
  collapsed,
  onToggleCollapse,
  onToggleVote,
  newComment,
  onNewCommentChange,
  onSubmitComment,
  editing,
  onStartEdit,
  onEditChange,
  onCancelEdit,
  onSubmitEdit,
}: BookEntryProps) {
  const stats = bookStats(book, usersById.size);
  const sortedComments = useMemo(
    () => sortComments(book.comments),
    [book.comments],
  );
  const myVote = book.votes.find((v) => v.user_id === currentUser?.id);
  const toggleDisabled = !currentUser;
  const subjects = book.subjects ?? [];

  const searchUrl = (q: string) =>
    `https://www.google.com/search?q=${encodeURIComponent(q)}`;

  return (
    <li className="book-entry">
      <div className="book-entry-top">
        <BookCover cover_i={book.cover_i} title={book.title} />
        <div className="book-metadata">
          <div className="book-title-row">
            <h3 className="book-title">
              <a
                href={searchUrl(book.title)}
                target="_blank"
                rel="noopener noreferrer"
              >
                {book.title}
              </a>
            </h3>
            <span
              className="badge"
              data-tooltip={UI_TEXT.list.percentBadgeTooltip(
                stats.percentRecommended,
              )}
              aria-label={UI_TEXT.list.percentBadgeTooltip(
                stats.percentRecommended,
              )}
            >
              {UI_TEXT.list.percentBadge(stats.percentRecommended)}
            </span>
          </div>

          {book.authors.length > 0 && (
            <p className="book-authors">
              {UI_TEXT.common.by}
              {book.authors.map((author, i) => (
                <span key={author}>
                  {i > 0 && UI_TEXT.common.listSeparator}
                  <a
                    href={searchUrl(author)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {author}
                  </a>
                </span>
              ))}
            </p>
          )}
          {subjects.length > 0 && (
            <p className="book-subjects">
              {subjects.join(UI_TEXT.common.listSeparator)}
            </p>
          )}
        </div>
      </div>

      <div className="book-entry-bottom">
        {book.synopsis && <p className="book-synopsis">{book.synopsis}</p>}

        <div className="book-stats">
          <span className="book-counts">
            <span>{UI_TEXT.list.stats.recommended(stats.recommended)}</span>
            <span>{UI_TEXT.list.stats.read(stats.read)}</span>
          </span>
          <span className="book-toggles">
            <Toggle
              label={UI_TEXT.list.recommendToggle}
              checked={myVote?.recommended ?? false}
              disabled={toggleDisabled}
              onChange={(v) => onToggleVote(book.id, "recommended", v)}
            />
            <Toggle
              label={UI_TEXT.list.readToggle}
              checked={myVote?.read ?? false}
              disabled={toggleDisabled}
              onChange={(v) => onToggleVote(book.id, "read", v)}
            />
          </span>
        </div>

        <div className="comments">
          <button
            type="button"
            className="comments-toggle"
            onClick={onToggleCollapse}
          >
            {UI_TEXT.list.commentsHeader(book.comments.length, collapsed)}
          </button>

          {!collapsed && (
            <div className="comments-body">
              {sortedComments.map((comment) => {
                const author = usersById.get(comment.user_id);
                const edited = comment.updated_by !== comment.user_id;
                return (
                  <div key={comment.id} className="comment">
                    <span className="comment-meta">
                      <strong>{author?.name ?? UI_TEXT.common.unknown}</strong>
                      {edited && (
                        <em className="comment-edited">
                          {UI_TEXT.list.edited}
                        </em>
                      )}
                    </span>
                    {editing?.commentId === comment.id ? (
                      <div className="comment-edit">
                        <textarea
                          value={editing.text}
                          maxLength={MAX_COMMENT_LENGTH}
                          onChange={(e) => onEditChange(e.target.value)}
                        />
                        <div className="btn-group">
                          <button
                            type="button"
                            className="btn btn--small"
                            onClick={onSubmitEdit}
                          >
                            {UI_TEXT.list.save}
                          </button>
                          <button
                            type="button"
                            className="btn btn--small btn--secondary"
                            onClick={onCancelEdit}
                          >
                            {UI_TEXT.common.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="comment-text">{comment.text}</p>
                    )}
                    {currentUser?.id === comment.user_id && !edited ? (
                      <button
                        type="button"
                        className="btn btn--small btn--secondary comment-edit-btn"
                        onClick={() => onStartEdit(comment)}
                      >
                        {UI_TEXT.list.edit}
                      </button>
                    ) : null}
                  </div>
                );
              })}

              {currentUser ? (
                <div className="comment-add">
                  <textarea
                    className="comment-input"
                    rows={2}
                    maxLength={MAX_COMMENT_LENGTH}
                    placeholder={UI_TEXT.list.commentPlaceholder}
                    value={newComment}
                    onChange={(e) => onNewCommentChange(e.target.value)}
                  />
                  <button
                    type="button"
                    className="btn btn--small"
                    disabled={!newComment.trim()}
                    onClick={onSubmitComment}
                  >
                    {UI_TEXT.list.commentSubmit}
                  </button>
                </div>
              ) : (
                <p className="note">{UI_TEXT.list.selectUserNote}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
