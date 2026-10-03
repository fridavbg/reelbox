import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
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
