import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

// Better Auth's endpoints: send code, verify code, get session, sign out.
export async function GET(request: Request) {
  return toNextJsHandler(auth()).GET(request);
}

export async function POST(request: Request) {
  return toNextJsHandler(auth()).POST(request);
}
