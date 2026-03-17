import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(dashboard)/conferences/[id]/actions", () => ({
  syncConferenceAction: vi.fn(),
}));

const { syncConferenceAction } = await import(
  "@/app/(dashboard)/conferences/[id]/actions"
);
const { default: SyncButton } = await import("@/components/ui/SyncButton");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SyncButton", () => {
  it("renders the sync button in idle state", () => {
    render(<SyncButton conferenceId="conf-1" />);
    expect(screen.getByRole("button", { name: /sync from sessionize/i })).toBeInTheDocument();
  });

  it("shows Syncing… while the action is in flight", async () => {
    vi.mocked(syncConferenceAction).mockReturnValueOnce(new Promise(() => {}));
    render(<SyncButton conferenceId="conf-1" />);
    await userEvent.click(screen.getByRole("button", { name: /sync from sessionize/i }));
    expect(await screen.findByText("Syncing…")).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("shows success message with counts on ok:true response", async () => {
    vi.mocked(syncConferenceAction).mockResolvedValueOnce({
      ok: true,
      result: {
        conference: "IRE 2026",
        synced: { rooms: 3, categories: 5, speakers: 80, sessions: 120 },
      },
    });
    render(<SyncButton conferenceId="conf-1" />);
    await userEvent.click(screen.getByRole("button", { name: /sync from sessionize/i }));
    expect(await screen.findByText(/120 sessions/)).toBeInTheDocument();
    expect(screen.getByText(/80 speakers/)).toBeInTheDocument();
  });

  it("shows error message on ok:false response", async () => {
    vi.mocked(syncConferenceAction).mockResolvedValueOnce({
      ok: false,
      error: "Sessionize returned 503",
    });
    render(<SyncButton conferenceId="conf-1" />);
    await userEvent.click(screen.getByRole("button", { name: /sync from sessionize/i }));
    expect(await screen.findByText(/Sync failed/)).toBeInTheDocument();
    expect(screen.getByText(/Sessionize returned 503/)).toBeInTheDocument();
  });

  it("calls syncConferenceAction with the correct conferenceId", async () => {
    vi.mocked(syncConferenceAction).mockResolvedValueOnce({
      ok: true,
      result: { conference: "IRE 2026", synced: { rooms: 0, categories: 0, speakers: 0, sessions: 0 } },
    });
    render(<SyncButton conferenceId="conf-42" />);
    await userEvent.click(screen.getByRole("button", { name: /sync from sessionize/i }));
    expect(syncConferenceAction).toHaveBeenCalledWith("conf-42");
  });
});
