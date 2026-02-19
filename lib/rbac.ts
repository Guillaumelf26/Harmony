import type { Session } from "next-auth";

/** Vérifie que l'utilisateur est connecté */
export function isAuthenticatedSession(session: Session | null | undefined): session is Session {
  return !!session?.user?.id;
}

export function assertAuthenticatedSession(session: Session | null | undefined): asserts session is Session {
  if (!isAuthenticatedSession(session)) {
    const err = new Error("FORBIDDEN");
    (err as { status?: number }).status = 403;
    throw err;
  }
}
