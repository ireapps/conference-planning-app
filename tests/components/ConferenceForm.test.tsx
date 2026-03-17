import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ConferenceForm from "@/components/ui/ConferenceForm";

import { useActionState } from "react";

// useActionState returns [state, action] — we control state to test displayed errors
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useActionState: vi.fn((action: unknown, initial: unknown) => [initial, action]),
  };
});

const mockAction = vi.fn().mockResolvedValue(null);

describe("ConferenceForm", () => {
  it("renders all core fields", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        submitLabel="Create conference"
        pendingLabel="Creating…"
        cancelHref="/conferences"
      />
    );
    expect(screen.getByLabelText(/conference name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/event id/i)).toBeInTheDocument();
  });

  it("renders the submit button with the provided label", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        submitLabel="Create conference"
        pendingLabel="Creating…"
        cancelHref="/conferences"
      />
    );
    expect(screen.getByRole("button", { name: "Create conference" })).toBeInTheDocument();
  });

  it("renders the cancel link pointing to cancelHref", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        submitLabel="Create conference"
        pendingLabel="Creating…"
        cancelHref="/conferences"
      />
    );
    const cancelLink = screen.getByText("Cancel").closest("a");
    expect(cancelLink).toHaveAttribute("href", "/conferences");
  });

  it("pre-fills inputs from initialValues", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        initialValues={{
          name: "IRE 2026",
          year: 2026,
          location: "Baltimore, MD",
          sessionize_api_key: "r332qxb5",
          sessionize_event_id: "22653",
        }}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref="/conferences/conf-1/sessions"
      />
    );
    expect(screen.getByDisplayValue("IRE 2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Baltimore, MD")).toBeInTheDocument();
    expect(screen.getByDisplayValue("r332qxb5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("22653")).toBeInTheDocument();
  });

  it("checks the is_current checkbox when initialValues.is_current is true", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        initialValues={{ is_current: true }}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref="/conferences"
      />
    );
    expect(screen.getByRole("checkbox", { name: /mark as current/i })).toBeChecked();
  });

  it("does not check is_current when initialValues.is_current is false", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        initialValues={{ is_current: false }}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref="/conferences"
      />
    );
    expect(screen.getByRole("checkbox", { name: /mark as current/i })).not.toBeChecked();
  });

  it("displays an error banner when state has an error", () => {
    vi.mocked(useActionState).mockReturnValueOnce([{ error: "Conference name is required." }, mockAction, false]);

    render(
      <ConferenceForm
        serverAction={mockAction}
        submitLabel="Save changes"
        pendingLabel="Saving…"
        cancelHref="/conferences"
      />
    );
    expect(screen.getByText("Conference name is required.")).toBeInTheDocument();
  });

  it("does not display an error banner when state is null", () => {
    render(
      <ConferenceForm
        serverAction={mockAction}
        submitLabel="Create conference"
        pendingLabel="Creating…"
        cancelHref="/conferences"
      />
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
