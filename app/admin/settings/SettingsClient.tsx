"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { UserPreferences } from "@/app/api/user/preferences/route";

function setThemeCookie(theme: string) {
  document.cookie = `harmony-theme=${theme}; path=/; max-age=${60 * 60 * 24 * 365}; sameSite=lax`;
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
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
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
                          ? "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white"
                          : "bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-300 dark:hover:bg-zinc-700"
                      } disabled:opacity-50`}
                    >
                      Sombre
                    </button>
                  </div>
                </div>
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
