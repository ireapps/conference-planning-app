import type { SessionizeAllData } from "./types";

export async function fetchSessionizeData(): Promise<SessionizeAllData> {
  const SESSIONIZE_API_URL = process.env.SESSIONIZE_API_URL;
  if (!SESSIONIZE_API_URL) {
    throw new Error("SESSIONIZE_API_URL environment variable is not set.");
  }

  const response = await fetch(SESSIONIZE_API_URL, {
    next: { revalidate: 0 }, // always fresh when called explicitly
  });

  if (!response.ok) {
    throw new Error(
      `Sessionize API error: ${response.status} ${response.statusText}`
    );
  }

  return response.json() as Promise<SessionizeAllData>;
}
