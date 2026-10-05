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
    // Brevo sends the sign-in emails. Without it, codes are only logged in
    // local development.
    BREVO_API_KEY: emptyAsUnset(z.string().optional()),
    EMAIL_FROM: emptyAsUnset(z.email().optional()),
  })
  .refine((env) => Boolean(env.BREVO_API_KEY) === Boolean(env.EMAIL_FROM), {
    message: "Set both BREVO_API_KEY and EMAIL_FROM, or neither",
    path: ["EMAIL_FROM"],
  });

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
