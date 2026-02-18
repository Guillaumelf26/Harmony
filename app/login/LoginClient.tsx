"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") ?? "/admin";
  const errorParam = params.get("error");

  const isProd = process.env.NODE_ENV === "production";
  const [email, setEmail] = useState(isProd ? "" : "admin@example.com");
  const [password, setPassword] = useState(isProd ? "" : "admin1234");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const errorMessage = useMemo(() => {
    if (error) return error;
    if (!errorParam) return null;
    if (errorParam === "CredentialsSignin") return "Identifiants invalides.";
    return "Connexion impossible.";
  }, [error, errorParam]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const res = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });

        if (!res) {
          setError("Pas de réponse du serveur. Vérifiez NEXTAUTH_SECRET dans .env");
          return;
        }
        if (res.error) {
          setError("Identifiants invalides.");
          return;
        }

        router.replace(from);
        router.refresh();
      } catch (err) {
        setError("Erreur de connexion. Vérifiez la console et .env (NEXTAUTH_SECRET).");
      }
    });
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6">
        <h1 className="text-2xl font-semibold">Connexion admin</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Accès réservé aux administrateurs.
        </p>

        <form
          onSubmit={onSubmit}
          className="mt-8 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6"
        >
          <label className="block">
            <span className="text-sm text-zinc-300">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="email"
              required
            />
          </label>

          <label className="block">
            <span className="text-sm text-zinc-300">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              autoComplete="current-password"
              required
            />
          </label>

          {errorMessage ? (
            <div className="rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {isPending ? "Connexion..." : "Se connecter"}
          </button>

          {!isProd && (
            <div className="text-xs text-zinc-500">
              Par défaut (seed): <span className="font-mono">admin@example.com</span> /{" "}
              <span className="font-mono">admin1234</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

