import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionsTable, { SessionRow } from "@/components/ui/SessionsTable";

function makeRow(overrides: Partial<SessionRow> = {}): SessionRow {
  return {
    id: "sess-1",
    title: "Building Better Databases",
    description: "A deep dive into DB design.",
    starts_at: "2026-06-12T09:00:00",
    room_name: "Ballroom A",
    speaker_names: ["Jane Smith"],
    is_confirmed: true,
    status: "Accepted",
    href: null,
    ...overrides,
  };
}

describe("SessionsTable", () => {
  it("renders session count", () => {
    render(<SessionsTable rows={[makeRow(), makeRow({ id: "sess-2", title: "SQL Tips" })]} />);
    expect(screen.getByText("2 sessions")).toBeInTheDocument();
  });

  it("uses singular 'session' for one row", () => {
    render(<SessionsTable rows={[makeRow()]} />);
    expect(screen.getByText("1 session")).toBeInTheDocument();
  });

  it("shows empty state when no rows", () => {
    render(<SessionsTable rows={[]} />);
    expect(screen.getByText(/No sessions yet/)).toBeInTheDocument();
  });

  it("shows filter empty state when filter matches nothing", async () => {
    render(<SessionsTable rows={[makeRow()]} />);
    await userEvent.type(screen.getByPlaceholderText("Filter by title…"), "zzznomatch");
    expect(screen.getByText("No sessions match your filter.")).toBeInTheDocument();
  });

  it("filters sessions by title (case-insensitive)", async () => {
    render(
      <SessionsTable
        rows={[
          makeRow({ id: "1", title: "SQL Tips" }),
          makeRow({ id: "2", title: "Building Better Databases" }),
        ]}
      />
    );
    await userEvent.type(screen.getByPlaceholderText("Filter by title…"), "sql");
    expect(screen.getByText("SQL Tips")).toBeInTheDocument();
    expect(screen.queryByText("Building Better Databases")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 sessions")).toBeInTheDocument();
  });

  it("renders a Sessionize link when href is provided", () => {
    render(<SessionsTable rows={[makeRow({ href: "https://sessionize.com/session/1" })]} />);
    const link = screen.getByRole("link", { name: "Building Better Databases" });
    expect(link).toHaveAttribute("href", "https://sessionize.com/session/1");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders plain text title when href is null", () => {
    render(<SessionsTable rows={[makeRow({ href: null })]} />);
    expect(screen.queryByRole("link", { name: "Building Better Databases" })).toBeNull();
    expect(screen.getByText("Building Better Databases")).toBeInTheDocument();
  });

  it("shows Confirmed badge for confirmed sessions", () => {
    render(<SessionsTable rows={[makeRow({ is_confirmed: true })]} />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("shows status text for unconfirmed sessions with a status", () => {
    render(<SessionsTable rows={[makeRow({ is_confirmed: false, status: "Waitlisted" })]} />);
    expect(screen.getByText("Waitlisted")).toBeInTheDocument();
  });

  it("shows speaker names joined by comma", () => {
    render(
      <SessionsTable
        rows={[makeRow({ speaker_names: ["Alice Brown", "Bob Chen"] })]}
      />
    );
    expect(screen.getByText("Alice Brown, Bob Chen")).toBeInTheDocument();
  });

  it("shows em dash when no room is assigned", () => {
    render(<SessionsTable rows={[makeRow({ room_name: null })]} />);
    // At least one em dash should appear in the document (room column)
    const dashes = screen.getAllByText("—");
    expect(dashes.length).toBeGreaterThan(0);
  });
});
