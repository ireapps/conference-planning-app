import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import ConferencesNav from "@/components/ui/ConferencesNav";

const CONFERENCES = [
  { id: "conf-1", name: "IRE 2026", year: 2026, is_current: true },
  { id: "conf-2", name: "NICAR 2026", year: 2026, is_current: false },
  { id: "conf-3", name: "IRE 2025", year: 2025, is_current: false },
];

describe("ConferencesNav", () => {
  it("renders the Conferences button", () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    expect(screen.getByRole("button", { name: /conferences/i })).toBeInTheDocument();
  });

  it("dropdown is hidden initially", () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    expect(screen.queryByPlaceholderText("Search conferences…")).not.toBeInTheDocument();
  });

  it("opens dropdown on button click", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    expect(screen.getByPlaceholderText("Search conferences…")).toBeInTheDocument();
    expect(screen.getByText("IRE 2026")).toBeInTheDocument();
    expect(screen.getByText("NICAR 2026")).toBeInTheDocument();
  });

  it("closes dropdown on second button click", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    const btn = screen.getByRole("button", { name: /conferences/i });
    await userEvent.click(btn);
    await userEvent.click(btn);
    expect(screen.queryByPlaceholderText("Search conferences…")).not.toBeInTheDocument();
  });

  it("filters conferences by name", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    await userEvent.type(screen.getByPlaceholderText("Search conferences…"), "nicar");
    expect(screen.getByText("NICAR 2026")).toBeInTheDocument();
    expect(screen.queryByText("IRE 2026")).not.toBeInTheDocument();
  });

  it("shows 'No matches' when filter has no results", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    await userEvent.type(screen.getByPlaceholderText("Search conferences…"), "zzznomatch");
    expect(screen.getByText("No matches")).toBeInTheDocument();
  });

  it("shows Current badge for the current conference", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    expect(screen.getByText("Current")).toBeInTheDocument();
  });

  it("closes dropdown on Escape key", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    expect(screen.getByPlaceholderText("Search conferences…")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByPlaceholderText("Search conferences…")).not.toBeInTheDocument();
  });

  it("navigates to first result on Enter key", async () => {
    const mockPush = vi.fn();
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      replace: vi.fn(),
      back: vi.fn(),
    } as unknown as ReturnType<typeof useRouter>);

    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    await userEvent.type(screen.getByPlaceholderText("Search conferences…"), "ire 2026");
    await userEvent.keyboard("{Enter}");
    expect(mockPush).toHaveBeenCalledWith("/conferences/conf-1/sessions");
  });

  it("renders footer links for View all and New conference", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    expect(screen.getByText("View all")).toBeInTheDocument();
    expect(screen.getByText("+ New conference")).toBeInTheDocument();
  });

  it("conference links point to the sessions page", async () => {
    render(<ConferencesNav conferences={CONFERENCES} />);
    await userEvent.click(screen.getByRole("button", { name: /conferences/i }));
    const link = screen.getByText("IRE 2026").closest("a");
    expect(link).toHaveAttribute("href", "/conferences/conf-1/sessions");
  });
});
