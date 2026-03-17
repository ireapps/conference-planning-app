import { describe, it, expect } from "vitest";
import { conferenceDataTag } from "@/lib/data/conference-page-data";

describe("conferenceDataTag", () => {
  it("returns a stable string for a given id", () => {
    expect(conferenceDataTag("abc123")).toBe("conference-data:abc123");
  });

  it("produces unique tags for different ids", () => {
    expect(conferenceDataTag("a")).not.toBe(conferenceDataTag("b"));
  });

  it("handles UUID-shaped ids", () => {
    const tag = conferenceDataTag("550e8400-e29b-41d4-a716-446655440000");
    expect(tag).toBe("conference-data:550e8400-e29b-41d4-a716-446655440000");
  });
});
