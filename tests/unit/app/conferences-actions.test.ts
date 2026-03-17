import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "@/tests/helpers/mock-supabase";

// Hoist mocks so they're available inside vi.mock factories
const { mockFrom, mockGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockGetUser: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}));

vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));

// Import after mocks are registered
const { createConferenceAction, updateConferenceAction, deleteConferenceAction } =
  await import("@/app/(dashboard)/conferences/actions");
const { redirect } = await import("next/navigation");
const { revalidatePath } = await import("next/cache");

function makeFormData(fields: Record<string, string> = {}) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
});

// ─── createConferenceAction ──────────────────────────────────────────────────

describe("createConferenceAction", () => {
  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await createConferenceAction(null, makeFormData({ name: "IRE 2026" }));
    expect(result).toEqual({ error: "Not authenticated." });
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns error when name is missing", async () => {
    const result = await createConferenceAction(null, makeFormData());
    expect(result).toEqual({ error: "Conference name is required." });
  });

  it("returns error when name is only whitespace", async () => {
    const result = await createConferenceAction(null, makeFormData({ name: "   " }));
    expect(result).toEqual({ error: "Conference name is required." });
  });

  it("returns error on insert failure", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: "duplicate key" } })
    );
    const result = await createConferenceAction(null, makeFormData({ name: "IRE 2026" }));
    expect(result).toEqual({ error: "duplicate key" });
  });

  it("redirects and revalidates on success", async () => {
    mockFrom.mockReturnValue(makeChain({ data: { id: "new-conf" }, error: null }));
    await createConferenceAction(null, makeFormData({ name: "IRE 2026" }));
    expect(revalidatePath).toHaveBeenCalledWith("/conferences", "layout");
    expect(redirect).toHaveBeenCalledWith("/conferences/new-conf/sessions");
  });

  it("clears is_current on other conferences before inserting when is_current=on", async () => {
    const updateChain = makeChain({ data: null, error: null });
    const insertChain = makeChain({ data: { id: "new-conf" }, error: null });
    mockFrom
      .mockReturnValueOnce(updateChain) // update is_current=false
      .mockReturnValueOnce(insertChain); // insert new conference

    await createConferenceAction(
      null,
      makeFormData({ name: "IRE 2026", is_current: "on" })
    );
    expect(updateChain.update).toHaveBeenCalledWith({ is_current: false });
    expect(redirect).toHaveBeenCalledWith("/conferences/new-conf/sessions");
  });

  it("returns error if unsetting is_current fails", async () => {
    mockFrom.mockReturnValueOnce(
      makeChain({ data: null, error: { message: "constraint error" } })
    );
    const result = await createConferenceAction(
      null,
      makeFormData({ name: "IRE 2026", is_current: "on" })
    );
    expect(result).toEqual({
      error: "Failed to unset current conference: constraint error",
    });
  });
});

// ─── updateConferenceAction ──────────────────────────────────────────────────

describe("updateConferenceAction", () => {
  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await updateConferenceAction(
      "conf-1",
      null,
      makeFormData({ name: "IRE 2026" })
    );
    expect(result).toEqual({ error: "Not authenticated." });
  });

  it("returns error when name is missing", async () => {
    const result = await updateConferenceAction("conf-1", null, makeFormData());
    expect(result).toEqual({ error: "Conference name is required." });
  });

  it("returns error on update DB failure", async () => {
    mockFrom.mockReturnValue(
      makeChain({ data: null, error: { message: "update failed" } })
    );
    const result = await updateConferenceAction(
      "conf-1",
      null,
      makeFormData({ name: "IRE 2026" })
    );
    expect(result).toEqual({ error: "update failed" });
  });

  it("redirects and revalidates on success", async () => {
    mockFrom.mockReturnValue(makeChain({ data: null, error: null }));
    await updateConferenceAction("conf-1", null, makeFormData({ name: "IRE 2026" }));
    expect(revalidatePath).toHaveBeenCalledWith("/conferences", "layout");
    expect(redirect).toHaveBeenCalledWith("/conferences/conf-1/sessions");
  });

  it("excludes the current conference when unsetting is_current", async () => {
    const updateChain = makeChain({ data: null, error: null });
    mockFrom
      .mockReturnValueOnce(updateChain) // unset others
      .mockReturnValueOnce(makeChain({ data: null, error: null })); // own update

    await updateConferenceAction(
      "conf-1",
      null,
      makeFormData({ name: "IRE 2026", is_current: "on" })
    );
    expect(updateChain.neq).toHaveBeenCalledWith("id", "conf-1");
  });
});

// ─── deleteConferenceAction ──────────────────────────────────────────────────

describe("deleteConferenceAction", () => {
  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await deleteConferenceAction("conf-1");
    expect(result).toEqual({ error: "Not authenticated." });
  });

  it("returns error on delete DB failure", async () => {
    mockFrom.mockReturnValue(makeChain({ error: { message: "foreign key violation" } }));
    const result = await deleteConferenceAction("conf-1");
    expect(result).toEqual({ error: "foreign key violation" });
  });

  it("revalidates and returns nothing on success", async () => {
    mockFrom.mockReturnValue(makeChain({ error: null }));
    const result = await deleteConferenceAction("conf-1");
    expect(result).toBeUndefined();
    expect(revalidatePath).toHaveBeenCalledWith("/conferences", "layout");
  });
});
