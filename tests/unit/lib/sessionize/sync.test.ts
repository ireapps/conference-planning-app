import { describe, it, expect, vi, beforeEach } from "vitest";
import { syncConference } from "@/lib/sessionize/sync";
import { makeChain } from "@/tests/helpers/mock-supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

const MINIMAL_SESSIONIZE_RESPONSE = {
  rooms: [{ id: 1, name: "Ballroom A", sort: 0 }],
  categories: [],
  speakers: [
    {
      id: "spk-1",
      firstName: "Jane",
      lastName: "Smith",
      fullName: "Jane Smith",
      bio: null,
      tagLine: "Reporter",
      profilePicture: null,
      links: [],
      questionAnswers: [],
    },
  ],
  sessions: [
    {
      id: "sess-1",
      title: "Opening Keynote",
      description: null,
      startsAt: "2026-06-12T09:00:00",
      endsAt: "2026-06-12T10:00:00",
      speakers: ["spk-1"],
      categoryItems: [],
      questionAnswers: [],
      roomId: 1,
      status: "Accepted",
      isConfirmed: true,
      isPlenumSession: false,
      isServiceSession: false,
      liveUrl: null,
      recordingUrl: null,
    },
  ],
};

function makeMockSupabase(
  conferenceResult: { data?: unknown; error?: unknown } = {
    data: { id: "conf-1", name: "IRE 2026", sessionize_api_key: "abc123" },
    error: null,
  }
) {
  const confChain = makeChain(conferenceResult);
  const defaultChain = makeChain({ data: null, error: null });

  const mockFrom = vi.fn().mockImplementation((table: string) => {
    if (table === "conferences") return confChain;
    return defaultChain;
  });

  return {
    from: mockFrom,
    _defaultChain: defaultChain,
  } as unknown as SupabaseClient & { _defaultChain: ReturnType<typeof makeChain> };
}

beforeEach(() => {
  vi.restoreAllMocks();
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(MINIMAL_SESSIONIZE_RESPONSE),
  });
});

describe("syncConference", () => {
  it("throws if the conference is not found", async () => {
    const supabase = makeMockSupabase({ data: null, error: { message: "not found" } });
    await expect(syncConference(supabase, "missing-id")).rejects.toThrow(
      "Conference not found"
    );
  });

  it("throws if the conference has no sessionize_api_key", async () => {
    const supabase = makeMockSupabase({
      data: { id: "conf-1", name: "IRE 2026", sessionize_api_key: null },
      error: null,
    });
    await expect(syncConference(supabase, "conf-1")).rejects.toThrow(
      "no sessionize_api_key"
    );
  });

  it("throws if the Sessionize API returns a non-ok response", async () => {
    const supabase = makeMockSupabase();
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404, statusText: "Not Found" });
    await expect(syncConference(supabase, "conf-1")).rejects.toThrow("404");
  });

  it("fetches from the correct Sessionize URL", async () => {
    const supabase = makeMockSupabase();
    await syncConference(supabase, "conf-1");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://sessionize.com/api/v2/abc123/view/All",
      { cache: "no-store" }
    );
  });

  it("returns correct sync counts on success", async () => {
    const supabase = makeMockSupabase();
    const result = await syncConference(supabase, "conf-1");
    expect(result.conference).toBe("IRE 2026");
    expect(result.synced.rooms).toBe(1);
    expect(result.synced.speakers).toBe(1);
    expect(result.synced.sessions).toBe(1);
    expect(result.synced.categories).toBe(0);
  });

  it("upserts rooms with correct shape", async () => {
    const supabase = makeMockSupabase();
    await syncConference(supabase, "conf-1");
    const roomsChain = (supabase.from as ReturnType<typeof vi.fn>).mock.results.find(
      (_: unknown, i: number) =>
        (supabase.from as ReturnType<typeof vi.fn>).mock.calls[i][0] === "rooms"
    )?.value;
    expect(roomsChain).toBeDefined();
    expect(roomsChain.upsert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 1, conference_id: "conf-1", name: "Ballroom A" }),
      ]),
      { onConflict: "id,conference_id" }
    );
  });

  it("upserts session_speakers for each speaker relationship", async () => {
    const supabase = makeMockSupabase();
    await syncConference(supabase, "conf-1");
    const calls = (supabase.from as ReturnType<typeof vi.fn>).mock.calls;
    const ssCall = calls.find((c: string[]) => c[0] === "session_speakers");
    expect(ssCall).toBeDefined();
  });

  it("throws and surfaces the table name when a rooms upsert fails", async () => {
    const confChain = makeChain({
      data: { id: "conf-1", name: "IRE 2026", sessionize_api_key: "abc123" },
      error: null,
    });
    const errorChain = makeChain({ data: null, error: { message: "constraint violation" } });
    const mockFrom = vi.fn().mockImplementation((table: string) => {
      if (table === "conferences") return confChain;
      return errorChain;
    });
    const supabase = { from: mockFrom } as unknown as SupabaseClient;
    await expect(syncConference(supabase, "conf-1")).rejects.toThrow("rooms");
  });

  it("handles sessions with UUID string IDs", async () => {
    const uuidResponse = {
      ...MINIMAL_SESSIONIZE_RESPONSE,
      sessions: [
        {
          ...MINIMAL_SESSIONIZE_RESPONSE.sessions[0],
          id: "414a7ca2-f82d-48f6-8583-c7e2ca6cd243",
        },
      ],
    };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(uuidResponse),
    });
    const supabase = makeMockSupabase();
    const result = await syncConference(supabase, "conf-1");
    expect(result.synced.sessions).toBe(1);
  });
});
