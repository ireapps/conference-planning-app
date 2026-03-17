import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeChain } from "@/tests/helpers/mock-supabase";

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
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/sessionize/sync", () => ({ syncConference: vi.fn() }));
vi.mock("@/lib/data/conference-page-data", () => ({
  conferenceDataTag: (id: string) => `conference-data:${id}`,
}));

const { syncConferenceAction } = await import(
  "@/app/(dashboard)/conferences/[id]/actions"
);
const { syncConference } = await import("@/lib/sessionize/sync");
const { revalidatePath, revalidateTag } = await import("next/cache");

beforeEach(() => {
  vi.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });
  mockFrom.mockReturnValue(makeChain());
});

describe("syncConferenceAction", () => {
  it("returns error when not authenticated", async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await syncConferenceAction("conf-1");
    expect(result).toEqual({ ok: false, error: "Not authenticated." });
    expect(syncConference).not.toHaveBeenCalled();
  });

  it("returns ok:true with sync result on success", async () => {
    const syncResult = {
      conference: "IRE 2026",
      synced: { rooms: 3, categories: 2, speakers: 50, sessions: 80 },
    };
    vi.mocked(syncConference).mockResolvedValueOnce(syncResult);

    const result = await syncConferenceAction("conf-1");
    expect(result).toEqual({ ok: true, result: syncResult });
  });

  it("revalidates tag and path on success", async () => {
    vi.mocked(syncConference).mockResolvedValueOnce({
      conference: "IRE 2026",
      synced: { rooms: 1, categories: 0, speakers: 1, sessions: 1 },
    });

    await syncConferenceAction("conf-1");
    expect(revalidateTag).toHaveBeenCalledWith("conference-data:conf-1", "default");
    expect(revalidatePath).toHaveBeenCalledWith("/conferences/conf-1", "layout");
  });

  it("returns ok:false with error message when sync throws", async () => {
    vi.mocked(syncConference).mockRejectedValueOnce(new Error("Sessionize returned 503"));
    const result = await syncConferenceAction("conf-1");
    expect(result).toEqual({ ok: false, error: "Sessionize returned 503" });
  });

  it("handles non-Error throws gracefully", async () => {
    vi.mocked(syncConference).mockRejectedValueOnce("unexpected string error");
    const result = await syncConferenceAction("conf-1");
    expect(result).toEqual({ ok: false, error: "unexpected string error" });
  });
});
