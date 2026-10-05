import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

type Session = NonNullable<Awaited<ReturnType<typeof getSession>>>;
export type SessionUser = Session["user"];

// Validates the session cookie against the database.
export async function getSession() {
  // Read the request first: it marks the page as dynamic, so `next build`
  // never tries to prerender it (and never needs the auth secrets).
  const requestHeaders = await headers();
  return auth().api.getSession({ headers: requestHeaders });
}

// For pages that need a signed-in user; everyone else goes to sign-in.
export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) redirect("/");
  return session.user;
}

// For API routes: returns the user, or a 401 response to send back as is.
//
//   const { user, response } = await requireApiUser();
//   if (response) return response;
export async function requireApiUser(): Promise<
  { user: SessionUser; response?: never } | { user?: never; response: Response }
> {
  const session = await getSession();
  if (!session) {
    return {
      response: Response.json(
        { error: "Sign in to continue." },
        { status: 401 },
      ),
    };
  }
  return { user: session.user };
}
