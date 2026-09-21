import { useCallback, useEffect, useMemo, useState } from "react";
import type { BookRow, PreviewBook, User } from "./lib/types";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import {
  normalizeAuthors,
  normalizeSubjects,
  sanitizeText,
} from "./lib/validation";
import { UI_TEXT } from "./lib/uiText";
import { UserSection } from "./components/UserSection";
import { AddBooks } from "./components/AddBooks";
import { BookList } from "./components/BookList";
import { BackToTop } from "./components/BackToTop";

async function loadUsers(): Promise<User[]> {
  const { data, error } = await supabase!
    .from("users")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as User[];
}

async function loadBooks(): Promise<BookRow[]> {
  const { data, error } = await supabase!
    .from("books")
    .select("*, votes(*), comments(*)")
    .order("created_at")
    .order("created_at", { referencedTable: "comments" })
    .order("id", { referencedTable: "comments" });
  if (error) throw error;
  return (data ?? []) as BookRow[];
}

async function addUser(name: string): Promise<User> {
  const { data, error } = await supabase!
    .from("users")
    .insert({ name })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

function App() {
  const [users, setUsers] = useState<User[]>([]);
  const [books, setBooks] = useState<BookRow[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const usersById = useMemo(
    () => new Map(users.map((u) => [u.id, u])),
    [users],
  );

  const currentUser = useMemo(
    () => users.find((u) => u.id === currentUserId) ?? null,
    [users, currentUserId],
  );

  const refresh = useCallback(async () => {
    const [userRows, bookRows] = await Promise.all([loadUsers(), loadBooks()]);
    setUsers(userRows);
    setBooks(bookRows);
  }, []);

  useEffect(() => {
    if (!supabase) return;
    Promise.all([loadUsers(), loadBooks()])
      .then(([userRows, bookRows]) => {
        setUsers(userRows);
        setBooks(bookRows);
      })
      .catch((e) => setError(UI_TEXT.app.errors.failedToLoad(e.message)));
  }, []);

  function handleConfirmUser(user: User) {
    setCurrentUserId(user.id);
    setError("");
  }

  function handleLogout() {
    setCurrentUserId(null);
    setError("");
  }

  async function handleAddUser(name: string) {
    try {
      const user = await addUser(name);
      setUsers((prev) => [...prev, user]);
      setCurrentUserId(user.id);
      setError("");
    } catch (e) {
      setError(UI_TEXT.app.errors.couldNotCreateUser((e as Error).message));
    }
  }

  async function handleAddBook(
    book: PreviewBook,
    comment: string,
    recommended: boolean,
  ) {
    const cleanTitle = sanitizeText(book.title);
    if (!cleanTitle || !currentUser) return;
    try {
      let bookId: string;
      const { data: existing } = await supabase!
        .from("books")
        .select("id")
        .eq("book_api_id", book.book_api_id)
        .maybeSingle();
      if (existing) {
        bookId = existing.id;
      } else {
        const { data, error } = await supabase!
          .from("books")
          .insert({
            book_api_id: book.book_api_id,
            title: cleanTitle,
            authors: normalizeAuthors(book.authors),
            subjects: normalizeSubjects(book.subjects),
            synopsis: sanitizeText(book.synopsis),
            cover_i: book.cover_i ?? null,
          })
          .select("id")
          .single();
        if (error) throw error;
        bookId = data.id;
      }
      // The user who added the book has read it (Read on by default);
      // Recommended follows the modal toggle choice.
      const { error: voteError } = await supabase!.from("votes").upsert(
        {
          book_id: bookId,
          user_id: currentUser.id,
          recommended,
          read: true,
        },
        { onConflict: "book_id,user_id" },
      );
      if (voteError) throw voteError;
      if (comment) {
        await supabase!.from("comments").insert({
          book_id: bookId,
          user_id: currentUser.id,
          updated_by: currentUser.id,
          text: sanitizeText(comment),
        });
      }
      await refresh();
    } catch (e) {
      setError(UI_TEXT.app.errors.couldNotAddBook((e as Error).message));
    }
  }

  async function handleToggleVote(
    bookId: string,
    field: "recommended" | "read",
    value: boolean,
  ) {
    if (!currentUser || !supabase) return;
    const current = books.find((b) => b.id === bookId);
    const mine = current?.votes.find((v) => v.user_id === currentUser.id);
    // Rules: Recommended = Yes implies Read = Yes; Read = No implies Recommended = No.
    let recommended = mine?.recommended ?? false;
    let read = mine?.read ?? false;
    if (field === "recommended") {
      recommended = value;
      if (value) read = true;
    } else {
      read = value;
      if (!value) recommended = false;
    }
    const next = {
      book_id: bookId,
      user_id: currentUser.id,
      recommended,
      read,
    };
    setBooks((prev) =>
      prev.map((b) => {
        if (b.id !== bookId) return b;
        const votes = mine
          ? b.votes.map((v) =>
              v.user_id === currentUser.id ? { ...v, ...next } : v,
            )
          : [...b.votes, next];
        return { ...b, votes };
      }),
    );
    await supabase
      .from("votes")
      .upsert(next, { onConflict: "book_id,user_id", ignoreDuplicates: false });
  }

  async function handleAddComment(bookId: string, text: string) {
    if (!currentUser) return;
    await supabase!.from("comments").insert({
      book_id: bookId,
      user_id: currentUser.id,
      updated_by: currentUser.id,
      text: sanitizeText(text),
    });
    await refresh();
  }

  async function handleEditComment(commentId: string, text: string) {
    if (!currentUser) return;
    const { error } = await supabase!
      .from("comments")
      .update({
        text: sanitizeText(text),
        updated_by: currentUser.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId);
    if (error) {
      setError(UI_TEXT.app.errors.couldNotEditComment(error.message));
      return;
    }
    await refresh();
  }

  if (!isSupabaseConfigured || !supabase) {
    return (
      <main className="page">
        <div className="card">
          <h1>{UI_TEXT.app.title}</h1>
          <p>
            {UI_TEXT.app.notConfigured.prompt}{" "}
            <code>{UI_TEXT.app.notConfigured.schemaSql}</code>
            {UI_TEXT.app.notConfigured.thenCopy}{" "}
            <code>{UI_TEXT.app.notConfigured.envExample}</code>{" "}
            {UI_TEXT.app.notConfigured.to}{" "}
            <code>{UI_TEXT.app.notConfigured.envLocal}</code>{" "}
            {UI_TEXT.app.notConfigured.withCredentials}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="page-header">
        <img
          src="/images/header.png"
          alt={UI_TEXT.app.headerAlt}
          className="page-header__img"
        />
        <h1>{UI_TEXT.app.title}</h1>
        <p className="tagline">{UI_TEXT.app.tagline}</p>
      </header>

      {error ? (
        <p className="error banner" role="alert">
          {error}
        </p>
      ) : null}

      <UserSection
        users={users}
        currentUser={currentUser}
        onConfirm={handleConfirmUser}
        onAddUser={handleAddUser}
        onLogout={handleLogout}
      />

      <AddBooks disabled={!currentUser} onAdd={handleAddBook} />

      <BookList
        books={books}
        usersById={usersById}
        currentUser={currentUser}
        onToggleVote={(id, field, value) =>
          void handleToggleVote(id, field, value)
        }
        onAddComment={(id, text) => void handleAddComment(id, text)}
        onEditComment={(commentId, text) =>
          void handleEditComment(commentId, text)
        }
      />

      <footer className="page-footer">
        {UI_TEXT.app.footer}
        <br />
        {UI_TEXT.app.dataSource}
      </footer>

      <BackToTop />
    </main>
  );
}

export default App;
