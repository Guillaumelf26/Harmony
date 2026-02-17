import { Role } from "@prisma/client";
import type { Session } from "next-auth";

export function isAdminSession(session: Session | null | undefined): boolean {
  return session?.user?.role === Role.ADMIN;
}

export function assertAdminSession(session: Session | null | undefined): asserts session is Session {
  if (!isAdminSession(session)) {
    const err = new Error("FORBIDDEN");
    (err as { status?: number }).status = 403;
    throw err;
  }
}

