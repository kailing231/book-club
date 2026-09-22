import { useMemo, useState } from "react";
import type { User } from "../lib/types";
import { isValidUsername } from "../lib/validation";
import { UI_TEXT } from "../lib/uiText";

interface UserSectionProps {
  users: User[];
  currentUser: User | null;
  onConfirm: (user: User) => void;
  onAddUser: (name: string) => void;
  onLogout: () => void;
}

export function UserSection({
  users,
  currentUser,
  onConfirm,
  onAddUser,
  onLogout,
}: UserSectionProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const [error, setError] = useState<string>("");

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users
      .filter((u) => u.name.toLowerCase().includes(q))
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );
  }, [users, query]);

  const showDropdown = query.trim() !== "";

  const exactMatch = useMemo(
    () =>
      users.find((u) => u.name.toLowerCase() === query.trim().toLowerCase()) ??
      null,
    [users, query],
  );

  function pickUser(u: User) {
    setSelected(u);
    setQuery(u.name);
    setError("");
  }

  function handleConfirm() {
    setError("");
    const user = selected ?? exactMatch;
    if (user) {
      onConfirm(user);
      setQuery("");
      setSelected(null);
      return;
    }
    setError(UI_TEXT.user.errors.pickFirst);
  }

  const confirmDisabled = selected === null && exactMatch === null;
  const addUserDisabled = !confirmDisabled || query.trim() === "";
  const locked = currentUser !== null;

  function handleAddUser() {
    setError("");
    const name = query.trim();
    if (!isValidUsername(name)) {
      setError(UI_TEXT.user.errors.invalidName);
      return;
    }
    if (users.some((u) => u.name.toLowerCase() === name.toLowerCase())) {
      setError(UI_TEXT.user.errors.exists);
      return;
    }
    onAddUser(name);
    setQuery("");
    setSelected(null);
  }

  function handleLogout() {
    setQuery("");
    setSelected(null);
    setError("");
    onLogout();
  }

  return (
    <section
      className="card user-section"
      aria-label={UI_TEXT.user.sectionAria}
    >
      <div className="actions">
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleAddUser}
          disabled={addUserDisabled || locked}
        >
          {UI_TEXT.user.addUser}
        </button>
      </div>

      <label className="field">
        <span className="field__label">{UI_TEXT.user.welcome}</span>
        <input
          type="text"
          value={query}
          placeholder={UI_TEXT.user.searchPlaceholder}
          autoComplete="off"
          disabled={locked}
          onChange={(e) => {
            setQuery(e.target.value);
            setSelected(null);
          }}
          list={undefined}
        />
      </label>

      {/* Searchable dropdown */}
      <div className="dropdown">
        {showDropdown ? (
          <ul className="dropdown__list">
            {matches.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  className={`dropdown__item ${selected?.id === u.id ? "dropdown__item--selected" : ""}`}
                  disabled={locked}
                  onClick={() => pickUser(u)}
                >
                  {u.name}
                </button>
              </li>
            ))}
            <li className="dropdown__footer">
              <button
                type="button"
                className="btn btn--block"
                onClick={handleConfirm}
                disabled={confirmDisabled || locked}
              >
                {UI_TEXT.user.login}
              </button>
            </li>
          </ul>
        ) : null}
      </div>

      {currentUser ? (
        <div className="user-section__signed-in">
          <p className="note">
            {UI_TEXT.user.signedInAs} <strong>{currentUser.name}</strong>
          </p>
          <button
            type="button"
            className="btn btn--small"
            onClick={handleLogout}
          >
            {UI_TEXT.user.logout}
          </button>
        </div>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
