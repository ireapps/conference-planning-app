import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ScheduleGrid, { GridSession, GridRoom } from "@/components/ui/ScheduleGrid";

const ROOMS: GridRoom[] = [
  { id: "room-1", name: "Ballroom A" },
  { id: "room-2", name: "Room 101" },
];

function makeSession(overrides: Partial<GridSession> = {}): GridSession {
  return {
    id: "sess-1",
    title: "Opening Keynote",
    room_id: "room-1",
    starts_at: "2026-06-12T09:00:00",
    is_confirmed: true,
    status: "Accepted",
    speaker_names: ["Jane Smith"],
    href: null,
    ...overrides,
  };
}

describe("ScheduleGrid", () => {
  it("shows empty state when no sessions have starts_at or room_id", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[makeSession({ starts_at: null }), makeSession({ room_id: null })]}
      />
    );
    expect(screen.getByText(/No scheduled sessions yet/)).toBeInTheDocument();
  });

  it("renders room headers", () => {
    render(<ScheduleGrid rooms={ROOMS} sessions={[makeSession()]} />);
    expect(screen.getByText("Ballroom A")).toBeInTheDocument();
  });

  it("only shows rooms that have sessions on the selected day", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[makeSession({ room_id: "room-1" })]}
      />
    );
    expect(screen.getByText("Ballroom A")).toBeInTheDocument();
    expect(screen.queryByText("Room 101")).not.toBeInTheDocument();
  });

  it("renders session title in the correct cell", () => {
    render(<ScheduleGrid rooms={ROOMS} sessions={[makeSession()]} />);
    expect(screen.getByText("Opening Keynote")).toBeInTheDocument();
  });

  it("renders speaker names below the title", () => {
    render(<ScheduleGrid rooms={ROOMS} sessions={[makeSession()]} />);
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
  });

  it("renders Confirmed badge for confirmed sessions", () => {
    render(<ScheduleGrid rooms={ROOMS} sessions={[makeSession({ is_confirmed: true })]} />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("renders status badge for unconfirmed sessions", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[makeSession({ is_confirmed: false, status: "Waitlisted" })]}
      />
    );
    expect(screen.getByText("Waitlisted")).toBeInTheDocument();
  });

  it("renders a link when href is provided", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[makeSession({ href: "https://sessionize.com/session/1" })]}
      />
    );
    const link = screen.getByRole("link", { name: "Opening Keynote" });
    expect(link).toHaveAttribute("href", "https://sessionize.com/session/1");
  });

  it("shows day selector buttons for multi-day schedules", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[
          makeSession({ id: "1", starts_at: "2026-06-12T09:00:00" }),
          makeSession({ id: "2", starts_at: "2026-06-13T09:00:00" }),
        ]}
      />
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it("switches day when a day button is clicked", async () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[
          makeSession({ id: "1", title: "Day One Talk", starts_at: "2026-06-12T09:00:00" }),
          makeSession({ id: "2", title: "Day Two Talk", starts_at: "2026-06-13T09:00:00" }),
        ]}
      />
    );

    // First day is selected by default
    expect(screen.getByText("Day One Talk")).toBeInTheDocument();
    expect(screen.queryByText("Day Two Talk")).not.toBeInTheDocument();

    // Click second day button
    const buttons = screen.getAllByRole("button");
    await userEvent.click(buttons[1]);
    expect(screen.queryByText("Day One Talk")).not.toBeInTheDocument();
    expect(screen.getByText("Day Two Talk")).toBeInTheDocument();
  });

  it("renders multiple time slots as separate rows", () => {
    render(
      <ScheduleGrid
        rooms={ROOMS}
        sessions={[
          makeSession({ id: "1", starts_at: "2026-06-12T09:00:00" }),
          makeSession({ id: "2", title: "Afternoon Session", starts_at: "2026-06-12T14:00:00" }),
        ]}
      />
    );
    expect(screen.getByText("Opening Keynote")).toBeInTheDocument();
    expect(screen.getByText("Afternoon Session")).toBeInTheDocument();
  });
});
