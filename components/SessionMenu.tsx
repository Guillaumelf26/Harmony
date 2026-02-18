"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

export function SessionMenu() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="text-xs text-zinc-500 dark:text-zinc-500">Chargement…</div>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-800"
      >
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-zinc-600 dark:text-zinc-400" title={session.user.email ?? undefined}>
        {session.user.email}
      </span>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-zinc-300 dark:border-zinc-700 bg-zinc-200 dark:bg-zinc-800/60 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-300 dark:hover:bg-zinc-800"
      >
        Se déconnecter
      </button>
    </div>
  );
}
