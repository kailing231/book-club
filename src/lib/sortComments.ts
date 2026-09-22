import type { Comment } from "./types";

export function sortComments(comments: Comment[]): Comment[] {
  return [...comments].sort(
    (a, b) =>
      a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id),
  );
}
