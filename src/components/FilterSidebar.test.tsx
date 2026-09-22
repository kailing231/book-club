import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { BookFilters } from "../lib/types";
import { UI_TEXT } from "../lib/uiText";
import { FilterSidebar } from "./FilterSidebar";

function defaultFilters(): BookFilters {
  return { title: "", authors: "", subjectInclude: [], subjectExclude: [] };
}

describe("FilterSidebar", () => {
  it("renders nothing when closed", () => {
    render(
      <FilterSidebar
        open={false}
        allSubjects={["Science Fiction"]}
        filters={defaultFilters()}
        onChange={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  });

  it("moves a subject to subjectInclude when its include radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSidebar
        open
        allSubjects={["Science Fiction", "Classics"]}
        filters={defaultFilters()}
        onChange={onChange}
        onClose={() => {}}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Science Fiction" });
    await user.click(
      within(group).getByRole("radio", { name: "Include: Science Fiction" }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ subjectInclude: ["Science Fiction"] }),
    );
  });

  it("moves a subject to subjectExclude when its exclude radio is chosen", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSidebar
        open
        allSubjects={["Science Fiction"]}
        filters={defaultFilters()}
        onChange={onChange}
        onClose={() => {}}
      />,
    );

    const group = screen.getByRole("radiogroup", { name: "Science Fiction" });
    await user.click(
      within(group).getByRole("radio", { name: "Exclude: Science Fiction" }),
    );

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ subjectExclude: ["Science Fiction"] }),
    );
  });

  it("clears all filters when reset is pressed", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <FilterSidebar
        open
        allSubjects={["Science Fiction"]}
        filters={{
          title: "dune",
          authors: "herbert",
          subjectInclude: [],
          subjectExclude: [],
        }}
        onChange={onChange}
        onClose={() => {}}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.filter.resetAll }),
    );

    expect(onChange).toHaveBeenCalledWith({
      title: "",
      authors: "",
      subjectInclude: [],
      subjectExclude: [],
    });
  });

  it("closes via the close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <FilterSidebar
        open
        allSubjects={["Science Fiction"]}
        filters={defaultFilters()}
        onChange={() => {}}
        onClose={onClose}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: UI_TEXT.common.close }),
    );

    expect(onClose).toHaveBeenCalled();
  });
});
