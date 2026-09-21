# comments Specification

## Purpose

Lets signed-in club members contribute to a book's discussion by adding their own comments over time and editing the ones they wrote, while keeping every book's comments ordered oldest-first.

## Requirements

### Requirement: Signed-in user can add comments to a book

A signed-in user SHALL be able to add a comment to a book at any time, including when they already have a comment on that book. Submitting a new comment SHALL append it to the book's comments and SHALL NOT alter or replace any existing comment.

#### Scenario: Adding a first comment

- **WHEN** a signed-in user submits a comment on a book that has no comments from them
- **THEN** the comment appears in the book's comment list

#### Scenario: Adding a further comment after already commenting

- **WHEN** a signed-in user who already has a comment on a book submits another comment on that book
- **THEN** the add control remains available for the user
- **THEN** the new comment is appended alongside the earlier one and the earlier comment is unchanged

### Requirement: Signed-in user can edit their own comments

A signed-in user SHALL be able to edit a comment they authored on a book, replacing its text in place. The edit control SHALL be offered only on comments authored by the signed-in user, and editing SHALL NOT change the comment's position or creation time.

#### Scenario: Edit control appears only on own comments

- **WHEN** a signed-in user views a book whose comments include one of their own and one from another user
- **THEN** an edit control appears on their own comment
- **THEN** no edit control appears on the other user's comment

#### Scenario: Saving an edit replaces the comment text

- **WHEN** a signed-in user edits one of their own comments and saves the new text
- **THEN** the comment displays the new text in place

### Requirement: Comments always render oldest-first

Each book's comments SHALL render in oldest-first order: ascending by creation time, with comments sharing the same creation time ordered deterministically so the displayed order is stable across loads. Editing a comment SHALL NOT move it in this order.

#### Scenario: Comments ordered by creation time

- **WHEN** a book has comments created at different times
- **THEN** the comment with the earliest creation time appears first and the one with the latest appears last

#### Scenario: Same-instant comments keep a stable order

- **WHEN** two comments on the same book have the same creation time
- **THEN** they render in a deterministic order that is the same every time the book loads

#### Scenario: Editing does not reorder

- **WHEN** a signed-in user edits an existing comment
- **THEN** the comment stays in its earlier position in the oldest-first order