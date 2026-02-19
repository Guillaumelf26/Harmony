"use client";

import { useEffect, useState } from "react";

type Member = {
  userId: string;
  email: string;
  role: string;
  joinedAt: string;
};

type Props = {
  libraryId: string;
  libraryName: string;
  isOwner?: boolean;
  onClose: () => void;
  onMembersChanged: () => void;
  onDeleted?: (deletedLibraryId: string) => void;
};

export function ManageAccessModal({ libraryId, libraryName, isOwner = true, onClose, onMembersChanged, onDeleted }: Props) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchMembers() {
      setLoading(true);
      try {
        const res = await fetch(`/api/libraries/${libraryId}/members`);
        if (!res.ok) return;
        const data = (await res.json()) as { members: Member[] };
        setMembers(data.members);
      } finally {
        setLoading(false);
      }
    }
    void fetchMembers();
  }, [libraryId]);

  async function generateCode() {
    setGenerating(true);
    setInviteCode(null);
    try {
      const res = await fetch(`/api/libraries/${libraryId}/invite`, {
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

  async function copyCode() {
    if (!inviteCode) return;
    await navigator.clipboard.writeText(inviteCode);
    window.alert("Code copié dans le presse-papier.");
  }

  async function revokeAccess(userId: string) {
    if (!window.confirm("Révoquer l'accès de cette personne ?")) return;
    setRevoking(userId);
    try {
      const res = await fetch(`/api/libraries/${libraryId}/members/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.userId !== userId));
        onMembersChanged();
      }
    } finally {
      setRevoking(null);
    }
  }

  async function deleteLibrary() {
    if (!window.confirm(`Supprimer définitivement la bibliothèque « ${libraryName} » ? Tous les chants seront perdus.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/libraries/${libraryId}`, { method: "DELETE" });
      if (res.ok) {
        onClose();
        onDeleted?.(libraryId);
      }
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-xl max-w-md w-full mx-4 max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Accès à « {libraryName} »
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 flex-1 min-h-0 overflow-auto">
          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Partager</h4>
            <button
              type="button"
              onClick={generateCode}
              disabled={generating}
              className="rounded-lg bg-accent-500 px-4 py-2 text-sm font-medium text-white hover:bg-accent-600 disabled:opacity-60"
            >
              {generating ? "Génération..." : "Générer un code d'invitation"}
            </button>
            {inviteCode ? (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 px-3 py-2 text-sm font-mono text-zinc-900 dark:text-zinc-100">
                  {inviteCode}
                </code>
                <button
                  type="button"
                  onClick={copyCode}
                  className="rounded-lg border border-zinc-300 dark:border-zinc-600 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Copier
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <h4 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">Personnes avec accès</h4>
            {loading ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Chargement...</div>
            ) : members.length === 0 ? (
              <div className="text-sm text-zinc-500 dark:text-zinc-400">Aucune personne avec accès (sauf vous).</div>
            ) : (
              <ul className="space-y-2">
                {members.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2"
                  >
                    <span className="text-sm text-zinc-900 dark:text-zinc-100 truncate">{m.email}</span>
                    <button
                      type="button"
                      onClick={() => revokeAccess(m.userId)}
                      disabled={revoking === m.userId}
                      className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                    >
                      {revoking === m.userId ? "..." : "Révoquer"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {isOwner ? (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4 mt-4">
              <h4 className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">Zone de danger</h4>
              <button
                type="button"
                onClick={deleteLibrary}
                disabled={deleting}
                className="rounded-lg border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-950/50 disabled:opacity-60"
              >
                {deleting ? "Suppression..." : "Supprimer la bibliothèque"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
