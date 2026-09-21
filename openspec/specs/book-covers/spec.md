# book-covers Specification

## Purpose

Resolving, persisting, and rendering book cover images from the Open Library covers API so saved books and search previews show a visual cover or a safe placeholder.

## Requirements

### Requirement: Resolve cover image URLs from the stored cover id

The system SHALL resolve a book cover image URL from a stored cover id, always at the large (L) size variant. When no cover id exists, the system SHALL NOT resolve any cover URL, including from a stored work OLID — instead the neutral placeholder contract in "Render a cover or neutral placeholder" applies.

#### Scenario: Cover resolved from cover id

- **WHEN** a book has a numeric Open Library cover id
- **THEN** the system resolves a cover image URL keyed to that cover id at the large size variant

#### Scenario: Cover resolved from work OLID

- **WHEN** a book has no cover id but has a stored work OLID
- **THEN** the system does not resolve a cover URL from the stored work OLID and shows the neutral placeholder in its place

#### Scenario: Size variant per surface

- **WHEN** a cover is shown on a saved book row in the book list or in an AddBooks search preview
- **THEN** the system always uses the large cover variant; there is no per-surface size selection

#### Scenario: No cover id resolves no cover URL

- **WHEN** a book has no cover id
- **THEN** the system resolves no cover image URL and shows the neutral placeholder in its place

### Requirement: Render a cover or neutral placeholder

The system SHALL display the resolved cover image at the large (L) size variant on each saved book row in the book list and on each search preview row, and SHALL render a fixed-dimension neutral placeholder image in place of any cover that cannot be displayed, without shifting or breaking the surrounding layout.

#### Scenario: Saved row shows the resolved cover image

- **WHEN** the book list renders a saved book whose cover resolves
- **THEN** the row shows the book's cover image at the large size variant

#### Scenario: Search preview shows the resolved cover image

- **WHEN** AddBooks renders a search preview row whose cover resolves
- **THEN** the row shows the book's cover image at the large size variant

#### Scenario: Placeholder for a book with no cover id

- **WHEN** a book has no cover id (saved row or search preview)
- **THEN** the system shows the `book_cover_not_found.png` placeholder image, with the same fixed dimensions as the cover slot, on BOTH surfaces

#### Scenario: Placeholder for a cover that fails to load

- **WHEN** a cover image fails to load
- **THEN** the system shows the `book_cover_not_found.png` placeholder image in its place, leaving the surrounding row layout unchanged

#### Scenario: Single image only

- **WHEN** the placeholder image itself cannot be displayed
- **THEN** the system makes no further fallback render (no placeholder-of-a-placeholder)

### Requirement: Persist the cover id with saved books

The system SHALL store the cover id of a chosen search result when that result has one.

#### Scenario: Cover id saved

- **WHEN** the user adds a book whose search preview carried a cover id
- **THEN** the stored book record keeps that cover id

#### Scenario: Book added without a cover

- **WHEN** the user adds a book whose search preview carried no cover id
- **THEN** the stored book record has no cover id and its cover slot shows the neutral placeholder