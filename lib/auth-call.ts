/** The error code for a request that couldn't be sent at all. */
export const NETWORK_ERROR = "NETWORK_ERROR";

/** The error code for anything else a call throws: a bug, not the network. */
export const UNEXPECTED_ERROR = "UNEXPECTED_ERROR";

/** A failed call that never got an answer from the server. */
type ThrownFailure = {
  data: null;
  error: { code: typeof NETWORK_ERROR | typeof UNEXPECTED_ERROR; status: 0 };
};

/**
 * Runs a Better Auth client call. The client answers a server's error with
 * `{ error }`, but throws when the request can't be sent at all, e.g.
 * offline. That becomes an `{ error }` too, so forms handle both the same
 * way and never get stuck loading.
 *
 * `fetch` throws a `TypeError` when it can't reach the server; anything
 * else thrown is a bug, so it's logged and kept apart from network errors.
 *
 * @param call - The client call, e.g. `() => authClient.signOut()`.
 * @returns The call's answer, or the error it threw.
 */
export async function authCall<T>(
  call: () => Promise<T>,
): Promise<T | ThrownFailure> {
  try {
    return await call();
  } catch (error) {
    if (error instanceof TypeError) {
      return { data: null, error: { code: NETWORK_ERROR, status: 0 } };
    }
    console.error("Auth request failed", error);
    return { data: null, error: { code: UNEXPECTED_ERROR, status: 0 } };
  }
}
