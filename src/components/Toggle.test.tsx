import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("shows the label and reflects the checked prop", () => {
    render(<Toggle label="Read" checked onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Read" })).toBeChecked();
  });

  it("fires onChange with the new value when toggled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Toggle label="Read" checked={false} onChange={onChange} />);
    await user.click(screen.getByRole("checkbox", { name: "Read" }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("stays inert when disabled", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <Toggle label="Read" checked={false} disabled onChange={onChange} />,
    );
    await user.click(screen.getByRole("checkbox", { name: "Read" }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
