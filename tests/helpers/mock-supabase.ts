import { vi } from "vitest";

/**
 * Returns a chainable Supabase query builder mock.
 * All filter/modifier methods return `this` so chains work.
 * The builder is also thenable so `await builder.delete().eq(...)` resolves.
 * `single()` resolves with the provided result.
 */
export function makeChain(result: { data?: unknown; error?: unknown } = {}) {
  const resolved = { data: result.data ?? null, error: result.error ?? null };
  const chain: Record<string, unknown> = {};

  for (const m of [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "order",
    "filter",
  ]) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }

  chain.single = vi.fn().mockResolvedValue(resolved);
  chain.then = (
    onFulfilled: (v: unknown) => unknown,
    onRejected: (e: unknown) => unknown
  ) => Promise.resolve(resolved).then(onFulfilled, onRejected);

  return chain;
}

/** A ready-to-use Supabase client mock with configurable `from` and `auth`. */
export function makeSupabaseMock() {
  const mockFrom = vi.fn().mockReturnValue(makeChain());
  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: "user-1", email: "test@example.org" } },
  });

  return {
    client: { auth: { getUser: mockGetUser }, from: mockFrom },
    mockFrom,
    mockGetUser,
  };
}
