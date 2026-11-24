/** The error code for a request that couldn't be sent at all. */
export const NETWORK_ERROR = "NETWORK_ERROR";

/** A failed call that never reached the server. */
type NetworkFailure = {
  data: null;
  error: { code: typeof NETWORK_ERROR; status: 0 };
};

/**
 * Runs a Better Auth client call. The client answers a server's error with
 * `{ error }`, but throws when the request can't be sent at all, e.g.
 * offline. That becomes an `{ error }` too, so forms handle both the same
 * way and never get stuck loading.
 *
 * @param call - The client call, e.g. `() => authClient.signOut()`.
 * @returns The call's answer, or a network error.
 */
export async function authCall<T>(
  call: () => Promise<T>,
): Promise<T | NetworkFailure> {
  try {
    return await call();
  } catch {
    return { data: null, error: { code: NETWORK_ERROR, status: 0 } };
  }
}
