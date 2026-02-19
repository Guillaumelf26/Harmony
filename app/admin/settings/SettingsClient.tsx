"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserPreferences } from "@/app/api/user/preferences/route";
import { applyTheme } from "@/lib/theme";

export default function SettingsClient() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [passwordCurrent, setPasswordCurrent] = useState("");
  const [passwordNew, setPasswordNew] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  useEffect(() => {
    fetch("/api/user/preferences")
      .then((r) => (r.ok ? r.json() : {}))
      .then((p: UserPreferences) => {
        setPreferences(p ?? {});
        const theme = (p?.theme ?? "dark") as string;
        applyTheme(theme);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleThemeChange(theme: "light" | "dark") {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...preferences, theme }),
      });
      if (res.ok) {
        const updated = (await res.json()) as UserPreferences;
        setPreferences(updated);
        applyTheme(updated.theme ?? theme);
      }
    } finally {
      setSaving(false);
    }
  }

  const theme = preferences?.theme ?? "dark";

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);
    if (passwordNew !== passwordConfirm) {
      setPasswordError("Les deux mots de passe ne correspondent pas.");
      return;
    }
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/password", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordCurrent,
          newPassword: passwordNew,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setPasswordError(data.message ?? "Erreur lors du changement de mot de passe.");
        return;
      }
      setPasswordSuccess(true);
      setPasswordCurrent("");
      setPasswordNew("");
      setPasswordConfirm("");
    } finally {
      setPasswordLoading(false);
    }
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/user/delete-account", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          password: deletePassword,
          confirmation: deleteConfirmation,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      if (!res.ok) {
        setDeleteError(data.message ?? "Erreur lors de la suppression.");
        return;
      }
      await signOut({ callbackUrl: "/login" });
      router.push("/login");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur">
        <div className="flex max-w-2xl mx-auto items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/admin"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
            aria-label="Retour"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </Link>
          <h1 className="text-lg font-semibold">Paramètres</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-sm text-zinc-500">Chargement…</div>
        ) : (
          <div className="space-y-8">
            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                Apparence
              </h2>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="font-medium">Thème</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Clair ou sombre
                    </div>
                  </div>
                  <div
                    className="flex rounded-full p-1 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 shadow-inner"
                    role="group"
                    aria-label="Choisir le thème"
                  >
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      disabled={saving}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        theme === "light"
                          ? "bg-white dark:bg-zinc-100 text-amber-500 shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      } disabled:opacity-50`}
                      title="Thème clair"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      disabled={saving}
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                        theme === "dark"
                          ? "bg-zinc-700 dark:bg-zinc-600 text-indigo-200 shadow-sm ring-1 ring-zinc-600 dark:ring-zinc-500"
                          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                      } disabled:opacity-50`}
                      title="Thème sombre"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                Sécurité
              </h2>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4 space-y-4">
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div className="font-medium">Changer le mot de passe</div>
                  <div className="space-y-3">
                    <label className="block">
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">Mot de passe actuel</span>
                      <input
                        type="password"
                        value={passwordCurrent}
                        onChange={(e) => setPasswordCurrent(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                        autoComplete="current-password"
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">Nouveau mot de passe</span>
                      <input
                        type="password"
                        value={passwordNew}
                        onChange={(e) => setPasswordNew(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm text-zinc-600 dark:text-zinc-300">Confirmer le nouveau mot de passe</span>
                      <input
                        type="password"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                        autoComplete="new-password"
                        minLength={8}
                        required
                      />
                    </label>
                  </div>
                  {passwordError ? (
                    <p className="text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                  ) : null}
                  {passwordSuccess ? (
                    <p className="text-sm text-green-600 dark:text-green-400">Mot de passe modifié avec succès.</p>
                  ) : null}
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="rounded-lg bg-zinc-800 dark:bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:hover:bg-zinc-600 disabled:opacity-50"
                  >
                    {passwordLoading ? "En cours…" : "Changer le mot de passe"}
                  </button>
                </form>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                Compte
              </h2>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Supprimer définitivement votre compte et toutes les données associées.
                </p>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="mt-3 rounded-lg border border-red-300 dark:border-red-800 bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                  Supprimer mon compte
                </button>
              </div>

              {/* Modal de confirmation : risques + formulaire */}
              {deleteConfirmOpen && typeof document !== "undefined" && (
                <div
                  className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setDeletePassword("");
                    setDeleteConfirmation("");
                    setDeleteError(null);
                  }}
                >
                  <div
                    className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-5 border-b border-zinc-200 dark:border-zinc-800">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Supprimer mon compte</h3>
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        Cette action est irréversible. Toutes vos données (bibliothèques, chants, favoris) seront définitivement supprimées.
                      </p>
                    </div>
                    <form onSubmit={handleDeleteAccount} className="p-5 space-y-4">
                      <label className="block">
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">Mot de passe actuel</span>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm"
                          autoComplete="current-password"
                          placeholder="Confirmez votre mot de passe"
                          required
                        />
                      </label>
                      <label className="block">
                        <span className="text-sm text-zinc-600 dark:text-zinc-300">
                          Tapez <span className="font-mono font-semibold">SUPPRIMER</span> pour confirmer
                        </span>
                        <input
                          type="text"
                          value={deleteConfirmation}
                          onChange={(e) => setDeleteConfirmation(e.target.value)}
                          className="mt-1 w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-2 text-sm font-mono"
                          placeholder="SUPPRIMER"
                          required
                        />
                      </label>
                      {deleteError ? (
                        <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                      ) : null}
                      <div className="flex gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeleteConfirmOpen(false);
                            setDeletePassword("");
                            setDeleteConfirmation("");
                            setDeleteError(null);
                          }}
                          className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          disabled={deleteLoading || deleteConfirmation.trim().toUpperCase() !== "SUPPRIMER"}
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleteLoading ? "Suppression…" : "Supprimer définitivement"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </section>

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              D&apos;autres options (police, etc.) pourront être ajoutées ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
