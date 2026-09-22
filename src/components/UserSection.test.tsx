import { useState } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { User } from "../lib/types";
import { UI_TEXT } from "../lib/uiText";
import { UserSection } from "./UserSection";

function signedInUser(
  user: User = { id: "u1", name: "Alice", created_at: "" },
): User {
  return user;
}

const ALL_USERS: User[] = [
  { id: "u1", name: "Alice", created_at: "" },
  { id: "u2", name: "Bob", created_at: "" },
];

function setup(
  overrides: { currentUser?: User | null; onLogout?: () => void } = {},
) {
  const onConfirm = vi.fn();
  const onAddUser = vi.fn();
  const onLogout = overrides.onLogout ?? vi.fn();
  render(
    <UserSection
      users={ALL_USERS}
      currentUser={overrides.currentUser ?? null}
      onConfirm={onConfirm}
      onAddUser={onAddUser}
      onLogout={onLogout}
    />,
  );
  return { onConfirm, onAddUser, onLogout };
}

function SignedInHarness() {
  const [current, setCurrent] = useState<User | null>(signedInUser());
  return (
    <UserSection
      users={ALL_USERS}
      currentUser={current}
      onConfirm={() => {}}
      onAddUser={() => {}}
      onLogout={() => setCurrent(null)}
    />
  );
}

describe("UserSection signed out", () => {
  it("keeps the search input enabled", () => {
    setup();
    expect(
      screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder),
    ).not.toBeDisabled();
  });

  it("enables Add User once a valid new name is typed", async () => {
    const user = userEvent.setup();
    setup();
    const addButton = screen.getByRole("button", {
      name: UI_TEXT.user.addUser,
    });
    expect(addButton).toBeDisabled();
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder),
      "Carol",
    );
    expect(addButton).toBeEnabled();
  });

  it("does not show a Logout button", () => {
    setup();
    expect(
      screen.queryByRole("button", { name: UI_TEXT.user.logout }),
    ).not.toBeInTheDocument();
  });

  it("shows no dropdown while the search is empty", () => {
    setup();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("lists matching users in the dropdown while typing", async () => {
    const user = userEvent.setup();
    setup();
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder),
      "Ali",
    );
    expect(screen.getByRole("list")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Alice" })).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Bob" }),
    ).not.toBeInTheDocument();
  });

  it("confirms a picked user from the dropdown", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    const search = screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder);
    await user.type(search, "Ali");
    await user.click(screen.getByRole("button", { name: "Alice" }));
    const login = screen.getByRole("button", { name: UI_TEXT.user.login });
    expect(login).toBeEnabled();
    await user.click(login);
    expect(onConfirm).toHaveBeenCalledWith(ALL_USERS[0]);
    expect(search).toHaveValue("");
  });

  it("confirms an exact-match user without a selection", async () => {
    const user = userEvent.setup();
    const { onConfirm } = setup();
    const search = screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder);
    await user.type(search, "Alice");
    const login = screen.getByRole("button", { name: UI_TEXT.user.login });
    expect(login).toBeEnabled();
    await user.click(login);
    expect(onConfirm).toHaveBeenCalledWith(ALL_USERS[0]);
  });

  it("adds a new user from the search text", async () => {
    const user = userEvent.setup();
    const { onAddUser } = setup();
    const search = screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder);
    await user.type(search, "Carol");
    await user.click(
      screen.getByRole("button", { name: UI_TEXT.user.addUser }),
    );
    expect(onAddUser).toHaveBeenCalledWith("Carol");
    expect(search).toHaveValue("");
  });
});

describe("UserSection signed in", () => {
  it("shows the signed-in note with a Logout button beside it", () => {
    setup({ currentUser: signedInUser() });
    expect(screen.getByText(UI_TEXT.user.signedInAs)).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: UI_TEXT.user.logout }),
    ).toBeInTheDocument();
  });

  it("disables the search input and Add User button while keeping them visible", () => {
    setup({ currentUser: signedInUser() });
    const input = screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder);
    const addButton = screen.getByRole("button", {
      name: UI_TEXT.user.addUser,
    });
    expect(input).toBeDisabled();
    expect(addButton).toBeDisabled();
    expect(input).toBeInTheDocument();
    expect(addButton).toBeInTheDocument();
  });

  it("does not open the dropdown while signed in", async () => {
    const user = userEvent.setup();
    setup({ currentUser: signedInUser() });
    await user.type(
      screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder),
      "Ali",
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("calls onLogout when the Logout button is clicked", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    setup({ currentUser: signedInUser(), onLogout });
    await user.click(screen.getByRole("button", { name: UI_TEXT.user.logout }));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it("returns to the signed-out state after logging out", async () => {
    const user = userEvent.setup();
    render(<SignedInHarness />);
    await user.click(screen.getByRole("button", { name: UI_TEXT.user.logout }));
    expect(screen.queryByText(UI_TEXT.user.signedInAs)).not.toBeInTheDocument();
    const search = screen.getByPlaceholderText(UI_TEXT.user.searchPlaceholder);
    expect(search).toBeEnabled();
    expect(search).toHaveValue("");
    expect(
      screen.getByRole("button", { name: UI_TEXT.user.addUser }),
    ).toBeDisabled();
  });
});
