"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
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
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { accentColor, setAccentColor } = useAccentColor();

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

            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              D&apos;autres options (police, etc.) pourront être ajoutées ici.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
