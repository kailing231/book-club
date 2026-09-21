# book-search Specification

## Purpose

Searching for book metadata by title or ISBN via the Open Library API to build add-book preview rows (title, authors, subjects, synopsis).

## Requirements

### Requirement: Search for books by title or ISBN

The system SHALL search for books using an Open Library query derived from the user's input: a valid ISBN is matched exactly, while any other input is matched as a book title search that tolerates partial titles.

#### Scenario: Search by ISBN

- **WHEN** the user enters a query that looks like a 10- or 13-digit ISBN
- **THEN** the system queries Open Library for that exact ISBN and returns the matching works

#### Scenario: Search by partial title

- **WHEN** the user enters a partial or full book title
- **THEN** the system returns works whose titles match, without requiring the exact full title

#### Scenario: Blank query

- **WHEN** the user submits an empty or whitespace-only query
- **THEN** the system returns no results and makes no API request

### Requirement: Show only English-language editions

The system SHALL return only English-language editions of a work.

#### Scenario: Mixed-language results

- **WHEN** Open Library returns both English and non-English editions for a query
- **THEN** the system shows only the English editions

### Requirement: Preview rows include full metadata

Each preview row SHALL include the work's title, authors, subjects, a synopsis, and the Open Library cover id when the result provides one.

#### Scenario: Synopsis fallback to work description

- **WHEN** a result has no first-sentence synopsis
- **THEN** the system uses the Open Library work description as the synopsis (which may be empty)

#### Scenario: Subject noise filtered

- **WHEN** a result's subject list contains catalog noise such as "in library" or "accessible book"
- **THEN** the system excludes those entries from the subjects shown

#### Scenario: Cover id included in results

- **WHEN** Open Library returns a cover id for a search result
- **THEN** the preview row carries that cover id

### Requirement: Limit and de-duplicate results

The system SHALL return at most six preview rows and SHALL collapse duplicate editions of the same work into a single row.

#### Scenario: Duplicate works collapsed

- **WHEN** the same work appears more than once in the result set
- **THEN** the system shows only one row for that work

#### Scenario: Result cap enforced

- **WHEN** a query matches more than six works
- **THEN** the system returns at most six preview rows

### Requirement: Cache search results locally

The system SHALL cache search results in the browser keyed by query and serve cached results without re-querying Open Library while the entry is fresh.

#### Scenario: Serve from cache within the freshness window

- **WHEN** the same query is searched again within one hour of the previous search
- **THEN** the system returns the cached results without calling Open Library

#### Scenario: Refetch after the cache entry expires

- **WHEN** a query's cached entry is older than one hour
- **THEN** the system re-queries Open Library and replaces the cached entry

#### Scenario: Stale results invalidated on provider change

- **WHEN** the app switches book metadata provider
- **THEN** the system does not serve results cached under the previous provider

### Requirement: Report empty and failed searches

The system SHALL report the outcome of a search to the user: no-results when the query matches nothing, and a failure message when the Open Library request itself fails.

#### Scenario: No results found

- **WHEN** the query matches no works
- **THEN** the system shows a "no results" message

#### Scenario: Open Library request fails

- **WHEN** the Open Library request errors
- **THEN** the system shows a failure message and no preview rows
