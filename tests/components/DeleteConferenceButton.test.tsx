import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/app/(dashboard)/conferences/actions", () => ({
  deleteConferenceAction: vi.fn(),
}));

const { deleteConferenceAction } = await import(
  "@/app/(dashboard)/conferences/actions"
);
const { default: DeleteConferenceButton } = await import(
  "@/components/ui/DeleteConferenceButton"
);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(deleteConferenceAction).mockResolvedValue(undefined);
});

describe("DeleteConferenceButton", () => {
  it("renders a Delete button", () => {
    render(<DeleteConferenceButton conferenceId="conf-1" conferenceName="IRE 2026" />);
    expect(screen.getByRole("button", { name: /delete ire 2026/i })).toBeInTheDocument();
  });

  it("does nothing if the user cancels the confirm dialog", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(false);
    render(<DeleteConferenceButton conferenceId="conf-1" conferenceName="IRE 2026" />);
    await userEvent.click(screen.getByRole("button", { name: /delete ire 2026/i }));
    expect(deleteConferenceAction).not.toHaveBeenCalled();
  });

  it("calls deleteConferenceAction with the conferenceId when confirmed", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    render(<DeleteConferenceButton conferenceId="conf-1" conferenceName="IRE 2026" />);
    await userEvent.click(screen.getByRole("button", { name: /delete ire 2026/i }));
    expect(deleteConferenceAction).toHaveBeenCalledWith("conf-1");
  });

  it("shows error message when deleteConferenceAction returns an error", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    vi.mocked(deleteConferenceAction).mockResolvedValueOnce({
      error: "Foreign key constraint violated",
    });
    render(<DeleteConferenceButton conferenceId="conf-1" conferenceName="IRE 2026" />);
    await userEvent.click(screen.getByRole("button", { name: /delete ire 2026/i }));
    expect(await screen.findByText("Failed")).toBeInTheDocument();
  });

  it("shows 'Deleting…' text while pending (button is disabled during transition)", async () => {
    vi.spyOn(window, "confirm").mockReturnValueOnce(true);
    // Never resolves so we can observe the loading state
    vi.mocked(deleteConferenceAction).mockReturnValueOnce(new Promise(() => {}));
    render(<DeleteConferenceButton conferenceId="conf-1" conferenceName="IRE 2026" />);
    await userEvent.click(screen.getByRole("button", { name: /delete ire 2026/i }));
    expect(await screen.findByText("Deleting…")).toBeInTheDocument();
  });
});
