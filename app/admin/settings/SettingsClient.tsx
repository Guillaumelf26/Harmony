"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import type { UserPreferences } from "@/app/api/user/preferences/route";
import { useAccentColor } from "@/components/AccentColorProvider";

function setThemeCookie(theme: string) {
  document.cookie = `harmony-theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; sameSite=lax`;
}

function setAccentCookie(color: string) {
  document.cookie = `harmony-accent=${color}; path=/; max-age=${60 * 60 * 24 * 365}; sameSite=lax`;
}

function applyTheme(theme: string) {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  setThemeCookie(theme);
}

export default function SettingsClient() {
  const router = useRouter();
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { accentColor, setAccentColor } = useAccentColor();

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
        const accent = (p as { accentColor?: string })?.accentColor;
        if (accent) {
          setAccentColor(accent);
        }
      })
      .finally(() => setLoading(false));
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [setAccentColor]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function persistAccentColor(color: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...preferences, accentColor: color }),
      });
      if (res.ok) {
        const updated = (await res.json()) as UserPreferences & { accentColor?: string };
        setPreferences(updated);
      }
    } finally {
      setSaving(false);
    }
  }

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
            className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
          >
            ← Retour
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
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Thème</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Choisir le thème clair ou sombre
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleThemeChange("light")}
                      disabled={saving}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        theme === "light"
                          ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      } disabled:opacity-50`}
                    >
                      Clair
                    </button>
                    <button
                      type="button"
                      onClick={() => handleThemeChange("dark")}
                      disabled={saving}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                        theme === "dark"
                          ? "bg-gradient-to-r from-accent-500 to-accent-600 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      } disabled:opacity-50`}
                    >
                      Sombre
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">
                Couleur d&apos;accent
              </h2>
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">Couleur de thème</div>
                    <div className="text-sm text-zinc-500 dark:text-zinc-400">
                      Choisir la couleur d&apos;accent utilisée dans toute l&apos;interface
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => {
                        const c = e.target.value;
                        setAccentColor(c);
                        setAccentCookie(c);
                        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
                        saveTimeoutRef.current = setTimeout(() => persistAccentColor(c), 400);
                      }}
                      disabled={saving}
                      className="w-12 h-12 rounded-lg cursor-pointer border border-zinc-300 dark:border-zinc-600 bg-transparent disabled:opacity-50 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-md"
                      aria-label="Couleur d'accent"
                    />
                    <span className="text-sm font-mono text-zinc-600 dark:text-zinc-300 w-20">
                      {accentColor}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  La couleur est enregistrée automatiquement lorsque vous en sélectionnez une nouvelle.
                </p>
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
                Zone de danger
              </h2>
              <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-4">
                <div className="font-medium text-red-800 dark:text-red-200">Supprimer mon compte</div>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  Cette action est irréversible. Toutes vos données (bibliothèques, chants, favoris) seront définitivement supprimées.
                </p>
                {!deleteConfirmOpen ? (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="mt-3 rounded-lg border border-red-300 dark:border-red-800 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900/30"
                  >
                    Supprimer mon compte
                  </button>
                ) : (
                  <form onSubmit={handleDeleteAccount} className="mt-3 space-y-3">
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
                    <div className="flex gap-2">
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
                )}
              </div>
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
