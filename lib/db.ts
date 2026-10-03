import { Pool } from "pg";
import { serverEnv } from "./env";

let pool: Pool | undefined;

export function db(): Pool {
  pool ??= new Pool({ connectionString: serverEnv().DATABASE_URL });
  return pool;
}
