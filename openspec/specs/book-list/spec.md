# book-list Specification

## Purpose

Specifying how the book list lays out each saved-book row into identity and detail sections: a top block with the cover and recommended rating beside the bibliographic fields, and a bottom block with synopsis, stats, toggles, and collapsible comments.

## Requirements

### Requirement: Book rows split into top and bottom sections

The system SHALL render each saved-book row as a top section followed by a bottom section, keeping the section split visible for every saved book in the list.

#### Scenario: Row shows two sections

- **WHEN** the book list renders a saved book
- **THEN** the row is laid out as a top section followed by a bottom section

### Requirement: Top section anchors the cover beside the recommended rating

The top section SHALL show the cover at its left and a metadata column on its right whose first row holds the title on the left and the recommended-rating badge on the right; the authors and subjects SHALL follow below that row, left-aligned. The recommended-rating badge SHALL display only the rounded percentage of users who recommend the book, and hovering the badge SHALL reveal a tooltip stating that percentage as `<percent>% of users recommends this book.`

#### Scenario: Cover and rating anchored

- **WHEN** a saved-book row renders
- **THEN** the cover appears at the left of the top section
- **THEN** the title and the recommended-rating badge share the first row of the metadata column, with the badge anchored to the right of the title

#### Scenario: Bibliographic fields left-aligned below the rating row

- **WHEN** a saved-book row renders
- **THEN** the title appears at the left of the first metadata row
- **THEN** the authors and subjects appear below the first metadata row, left-aligned

#### Scenario: Badge shows the percentage only

- **WHEN** a saved-book row renders a book that 75% of users recommend
- **THEN** the recommended-rating badge displays "75%"
- **THEN** the badge does not show the word "Recommended"

#### Scenario: Badge tooltip explains the percentage

- **WHEN** the user hovers the recommended-rating badge on a book that 75% of users recommend
- **THEN** a tooltip appears reading "75% of users recommends this book."

### Requirement: Bottom section holds the remaining row content

The bottom section SHALL contain the synopsis, the recommended and read counts, the recommend and read toggles, and the collapsible comments.

#### Scenario: Content shown in the bottom section

- **WHEN** a saved-book row renders
- **THEN** the synopsis, the recommended and read counts, the recommend and read toggles, and the collapsible comments appear in the bottom section

### Requirement: Comments remain individually collapsible

Collapsing a row's comments SHALL hide only the comments, leaving the top section and the rest of the bottom section visible.

#### Scenario: Collapse hides only the comments

- **WHEN** the user collapses a row's comments
- **THEN** only the comments are hidden
- **THEN** the top section and the remaining bottom-section content stay visible

#### Scenario: Expand restores the comments

- **WHEN** the user expands a collapsed row's comments
- **THEN** the comments reappear in their place in the bottom section

### Requirement: Top section stacks on narrow screens

On a viewport 360px wide or narrower, the top section SHALL stack the cover above the metadata column while preserving the top/bottom section order and the badge's top-right placement within the metadata column. On viewports wider than 360px the top section SHALL keep the cover beside the metadata column, narrowing the metadata column so the cover and the metadata fit within the available width.

#### Scenario: Narrow viewport reflows the top section

- **WHEN** the viewport width is 360px or less
- **THEN** the cover appears above the metadata column
- **THEN** the metadata column keeps the title and the recommended-rating badge sharing the first row, with the badge anchored to its right and the authors and subjects left-aligned below
- **THEN** the bottom section remains below the top section

#### Scenario: Narrow viewport keeps the cover beside the metadata

- **WHEN** the viewport is wider than 360px but too narrow to display the cover beside an unconstrained metadata column
- **THEN** the cover remains at the left of the top section
- **THEN** the metadata column narrows to fit alongside the cover
- **THEN** the title, authors, and subjects wrap naturally within the narrowed metadata column
- **THEN** the bottom section remains below the top section

#### Scenario: Former stacking breakpoint no longer stacks

- **WHEN** the viewport width is between 361px and 480px inclusive
- **THEN** the top section keeps the cover beside the metadata column rather than stacking the cover above it

### Requirement: Display control selects how many books show at once

The book list SHALL provide a "Display" dropdown at the top-right of the list toolbar with the options "Infinite", "10", and "50". The selected option SHALL control how many matching books appear at once, with "Infinite" as the default. The selection SHALL reset to "Infinite" whenever the list is reloaded.

#### Scenario: Display dropdown sits at the top-right of the toolbar

- **WHEN** the book list renders its toolbar
- **THEN** a "Display" dropdown appears at the top-right of the toolbar
- **THEN** the dropdown offers "Infinite", "10", and "50"
- **THEN** "Infinite" is selected by default

#### Scenario: Display resets to Infinite after reload

- **WHEN** the user selects "10" in the Display dropdown and reloads the page
- **THEN** the Display dropdown shows "Infinite" again
- **THEN** the list shows every matching book rather than paginated results

### Requirement: Infinite mode shows every matching book without pagination

When the Display option is "Infinite", the book list SHALL render all matching books in a single list and SHALL NOT show pagination controls.

#### Scenario: Every matching book renders in Infinite mode

- **WHEN** the Display option is "Infinite" and 37 books match the current sort and filters
- **THEN** all 37 books appear in the list

#### Scenario: No pagination controls in Infinite mode

- **WHEN** the Display option is "Infinite"
- **THEN** no page-number or Previous/Next controls appear below the list

### Requirement: Fixed page sizes paginate matching books

When the Display option is "10" or "50", the book list SHALL split the matching books into pages of that size, showing one page at a time with the first page active when pagination begins.

#### Scenario: Page shows up to the selected number of books

- **WHEN** the Display option is "10" and 37 books match
- **THEN** pages 1 through 4 exist
- **THEN** page 1 shows the first 10 matching books
- **THEN** page 4 shows the remaining 7 books

#### Scenario: A page at the limit holds the full page

- **WHEN** the Display option is "50" and exactly 50 books match
- **THEN** exactly one page exists, showing all 50 books

#### Scenario: First page is active for a fresh selection

- **WHEN** the user changes the Display option from "Infinite" to a fixed page size
- **THEN** page 1 is the active page

### Requirement: Page controls show all numbers for up to five pages

When pagination is active and the page count is five or fewer, the book list SHALL show a numbered control for every page at the bottom of the list.

#### Scenario: All page numbers shown for five or fewer pages

- **WHEN** the Display option is "10" and 37 books match, producing 4 pages
- **THEN** the controls at the bottom of the list show the numbers 1, 2, 3, and 4

#### Scenario: Selected page control is distinguishable

- **WHEN** page 2 is active among four pages
- **THEN** the page 2 control is marked as the current page

### Requirement: Page controls compact to first, second, and last page above five pages

When pagination is active and the page count exceeds five, the book list SHALL show the controls "1, 2, ..., <last page>" at the bottom of the list.

#### Scenario: Many pages collapse to the compact form

- **WHEN** the Display option is "10" and 137 books match, producing 14 pages
- **THEN** the controls at the bottom of the list show 1, 2, an ellipsis, and 14

### Requirement: Previous and Next controls navigate pages

When pagination is active, the book list SHALL provide Previous and Next controls alongside the numbered page controls. Previous SHALL be disabled on the first page and Next SHALL be disabled on the last page, and selecting either SHALL move to the adjacent page.

#### Scenario: Previous is disabled on the first page

- **WHEN** the active page is 1
- **THEN** the Previous control is disabled

#### Scenario: Next advances to the following page

- **WHEN** the active page is 1 of 3
- **THEN** selecting Next shows page 2

#### Scenario: Next is disabled on the last page

- **WHEN** the active page is the last of 3
- **THEN** the Next control is disabled

#### Scenario: Selecting a numbered page jumps to it

- **WHEN** the controls show 1, 2, an ellipsis, and 14
- **THEN** selecting the control labeled 14 shows page 14

### Requirement: Active page resets to one on sort, filter, or page-size change

When pagination is active, the book list SHALL reset the active page to 1 whenever the sort, the filters, or the Display option changes.

#### Scenario: Changing the sort resets to the first page

- **WHEN** the user is on page 3 and changes the sort order
- **THEN** the active page becomes 1

#### Scenario: Changing the filters resets to the first page

- **WHEN** the user is on page 3 and changes a filter
- **THEN** the active page becomes 1

#### Scenario: Changing the Display value resets to the first page

- **WHEN** the user is on page 3 and changes the Display option from "10" to "50"
- **THEN** the active page becomes 1