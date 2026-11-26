/**
 * The moment a demo's sample saves are dated from. The seed and the sample
 * export both count back from it, so their saved dates match exactly. It's
 * rounded down to a whole second, because export dates are whole seconds.
 *
 * @param createdAt - When the demo user was created.
 * @returns `createdAt` without its milliseconds.
 */
export function demoAnchor(createdAt: Date): Date {
  return new Date(Math.floor(createdAt.getTime() / 1000) * 1000);
}
