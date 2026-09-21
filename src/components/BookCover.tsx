import { useState } from "react";
import { coverUrl } from "../lib/bookCovers";
import { UI_TEXT } from "../lib/uiText";

interface BookCoverProps {
  cover_i?: number | null;
  title: string;
}

export function BookCover({ cover_i, title }: BookCoverProps) {
  const [failed, setFailed] = useState(false);
  const url = coverUrl(cover_i);
  const showImage = url !== null && !failed;

  return (
    <div className="book-cover book-cover--l">
      {showImage ? (
        <div className="book-cover__img">
          <img
            className="book-cover__img"
            src={url}
            alt={UI_TEXT.cover.alt(title)}
            loading="lazy"
            onError={() => setFailed(true)}
          />
        </div>
      ) : (
        <img
          className="book-cover__img"
          src="/images/book_cover_not_found.png"
          alt={UI_TEXT.cover.noCover}
          loading="lazy"
        />
      )}
    </div>
  );
}
