import { z } from "zod";

// `NAME=` with nothing after it, as in .env.example, means "not set".
function emptyAsUnset<T extends z.ZodType>(schema: T) {
  return z.preprocess((value) => (value === "" ? undefined : value), schema);
}

const serverEnvSchema = z
  .object({
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    // Signs session cookies and hashes sign-in codes.
    BETTER_AUTH_SECRET: z.string().min(32),
    // Used when the request's own host isn't one of the allowed hosts.
    BETTER_AUTH_URL: z.url({ protocol: /^https?$/ }),
    // Gmail sends the sign-in emails. Without it, codes are only logged in
    // local development.
    GMAIL_USER: emptyAsUnset(z.email().optional()),
    // Google shows app passwords in groups of four ("abcd efgh ..."), so
    // spaces from copy-pasting are removed.
    GMAIL_APP_PASSWORD: emptyAsUnset(
      z
        .string()
        .transform((value) => value.replace(/\s/g, ""))
        .optional(),
    ),
  })
  .refine(
    (env) => Boolean(env.GMAIL_USER) === Boolean(env.GMAIL_APP_PASSWORD),
    {
      message: "Set both GMAIL_USER and GMAIL_APP_PASSWORD, or neither",
      path: ["GMAIL_APP_PASSWORD"],
    },
  );

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export function parseServerEnv(
  source: Record<string, string | undefined>,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    // Only report which variables are wrong, never their values.
    const names = result.error.issues.map((issue) => issue.path.join("."));
    throw new Error(`Invalid environment variables: ${names.join(", ")}`);
  }
  return result.data;
}

let cached: ServerEnv | undefined;

// Read lazily so `next build` works without a database connection.
export function serverEnv(): ServerEnv {
  cached ??= parseServerEnv(process.env);
  return cached;
}
