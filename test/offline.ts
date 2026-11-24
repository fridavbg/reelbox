/**
 * Stands in for a client call when the browser can't reach the server:
 * `fetch` then rejects with a `TypeError`.
 *
 * @returns A promise that rejects like an offline `fetch`.
 */
export const offline = () => Promise.reject(new TypeError("Failed to fetch"));
