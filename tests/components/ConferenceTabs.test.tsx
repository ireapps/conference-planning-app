import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import ConferenceTabs from "@/components/ui/ConferenceTabs";

describe("ConferenceTabs", () => {
  it("renders all three tabs", () => {
    vi.mocked(usePathname).mockReturnValue("/conferences/conf-1/sessions");
    render(<ConferenceTabs conferenceId="conf-1" />);
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Speakers")).toBeInTheDocument();
    expect(screen.getByText("Grid")).toBeInTheDocument();
  });

  it("links each tab to the correct href", () => {
    vi.mocked(usePathname).mockReturnValue("/conferences/conf-1/sessions");
    render(<ConferenceTabs conferenceId="conf-1" />);
    expect(screen.getByText("Sessions").closest("a")).toHaveAttribute(
      "href",
      "/conferences/conf-1/sessions"
    );
    expect(screen.getByText("Speakers").closest("a")).toHaveAttribute(
      "href",
      "/conferences/conf-1/speakers"
    );
    expect(screen.getByText("Grid").closest("a")).toHaveAttribute(
      "href",
      "/conferences/conf-1/grid"
    );
  });

  it("applies active styles to Sessions tab when on sessions path", () => {
    vi.mocked(usePathname).mockReturnValue("/conferences/conf-1/sessions");
    render(<ConferenceTabs conferenceId="conf-1" />);
    const sessionsLink = screen.getByText("Sessions").closest("a")!;
    expect(sessionsLink.className).toContain("border-indigo-600");
    const speakersLink = screen.getByText("Speakers").closest("a")!;
    expect(speakersLink.className).not.toContain("border-indigo-600");
  });

  it("applies active styles to Speakers tab when on speakers path", () => {
    vi.mocked(usePathname).mockReturnValue("/conferences/conf-1/speakers");
    render(<ConferenceTabs conferenceId="conf-1" />);
    const speakersLink = screen.getByText("Speakers").closest("a")!;
    expect(speakersLink.className).toContain("border-indigo-600");
  });

  it("applies active styles to Grid tab when on grid path", () => {
    vi.mocked(usePathname).mockReturnValue("/conferences/conf-1/grid");
    render(<ConferenceTabs conferenceId="conf-1" />);
    const gridLink = screen.getByText("Grid").closest("a")!;
    expect(gridLink.className).toContain("border-indigo-600");
  });
});
