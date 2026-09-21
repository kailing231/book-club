# user-session Specification

## Purpose

Lets club members identify themselves, see who is signed in, and sign out; the signed-in state also gates user-dependent features and locks the identification controls while a user is active.

## Requirements

### Requirement: Signed-in user is identified

The system SHALL display the signed-in user's name beside a "Signed in as" label whenever a user is signed in.

#### Scenario: User signs in

- **WHEN** a user is signed in
- **THEN** the identification section shows "Signed in as {name}"

#### Scenario: Nobody is signed in

- **WHEN** no user is signed in
- **THEN** no "Signed in as" note is shown

### Requirement: User can sign out

The system SHALL provide a Logout control placed to the right of the "Signed in as {name}" note, and activating it SHALL sign the user out immediately without confirmation.

#### Scenario: Sign out from the identification section

- **WHEN** a signed-in user activates the Logout control
- **THEN** the user is signed out immediately
- **THEN** the "Signed in as" note disappears

#### Scenario: Sign out clears identification state

- **WHEN** a signed-in user activates the Logout control
- **THEN** the search input is cleared and no user remains selected

### Requirement: Identification controls locked while signed in

While a user is signed in, the identification controls (the user search input, its dropdown, and the add-user control) SHALL be non-interactive but remain visible; the Logout control SHALL be the only interactive control in the section.

#### Scenario: Search input is inert while signed in

- **WHEN** a user is signed in
- **THEN** the user search input is disabled and typing has no effect

#### Scenario: Add-user is inert while signed in

- **WHEN** a user is signed in
- **THEN** the add-user control is disabled

#### Scenario: Controls remain visible while signed in

- **WHEN** a user is signed in
- **THEN** the disabled identification controls stay visible (greyed out) rather than hidden

### Requirement: Signed-in state gates feature access

The system SHALL require a signed-in user for user-dependent features (adding books and commenting), and SHALL revert those features to their signed-out state when the user signs out. Commenting SHALL cover both adding a new comment to a book (available to a signed-in user even when they already have a comment on that book) and editing one's own comments; signing out SHALL remove access to both. When the user signs out, the system SHALL also clear the AddBooks section's draft state, collapse the section closed, and discard any search still in flight at the moment of sign-out.

#### Scenario: User-dependent features require a sign-in

- **WHEN** no user is signed in
- **THEN** adding books is disabled and commenting prompts for a sign-in

#### Scenario: Signing out reverts feature gates

- **WHEN** a signed-in user signs out
- **THEN** adding books and commenting revert to their signed-out, gated state

#### Scenario: Signing in enables adding and editing comments

- **WHEN** a user is signed in
- **THEN** they can add a new comment to a book even if they already have a comment on it
- **THEN** they can edit their own comments

#### Scenario: Signing out clears the AddBooks search draft

- **WHEN** a signed-in user has a search query entered and preview rows shown in the AddBooks section, then signs out
- **THEN** the search query is cleared
- **THEN** all preview rows are removed

#### Scenario: Signing out clears AddBooks feedback and modal state

- **WHEN** a signed-in user has an error message or an open add-confirmation modal in the AddBooks section, then signs out
- **THEN** the error message is removed
- **THEN** the confirmation modal is closed
- **THEN** the Recommended toggle is reset to off

#### Scenario: Signing out collapses the AddBooks section

- **WHEN** a signed-in user signs out while the AddBooks section is expanded
- **THEN** the AddBooks section collapses closed, as in its signed-out initial state

#### Scenario: Signing out discards late search results

- **WHEN** a signed-in user signs out while an AddBooks search is still in flight
- **THEN** the results of that search are discarded when they arrive
- **THEN** the AddBooks section remains empty rather than repopulating with those results