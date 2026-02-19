"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export default function RegisterClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });

        const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };

        if (!res.ok) {
          if (data.error === "EMAIL_TAKEN") {
            setError("Cet email est déjà utilisé.");
            return;
          }
          setError(data.message ?? "Erreur lors de l'inscription.");
          return;
        }

        router.push("/login?registered=1");
        router.refresh();
      } catch {
        setError("Erreur de connexion. Réessayez.");
      }
    });
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Créer un compte</h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Inscription ouverte. Vous aurez votre propre bibliothèque de chants.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/40 p-6"
        >
          <label className="block">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Mot de passe (min. 8 caractères)</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
              autoComplete="new-password"
              required
              minLength={8}
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">Confirmer le mot de passe</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500"
              autoComplete="new-password"
              required
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 px-3 py-2 text-sm text-red-700 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-2 text-sm font-medium text-white hover:from-accent-600 hover:to-accent-700 disabled:opacity-60 disabled:from-accent-500 disabled:to-accent-600 transition-all"
          >
            {isPending ? "Inscription..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Déjà un compte ?{" "}
          <a href="/login" className="text-accent-500 hover:text-accent-600 font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
