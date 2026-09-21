import { useEffect, useRef, useState } from "react";
import type { PreviewBook } from "../lib/types";
import { searchBooks } from "../lib/searchBooks";
import {
  sanitizeText,
  isValidComment,
  MAX_COMMENT_LENGTH,
} from "../lib/validation";
import { Modal } from "./Modal";
import { Toggle } from "./Toggle";
import { BookCover } from "./BookCover";
import { UI_TEXT } from "../lib/uiText";

interface AddBooksProps {
  disabled: boolean;
  onAdd: (
    book: PreviewBook,
    comment: string,
    recommended: boolean,
  ) => Promise<void> | void;
}

interface Row extends PreviewBook {
  comment: string;
}

type ConfirmTarget = { book: PreviewBook; comment: string } | null;

export function AddBooks({ disabled, onAdd }: AddBooksProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const [recommended, setRecommended] = useState(false);
  const requestId = useRef(0);
  const [prevDisabled, setPrevDisabled] = useState(disabled);

  if (disabled !== prevDisabled) {
    setPrevDisabled(disabled);
    if (disabled) {
      setOpen(false);
      setQuery("");
      setRows([]);
      setSearching(false);
      setError("");
      setConfirmTarget(null);
      setRecommended(false);
    }
  }

  useEffect(() => {
    if (disabled) requestId.current += 1;
  }, [disabled]);

  async function handleSearch() {
    setError("");
    const q = query.trim();
    if (!q) return;
    const id = ++requestId.current;
    setSearching(true);
    try {
      const results = await searchBooks(q);
      if (id !== requestId.current) return;
      setRows(results.map((r) => ({ ...r, comment: "" })));
      if (results.length === 0) setError(UI_TEXT.addBooks.noResults);
    } catch {
      if (id !== requestId.current) return;
      setError(UI_TEXT.addBooks.searchFailed);
    } finally {
      if (id === requestId.current) setSearching(false);
    }
  }

  function updateRow(id: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.book_api_id === id ? { ...r, ...patch } : r)),
    );
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.book_api_id !== id));
  }

  async function doAdd(book: PreviewBook, comment: string) {
    await onAdd(book, comment, recommended);
    removeRow(book.book_api_id);
  }

  function handleConfirmAdd() {
    if (!confirmTarget) return;
    const { book, comment } = confirmTarget;
    void doAdd(book, comment);
    setConfirmTarget(null);
  }

  return (
    <section className="card add-section" aria-label={UI_TEXT.addBooks.sectionAria}>
      <button
        type="button"
        className="btn btn--block btn--outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? UI_TEXT.addBooks.hideAdding : UI_TEXT.addBooks.startAdding}
      </button>

      {open ? (
        <div className="add-body">
          <div className="search-row">
            <div className="search-input-wrap">
              <input
                type="text"
                value={query}
                placeholder={UI_TEXT.addBooks.searchPlaceholder}
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleSearch();
                }}
                onChange={(e) => setQuery(e.target.value)}
              />
              {query ? (
                <button
                  type="button"
                  className="search-clear"
                  aria-label={UI_TEXT.addBooks.clearSearchAria}
                  onClick={() => setQuery("")}
                >
                  {UI_TEXT.addBooks.clearGlyph}
                </button>
              ) : null}
            </div>
            <button
              type="button"
              className="btn"
              disabled={disabled || searching || query.trim() === ""}
              onClick={() => void handleSearch()}
            >
              {searching ? UI_TEXT.addBooks.searching : UI_TEXT.addBooks.search}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={disabled || rows.length === 0}
              onClick={() => {
                setRows([]);
                setQuery("");
              }}
            >
              {UI_TEXT.addBooks.clear}
            </button>
          </div>

          {error ? <p className="error">{error}</p> : null}

          {rows.length > 0 ? (
            <ul className="preview-list">
              {rows.map((row) => (
                <li key={row.book_api_id} className="preview-row">
                  <div className="preview-top">
                    <BookCover
                      cover_i={row.cover_i}
                      title={row.title}
                    />
                    <div className="preview-main">
                    <h4 className="preview-title">{row.title}</h4>
                    {row.authors.length > 0 && (
                      <p className="preview-authors">
                        {UI_TEXT.common.by}
                        {row.authors.join(UI_TEXT.common.listSeparator)}
                      </p>
                    )}
                    {(row.subjects ?? []).length > 0 && (
                      <p className="preview-subjects">
                        {(row.subjects ?? []).join(UI_TEXT.common.listSeparator)}
                      </p>
                    )}
                    {row.synopsis && (
                      <p className="preview-synopsis">
                        {row.synopsis.length > 260
                          ? `${row.synopsis.slice(0, 260)}${UI_TEXT.addBooks.ellipsis}`
                          : row.synopsis}
                      </p>
                    )}
                  </div>
                  </div>

                  <div className="preview-actions">
                    <textarea
                      className="comment-input"
                      rows={2}
                      maxLength={MAX_COMMENT_LENGTH}
                      placeholder={UI_TEXT.addBooks.commentPlaceholder}
                      disabled={disabled}
                      value={row.comment}
                      onChange={(e) =>
                        updateRow(row.book_api_id, { comment: e.target.value })
                      }
                    />
                    <div className="btn-group">
                      <button
                        type="button"
                        className="btn btn--small btn--secondary"
                        disabled={disabled}
                        onClick={() => removeRow(row.book_api_id)}
                      >
                        {UI_TEXT.addBooks.notThis}
                      </button>
                      <button
                        type="button"
                        className="btn btn--small"
                        disabled={disabled}
                        onClick={() => {
                          const comment = sanitizeText(row.comment);
                          if (comment && !isValidComment(comment)) return;
                          const { comment: _c, ...book } = row;
                          setRecommended(false);
                          setConfirmTarget({ book, comment });
                        }}
                      >
                        {UI_TEXT.addBooks.add}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {confirmTarget ? (
        <Modal onClose={() => setConfirmTarget(null)}>
          <p className="modal-text">
            {UI_TEXT.addBooks.modal.addingPrefix}{" "}
            <strong>{confirmTarget.book.title}</strong>{" "}
            {UI_TEXT.common.by}
            <strong>
              {confirmTarget.book.authors.join(UI_TEXT.common.listSeparator) || UI_TEXT.common.unknown}
            </strong>
          </p>
          <div className="modal-toggle">
            <Toggle
              label={UI_TEXT.addBooks.recommended}
              checked={recommended}
              onChange={setRecommended}
            />
          </div>
          <div className="btn-group">
            <button type="button" className="btn" onClick={handleConfirmAdd}>
              {UI_TEXT.addBooks.confirm}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => setConfirmTarget(null)}
            >
              {UI_TEXT.common.cancel}
            </button>
          </div>
        </Modal>
      ) : null}
    </section>
  );
}
