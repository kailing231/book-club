export interface User {
  id: string;
  name: string;
  created_at: string;
}

export interface Book {
  id: string;
  book_api_id: string;
  title: string;
  authors: string[];
  subjects: string[];
  synopsis: string;
  cover_i?: number | null;
  created_at: string;
}

export interface Vote {
  book_id: string;
  user_id: string;
  recommended: boolean;
  read: boolean;
}

export interface Comment {
  id: string;
  book_id: string;
  user_id: string;
  updated_by: string;
  text: string;
  created_at: string;
  updated_at: string;
}

export interface BookRow extends Book {
  votes: Vote[];
  comments: Comment[];
}

export interface PreviewBook {
  book_api_id: string;
  title: string;
  authors: string[];
  subjects: string[];
  synopsis: string;
  cover_i?: number | null;
}

export type SortKey =
  | "rating"
  | "recommended"
  | "read"
  | "added-oldest"
  | "added-newest"
  | "comments-most"
  | "comments-least"
  | "title-asc"
  | "title-desc";

export interface BookFilters {
  title: string;
  authors: string;
  subjectInclude: string[];
  subjectExclude: string[];
}
