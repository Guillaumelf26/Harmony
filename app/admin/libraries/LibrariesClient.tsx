"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import JSZip from "jszip";

type LibraryItem = {
  id: string;
  name: string;
  isOwner?: boolean;
  _count?: { songs: number };
  owner?: { email: string };
};

type Member = {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
};

export default function LibrariesClient() {
  const [libraries, setLibraries] = useState<{ owned: LibraryItem[]; shared: LibraryItem[] }>({ owned: [], shared: [] });
  const [loading, setLoading] = useState(true);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLibraryName, setCreateLibraryName] = useState("");
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  async function refreshLibraries() {
    const res = await fetch("/api/libraries", { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { owned: LibraryItem[]; shared: LibraryItem[] };
    setLibraries(data);
  }

  useEffect(() => {
    refreshLibraries().finally(() => setLoading(false));
  }, []);

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
          <h1 className="text-lg font-semibold">Gérer les bibliothèques</h1>
          <div className="w-16" />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-sm text-zinc-500">Chargement…</div>
        ) : (
          <div className="space-y-8">
            {/* Mes bibliothèques */}
            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Mes bibliothèques</h2>
              {libraries.owned.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Aucune bibliothèque. Créez-en une ci-dessous.
                </div>
              ) : (
                <div className="space-y-3">
                  {libraries.owned.map((lib) => (
                    <LibraryCard
                      key={lib.id}
                      library={lib}
                      isOwner
                      onUpdated={refreshLibraries}
                      onDeleted={refreshLibraries}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Partagées */}
            <section>
              <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Partagées avec moi</h2>
              {libraries.shared.length === 0 ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Aucune bibliothèque partagée.
                </div>
              ) : (
                <div className="space-y-3">
                  {libraries.shared.map((lib) => (
                    <LibraryCard key={lib.id} library={lib} isOwner={false} onUpdated={refreshLibraries} onLeft={refreshLibraries} />
                  ))}
                </div>
              )}
            </section>

            {/* Actions : 3 boutons uniformes sur une ligne */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                Importer un backup
              </button>
              <button
                type="button"
                onClick={() => setJoinModalOpen(true)}
                className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" />
                </svg>
                Rejoindre
              </button>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="rounded-lg bg-accent-500 px-4 py-3 text-sm font-medium text-white hover:bg-accent-600 flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <path d="M5 12h14" /><path d="M12 5v14" />
                </svg>
                Créer
              </button>
            </section>
          </div>
        )}
      </div>

      {/* Modal Rejoindre */}
      {joinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setJoinModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Rejoindre une bibliothèque</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Entrez le code d&apos;invitation fourni par le propriétaire.</p>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC-1234"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setJoinModalOpen(false); setJoinCode(""); }}
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const code = joinCode.trim().replace(/\s/g, "");
                  if (!code) return;
                  const res = await fetch("/api/libraries/join", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ code }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    window.alert((data as { message?: string }).message ?? "Code invalide ou expiré.");
                    return;
                  }
                  setJoinModalOpen(false);
                  setJoinCode("");
                  await refreshLibraries();
                }}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Créer */}
      {/* Modal Importer */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setImportModalOpen(false); setImportError(null); }}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Importer un backup</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
              Sélectionnez un fichier .zip ou .json exporté depuis Harmony. Une nouvelle bibliothèque sera créée avec les chants.
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
              Les fichiers audio ne sont pas inclus dans les backups.
            </p>
            {importError && (
              <p className="text-sm text-red-600 dark:text-red-400 mb-3">{importError}</p>
            )}
            <input
              ref={importInputRef}
              type="file"
              accept=".zip,.json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setImporting(true);
                setImportError(null);
                try {
                  let json: unknown;
                  if (file.name.endsWith(".json")) {
                    json = JSON.parse(await file.text());
                  } else {
                    const zip = await JSZip.loadAsync(file);
                    const backupFile = zip.file("backup.json") ?? zip.file("manifest.json");
                    if (!backupFile) {
                      setImportError("Fichier backup.json ou manifest.json introuvable dans le zip.");
                      return;
                    }
                    json = JSON.parse(await backupFile.async("string"));
                  }
                  const res = await fetch("/api/libraries/import", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify(json),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok) {
                    setImportError((data as { message?: string }).message ?? "Format de backup invalide.");
                    return;
                  }
                  setImportModalOpen(false);
                  await refreshLibraries();
                } catch (err) {
                  setImportError(err instanceof Error ? err.message : "Erreur lors de la lecture du fichier.");
                } finally {
                  setImporting(false);
                  e.target.value = "";
                }
              }}
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setImportModalOpen(false); setImportError(null); }}
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => importInputRef.current?.click()}
                disabled={importing}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-60"
              >
                {importing ? "Import…" : "Choisir un fichier"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCreateModalOpen(false)}>
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Créer une bibliothèque</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">Donnez un nom à votre nouvelle bibliothèque.</p>
            <input
              type="text"
              value={createLibraryName}
              onChange={(e) => setCreateLibraryName(e.target.value)}
              placeholder="Ex: Groupe XYZ"
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 outline-none focus:ring-2 focus:ring-accent-500 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setCreateModalOpen(false); setCreateLibraryName(""); }}
                className="rounded-lg px-4 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={async () => {
                  const name = createLibraryName.trim();
                  if (!name) return;
                  const res = await fetch("/api/libraries", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ name }),
                  });
                  if (!res.ok) return;
                  setCreateModalOpen(false);
                  setCreateLibraryName("");
                  await refreshLibraries();
                }}
                className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportBackupButton({ libraryId, libraryName }: { libraryId: string; libraryName: string }) {
  const [exporting, setExporting] = useState(false);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch(`/api/libraries/${libraryId}/export`);
      if (!res.ok) throw new Error("Export failed");
      const backup = (await res.json()) as { libraryName: string; exportedAt: string; songs: unknown[] };
      const zip = new JSZip();
      zip.file("backup.json", JSON.stringify(backup, null, 2));
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `harmony-backup-${libraryName.replace(/[^a-zA-Z0-9]/g, "-")}-${new Date().toISOString().slice(0, 10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      title="Les fichiers audio ne sont pas inclus dans le backup"
      className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center gap-1.5"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
      {exporting ? "Export…" : "Backup"}
    </button>
  );
}

function LibraryCard({
  library,
  isOwner,
  onUpdated,
  onDeleted,
  onLeft,
}: {
  library: LibraryItem;
  isOwner: boolean;
  onUpdated: () => void;
  onDeleted?: () => void;
  onLeft?: () => void;
}) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(library.name);
  const [savingName, setSavingName] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersOpen, setMembersOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    setName(library.name);
  }, [library.name]);

  useEffect(() => {
    if (membersOpen && isOwner) {
      fetch(`/api/libraries/${library.id}/members`)
        .then((r) => (r.ok ? r.json() : { members: [] }))
        .then((d: { members: Member[] }) => setMembers(d.members ?? []));
    }
  }, [library.id, membersOpen, isOwner]);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === library.name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    try {
      const res = await fetch(`/api/libraries/${library.id}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const updated = (await res.json()) as { name: string };
        setName(updated.name);
        setEditingName(false);
        onUpdated();
      }
    } finally {
      setSavingName(false);
    }
  }

  async function generateCode() {
    setGenerating(true);
    setInviteCode(null);
    try {
      const res = await fetch(`/api/libraries/${library.id}/invite`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) return;
      const data = (await res.json()) as { code: string };
      setInviteCode(data.code);
    } finally {
      setGenerating(false);
    }
  }

  async function revokeAccess(userId: string) {
    if (!window.confirm("Révoquer l'accès de cette personne ?")) return;
    setRevoking(userId);
    try {
      const res = await fetch(`/api/libraries/${library.id}/members/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        onUpdated();
      }
    } finally {
      setRevoking(null);
    }
  }

  async function deleteLibrary() {
    if (!window.confirm(`Supprimer définitivement la bibliothèque « ${library.name} » ? Tous les chants seront perdus.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/libraries/${library.id}`, { method: "DELETE" });
      if (res.ok) onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  async function leaveLibrary() {
    if (!window.confirm(`Quitter la bibliothèque « ${library.name} » ?`)) return;
    setLeaving(true);
    try {
      const res = await fetch(`/api/libraries/${library.id}/leave`, { method: "POST" });
      if (res.ok) onLeft?.();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        {editingName ? (
          <div className="flex-1 flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="flex-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-accent-500"
              autoFocus
            />
            <button type="button" onClick={saveName} disabled={savingName} className="rounded px-2 py-1 text-sm text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-950/30 disabled:opacity-50">
              {savingName ? "…" : "OK"}
            </button>
            <button type="button" onClick={() => { setEditingName(false); setName(library.name); }} className="rounded px-2 py-1 text-sm text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700">
              Annuler
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{library.name}</h3>
              {!isOwner && library.owner?.email && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Partagée par {library.owner.email}</p>
              )}
            </div>
            {library._count?.songs != null && (
              <span className="text-xs text-zinc-500 shrink-0">{library._count.songs} chant{library._count.songs > 1 ? "s" : ""}</span>
            )}
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-2">
        {isOwner && !editingName && (
          <>
            <button
              type="button"
              onClick={() => setEditingName(true)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
              Renommer
            </button>
            <button
              type="button"
              onClick={() => setMembersOpen((o) => !o)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 inline-flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><line x1="19" y1="8" x2="19" y2="14" /><line x1="22" y1="11" x2="16" y2="11" /></svg>
              Partager
            </button>
            <ExportBackupButton libraryId={library.id} libraryName={library.name} />
          </>
        )}
        {!isOwner && (
          <>
            <ExportBackupButton libraryId={library.id} libraryName={library.name} />
            <button
              type="button"
              onClick={leaveLibrary}
              disabled={leaving}
              className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
              {leaving ? "…" : "Quitter"}
            </button>
          </>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={deleteLibrary}
            disabled={deleting}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" y1="11" x2="10" y2="17" /><line x1="14" y1="11" x2="14" y2="17" /></svg>
            {deleting ? "…" : "Supprimer"}
          </button>
        )}
      </div>

      {/* Section Partager (invite code + membres) */}
      {isOwner && membersOpen && (
        <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-700 space-y-3">
          <div>
            <button
              type="button"
              onClick={generateCode}
              disabled={generating}
              className="rounded-lg bg-accent-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-accent-600 disabled:opacity-60"
            >
              {generating ? "Génération…" : "Générer un code d'invitation"}
            </button>
            {inviteCode && (
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 rounded bg-zinc-200 dark:bg-zinc-800 px-2 py-1.5 text-xs font-mono">{inviteCode}</code>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(inviteCode); window.alert("Code copié."); }}
                  className="rounded px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                >
                  Copier
                </button>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">Personnes avec accès</h4>
            {members.length === 0 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Aucune (sauf vous).</p>
            ) : (
              <ul className="space-y-1">
                {members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-zinc-700 dark:text-zinc-300">{m.email}</span>
                    <button
                      type="button"
                      onClick={() => revokeAccess(m.userId)}
                      disabled={revoking === m.userId}
                      className="shrink-0 text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                    >
                      {revoking === m.userId ? "…" : "Révoquer"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
