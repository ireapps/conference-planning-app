import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SpeakersTable, { SpeakerRow } from "@/components/ui/SpeakersTable";

function makeRow(overrides: Partial<SpeakerRow> = {}): SpeakerRow {
  return {
    id: "spk-1",
    full_name: "Jane Smith",
    tag_line: "Data journalist",
    profile_picture: null,
    session_titles: ["Building Better Databases"],
    href: null,
    ...overrides,
  };
}

describe("SpeakersTable", () => {
  it("renders speaker count", () => {
    render(
      <SpeakersTable rows={[makeRow(), makeRow({ id: "spk-2", full_name: "Bob Chen" })]} />
    );
    expect(screen.getByText("2 speakers")).toBeInTheDocument();
  });

  it("uses singular 'speaker' for one row", () => {
    render(<SpeakersTable rows={[makeRow()]} />);
    expect(screen.getByText("1 speaker")).toBeInTheDocument();
  });

  it("shows empty state when no rows", () => {
    render(<SpeakersTable rows={[]} />);
    expect(screen.getByText(/No speakers yet/)).toBeInTheDocument();
  });

  it("shows filter empty state when filter matches nothing", async () => {
    render(<SpeakersTable rows={[makeRow()]} />);
    await userEvent.type(screen.getByPlaceholderText("Filter by name…"), "zzz");
    expect(screen.getByText("No speakers match your filter.")).toBeInTheDocument();
  });

  it("filters by full_name (case-insensitive)", async () => {
    render(
      <SpeakersTable
        rows={[
          makeRow({ id: "1", full_name: "Jane Smith" }),
          makeRow({ id: "2", full_name: "Bob Chen" }),
        ]}
      />
    );
    await userEvent.type(screen.getByPlaceholderText("Filter by name…"), "jane");
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.queryByText("Bob Chen")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 speakers")).toBeInTheDocument();
  });

  it("renders initials avatar when no profile picture", () => {
    render(<SpeakersTable rows={[makeRow({ profile_picture: null, full_name: "Jane Smith" })]} />);
    expect(screen.getByText("JS")).toBeInTheDocument();
  });

  it("renders image avatar when profile_picture is set", () => {
    render(
      <SpeakersTable
        rows={[makeRow({ profile_picture: "https://example.com/photo.jpg" })]}
      />
    );
    expect(screen.getByRole("img", { name: "Jane Smith" })).toHaveAttribute(
      "src",
      "https://example.com/photo.jpg"
    );
  });

  it("renders a Sessionize link when href is set", () => {
    render(<SpeakersTable rows={[makeRow({ href: "https://sessionize.com/speaker/1" })]} />);
    const link = screen.getByRole("link", { name: "Jane Smith" });
    expect(link).toHaveAttribute("href", "https://sessionize.com/speaker/1");
  });

  it("renders session titles as a list", () => {
    render(
      <SpeakersTable
        rows={[makeRow({ session_titles: ["Talk A", "Talk B"] })]}
      />
    );
    expect(screen.getByText("Talk A")).toBeInTheDocument();
    expect(screen.getByText("Talk B")).toBeInTheDocument();
  });

  it("shows em dash when speaker has no tag line", () => {
    render(<SpeakersTable rows={[makeRow({ tag_line: null })]} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });

  it("shows em dash when speaker has no sessions", () => {
    render(<SpeakersTable rows={[makeRow({ session_titles: [] })]} />);
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });
});
