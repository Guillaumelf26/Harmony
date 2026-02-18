"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { parseChordPro } from "@/chordpro/parse";
import { ChordProPreview } from "@/chordpro/render";
import { SidebarSongList } from "@/components/SidebarSongList";
import { SongReadingView } from "@/components/SongReadingView";
import { Toolbar } from "@/components/Toolbar";
import { SessionMenu } from "@/components/SessionMenu";
import { FullscreenToggle } from "@/components/FullscreenToggle";
import { EditorPane, type EditorPaneRef } from "@/components/EditorPane";
import { getChordsForKey } from "@/lib/chordsByKey";
import { appendChordExtension } from "@/lib/chordAtCursor";
import type { ChordAtCursorInfo } from "@/components/EditorPane";
import { tagsFromUnknown } from "@/lib/validators";
import { useClickOutside } from "@/lib/useClickOutside";

type SongListItem = {
  id: string;
  title: string;
  artist: string | null;
  updatedAt: string;
  tags: string[];
};

type Song = {
  id: string;
  title: string;
  artist: string | null;
  key: string | null;
  tempo: number | null;
  timeSignature: string | null;
  tags: unknown;
  chordproText: string;
  audioUrl: string | null;
  referenceUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export default function AdminClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewWidth, setPreviewWidth] = useState(470);
  const [detailsExpanded, setDetailsExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [filterFavorites, setFilterFavorites] = useState<"all" | "favorites">("all");
  const [sortBy, setSortBy] = useState<"title" | "artist" | "updatedAt">("updatedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editorText, setEditorText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const editAudioRef = useRef<HTMLAudioElement | null>(null);
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const editMenuRef = useRef<HTMLDivElement>(null);

  const [metaTitle, setMetaTitle] = useState("");
  const [metaArtist, setMetaArtist] = useState("");
  const [metaKey, setMetaKey] = useState("");
  const [metaTags, setMetaTags] = useState("");
  const [metaReferenceUrl, setMetaReferenceUrl] = useState("");
  const [activeChordInfo, setActiveChordInfo] =
    useState<ChordAtCursorInfo | null>(null);
  const [popupCoords, setPopupCoords] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const POPUP_GAP = 8;
  const editorRef = useRef<EditorPaneRef>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = previewWidth;
    const minW = 280;
    const maxW = Math.min(800, typeof window !== "undefined" ? window.innerWidth * 0.6 : 800);

    function onMove(ev: MouseEvent) {
      const delta = startX - ev.clientX;
      const newW = Math.round(Math.min(maxW, Math.max(minW, startWidth + delta)));
      setPreviewWidth(newW);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }, [previewWidth]);

  const debouncedText = useDebouncedValue(editorText, 200);
  const previewDoc = useMemo(() => parseChordPro(debouncedText), [debouncedText]);
  const chordButtons = useMemo(() => getChordsForKey(metaKey), [metaKey]);

  const updatePopupPosition = useCallback(() => {
    if (!activeChordInfo) {
      setPopupCoords(null);
      return;
    }
    const view = editorRef.current?.view;
    if (!view) return;
    const coords = view.coordsAtPos(activeChordInfo.start);
    if (!coords) {
      setPopupCoords(null);
      return;
    }
    const centerX = (coords.left + coords.right) / 2;
    setPopupCoords({ left: centerX, top: coords.top });
  }, [activeChordInfo]);

  useEffect(() => {
    if (!activeChordInfo) {
      setPopupCoords(null);
      return;
    }
    updatePopupPosition();
    const onScroll = () => updatePopupPosition();
    const view = editorRef.current?.view;
    view?.scrollDOM?.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      view?.scrollDOM?.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, [activeChordInfo, updatePopupPosition]);

  useClickOutside(editMenuRef, () => setEditMenuOpen(false), editMenuOpen);

  async function refreshList() {
    const params = new URLSearchParams();
    if (query) params.set("query", query);
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortOrder);
    const res = await fetch(`/api/songs?${params}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = (await res.json()) as { items: SongListItem[] };
    setSongs(data.items);
  }

  async function loadSong(id: string) {
    editAudioRef.current?.pause();
    editAudioRef.current = null;
    const res = await fetch(`/api/songs/${id}`, { cache: "no-store" });
    if (!res.ok) return;
    const song = (await res.json()) as Song;
    setSelectedId(id);
    setSelectedSong(song);
    setEditorText(song.chordproText ?? "");
    setEditMode(false);
    setMetaTitle(song.title ?? "");
    setMetaArtist(song.artist ?? "");
    setMetaKey(song.key ?? "");
    setMetaTags(tagsFromUnknown(song.tags).join(", "));
    setMetaReferenceUrl(song.referenceUrl ?? "");
    setActiveChordInfo(null);
    setDirty(false);
  }

  useEffect(() => {
    void refreshList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void refreshList(), 250);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, sortBy, sortOrder]);

  const songFromUrl = searchParams.get("song");
  useEffect(() => {
    if (songFromUrl && songs.length > 0 && songFromUrl !== selectedId) {
      const exists = songs.some((s) => s.id === songFromUrl);
      if (exists) {
        void loadSong(songFromUrl);
        router.replace("/admin", { scroll: false });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [songFromUrl, songs.length]);


  async function onSelect(id: string) {
    if (dirty && selectedId !== id) {
      const ok = window.confirm("Changements non sauvegardés. Continuer sans sauvegarder ?");
      if (!ok) return;
    }
    await loadSong(id);
  }

  async function onCancel() {
    if (editMode && !dirty) {
      editAudioRef.current?.pause();
      editAudioRef.current = null;
      setEditMode(false);
      return;
    }
    if (selectedId) {
      await loadSong(selectedId);
    } else {
      setSelectedId(null);
      setSelectedSong(null);
      setMetaTitle("");
      setMetaArtist("");
      setMetaKey("");
      setMetaTags("");
      setMetaReferenceUrl("");
      setEditorText("");
      setActiveChordInfo(null);
      setDirty(false);
    }
  }

  async function onNew() {
    if (dirty) {
      const ok = window.confirm("Changements non sauvegardés. Créer un nouveau chant quand même ?");
      if (!ok) return;
    }
    setSelectedId(null);
    setSelectedSong(null);
    setEditMode(true);
    setMetaTitle("Nouveau chant");
    setMetaArtist("");
    setMetaKey("");
    setMetaTags("");
    setMetaReferenceUrl("");
    setEditorText("{title: Nouveau chant}\n\n");
    setActiveChordInfo(null);
    setDirty(true);
  }

  async function onSave() {
    setSaving(true);
    try {
      const parsed = parseChordPro(editorText);
      const title = metaTitle.trim() || parsed.title?.trim() || selectedSong?.title || "Sans titre";
      const artist = metaArtist.trim() || parsed.artist?.trim() || null;
      const key = metaKey.trim() || parsed.key?.trim() || null;
      const tags = metaTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      if (selectedId) {
        const res = await fetch(`/api/songs/${selectedId}`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            artist,
            key,
            tags,
            chordproText: editorText,
            referenceUrl: metaReferenceUrl.trim() || null,
          }),
        });
        if (!res.ok) throw new Error("save_failed");
        const updated = (await res.json()) as Song;
        setSelectedSong(updated);
        setMetaTitle(updated.title ?? title);
        setMetaArtist(updated.artist ?? artist ?? "");
        setMetaKey(updated.key ?? key ?? "");
        setMetaTags(tagsFromUnknown(updated.tags).join(", "));
        setMetaReferenceUrl(updated.referenceUrl ?? "");
        setDirty(false);
        await refreshList();
        return;
      }

      // create
      const res = await fetch(`/api/songs`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          artist,
          key,
          tags,
          chordproText: editorText,
          referenceUrl: metaReferenceUrl.trim() || null,
        }),
      });
      if (!res.ok) throw new Error("create_failed");
      const created = (await res.json()) as Song;
      setSelectedId(created.id);
      setSelectedSong(created);
      setMetaTitle(created.title ?? title);
      setMetaArtist(created.artist ?? artist ?? "");
      setMetaKey(created.key ?? key ?? "");
      setMetaReferenceUrl(created.referenceUrl ?? "");
      setMetaTags(tagsFromUnknown(created.tags).join(", "));
      setDirty(false);
      await refreshList();
    } finally {
      setSaving(false);
    }
  }

  function onRemoveChords() {
    const ok = window.confirm(
      "Effacer tous les accords entre crochets [xxx] du chant ? Les paroles seront conservées."
    );
    if (!ok) return;
    const newText = editorText.replace(/\[[^\]]*\]/g, "");
    setEditorText(newText);
    setDirty(true);
  }

  async function onDelete() {
    if (!selectedId) return;
    const ok = window.confirm("Supprimer ce chant ? Cette action est irréversible.");
    if (!ok) return;

    const res = await fetch(`/api/songs/${selectedId}`, { method: "DELETE" });
    if (!res.ok) return;
    setSelectedId(null);
    setSelectedSong(null);
    setEditorText("");
    setMetaTitle("");
    setMetaArtist("");
    setMetaKey("");
    setMetaTags("");
    setMetaReferenceUrl("");
    setActiveChordInfo(null);
    setDirty(false);
    await refreshList();
  }

  function onExport() {
    const text = editorText;
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeTitle = (metaTitle || selectedSong?.title || "song").replace(/[^\w\-]+/g, "_");
    a.href = url;
    a.download = `${safeTitle}.chordpro.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function insertChordAtCursor(chord: string) {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    const insertText = `[${chord}]`;
    view.dispatch({ changes: { from, to, insert: insertText } });
    setDirty(true);
  }

  function handleChordAtCursorChange(info: ChordAtCursorInfo | null) {
    setActiveChordInfo(info);
  }

  function applyChordExtension(ext: "7" | "9" | "11") {
    if (!activeChordInfo) return;
    const view = editorRef.current?.view;
    if (!view) return;
    const newChord = appendChordExtension(activeChordInfo.chord, ext);
    const newInsert = `[${newChord}]`;
    view.dispatch({
      changes: {
        from: activeChordInfo.start,
        to: activeChordInfo.end,
        insert: newInsert,
      },
    });
    setDirty(true);
    setActiveChordInfo({
      chord: newChord,
      start: activeChordInfo.start,
      end: activeChordInfo.start + newInsert.length,
    });
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  async function onAudioFileSelected(files: FileList | null) {
    if (!files?.[0] || !selectedId) return;
    setUploadingAudio(true);
    try {
      const formData = new FormData();
      formData.append("file", files[0]);
      const res = await fetch(`/api/songs/${selectedId}/audio`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        window.alert(err.message || "Erreur lors de l'upload");
        return;
      }
      const { url } = (await res.json()) as { url: string };
      setSelectedSong((prev) => (prev ? { ...prev, audioUrl: url } : null));
    } finally {
      setUploadingAudio(false);
      if (audioInputRef.current) audioInputRef.current.value = "";
    }
  }

  async function onDeleteAudio() {
    if (!selectedId || !selectedSong?.audioUrl) return;
    if (!window.confirm("Supprimer le fichier audio de ce chant ?")) return;
    const res = await fetch(`/api/songs/${selectedId}/audio`, { method: "DELETE" });
    if (res.ok) {
      setSelectedSong((prev) => (prev ? { ...prev, audioUrl: null } : null));
    } else {
      window.alert("Erreur lors de la suppression");
    }
  }

  async function onImportFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (dirty) {
      const ok = window.confirm("Changements non sauvegardés. Importer quand même ?");
      if (!ok) return;
    }
    const fileArray = Array.from(files);
    setSaving(true);
    try {
      let firstCreatedId: string | null = null;
      let imported = 0;
      for (const file of fileArray) {
        const text = await file.text();
        const parsed = parseChordPro(text);
        const title = parsed.title?.trim() || file.name.replace(/\.(txt|chordpro|pro)$/i, "") || "Sans titre";
        const artist = parsed.artist?.trim() ?? null;
        const key = parsed.key?.trim() ?? null;
        const res = await fetch("/api/songs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            title,
            artist,
            key,
            tags: [],
            chordproText: text,
          }),
        });
        if (res.ok) {
          imported += 1;
          const created = (await res.json()) as Song;
          if (!firstCreatedId) firstCreatedId = created.id;
        }
      }
      await refreshList();
      if (firstCreatedId) await loadSong(firstCreatedId);
      if (imported < fileArray.length) {
        window.alert(`${imported} chant(s) importé(s) sur ${fileArray.length}. Certains ont peut-être échoué.`);
      }
    } finally {
      setSaving(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      e.preventDefault();
      void onSave();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorText, selectedId]);

  return (
    <div className="flex min-h-svh overflow-hidden text-zinc-900 dark:text-zinc-100">
      {/* Background style Fretlist/Cisco : cercles floutés light + dark */}
      <div
        className="fixed inset-0 -z-10 bg-white dark:bg-[#030712]"
        aria-hidden
      >
        {/* Cercles floutés pastels (thème clair, style Cisco) */}
        <div className="block dark:hidden fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-200/40 blur-[120px]" />
          <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-accent-200/30 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-accent-200/25 blur-[110px]" />
          <div className="absolute -bottom-20 right-1/3 w-[480px] h-[480px] rounded-full bg-amber-200/20 blur-[100px]" />
        </div>
        {/* Cercles floutés accent (thème sombre) */}
        <div className="hidden dark:block fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-teal-500/20 blur-[120px]" />
          <div className="absolute top-1/3 -right-20 w-[400px] h-[400px] rounded-full bg-pink-500/15 blur-[100px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-accent-500/15 blur-[110px]" />
          <div className="absolute -bottom-20 right-1/3 w-[480px] h-[480px] rounded-full bg-orange-500/10 blur-[100px]" />
        </div>
        {/* Overlay bruit subtil (style Fretlist) */}
        <div className="noise-overlay pointer-events-none fixed inset-0" aria-hidden />
      </div>

      {/* Sidebar gauche : dans le flux flex (style Fretlist), pas en overlay */}
      {sidebarOpen && (
        <aside
          className="w-72 xl:w-80 shrink-0 flex flex-col border-r border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 overflow-hidden backdrop-blur-sm"
          aria-label="Liste des chants"
        >
          <SidebarSongList
            collapsed={false}
            overlay={false}
            hideCollapseButton
            onToggleCollapsed={() => setSidebarOpen(false)}
            query={query}
            onQueryChange={setQuery}
            filterFavorites={filterFavorites}
            onFilterFavoritesChange={setFilterFavorites}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={(by, order) => {
              setSortBy(by);
              setSortOrder(order);
            }}
            songs={songs}
            selectedId={selectedId}
            onSelect={onSelect}
            onNew={onNew}
          />
        </aside>
      )}

      {/* Zone principale : flex-1 min-w-0 pour éviter débordement */}
      <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
        <header className="relative z-10 flex-shrink-0 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/70 backdrop-blur-md">
          <div className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-3">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            title={sidebarOpen ? "Replier le panneau" : "Afficher le panneau"}
          >
            {sidebarOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            )}
          </button>
          {!editMode ? (
            <Toolbar
              dirty={dirty}
              saving={saving}
              editMode={editMode}
              onSave={onSave}
              onCancel={onCancel}
            />
          ) : (
            <div className="flex-1" />
          )}
          <div className="flex items-center gap-2">
            <FullscreenToggle />
            <SessionMenu />
          </div>
        </div>
        </header>

        {/* Ligne éditeur + preview (style Fretlist) */}
        <div className="flex flex-1 min-w-0 w-full overflow-hidden">
          {/* Zone principale : lecture ou édition */}
          <div className="flex flex-1 min-w-0 flex-col overflow-hidden">
            <div className="flex-1 min-h-0 min-w-0 overflow-hidden flex flex-col">
              {!selectedId ? (
                <div className="flex flex-col items-center justify-center min-h-full text-center px-4">
                  <p className="text-lg text-zinc-600 dark:text-zinc-400">
                    Bonjour {session?.user?.name ?? session?.user?.email?.split("@")[0] ?? "Utilisateur"}, veuillez sélectionner un chant pour commencer.
                  </p>
                </div>
              ) : selectedId && !editMode ? (
                <SongReadingView
                  key={selectedId}
                  chordproText={editorText}
                  referenceUrl={selectedSong?.referenceUrl ?? null}
                  audioUrl={selectedSong?.audioUrl ?? null}
                  songId={selectedId}
                  onEditClick={() => setEditMode(true)}
                  onImport={onImportClick}
                  onExport={onExport}
                  onDelete={onDelete}
                  sidebarOpen={sidebarOpen}
                />
              ) : (
              <div className="flex flex-col min-h-0 flex-1 overflow-hidden">
              {/* Toolbar édition : Save, Cancel, menu ... */}
              <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 shrink-0">
                <div className="relative" ref={editMenuRef}>
                  <button
                    type="button"
                    onClick={() => setEditMenuOpen((o) => !o)}
                    className="rounded-lg bg-zinc-800/80 p-2 text-white hover:bg-zinc-700 transition-colors"
                    title="Menu"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="5" cy="12" r="1" />
                      <circle cx="12" cy="12" r="1" />
                      <circle cx="19" cy="12" r="1" />
                    </svg>
                  </button>
                  {editMenuOpen ? (
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-xl bg-zinc-950 shadow-2xl py-2 border border-zinc-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          onImportClick();
                          setEditMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Import
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onExport();
                          setEditMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-zinc-100 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Export
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDelete();
                          setEditMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800/80 flex items-center gap-3 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                        Supprimer le chant
                      </button>
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {(dirty || editMode) && onCancel ? (
                    <button
                      onClick={onCancel}
                      className="rounded-lg border border-zinc-300 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900/40 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-900"
                    >
                      Cancel
                    </button>
                  ) : null}
                  {dirty ? (
                    <button
                      onClick={onSave}
                      disabled={saving}
                      className="rounded-lg bg-gradient-to-r from-accent-500 to-accent-600 px-3 py-1.5 text-sm font-medium text-white hover:from-accent-600 hover:to-accent-700 disabled:opacity-60 disabled:from-accent-500 disabled:to-accent-600 transition-all"
                      title="Ctrl/Cmd+S"
                    >
                      Save
                    </button>
                  ) : null}
                </div>
              </div>
              {/* Contenu éditeur : formulaire scrollable + éditeur qui prend l'espace restant (évite ascenseur inutile) */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="shrink-0 overflow-y-auto max-h-[45vh]">
              <div className="mx-auto max-w-3xl space-y-4 px-4 py-4">
              {/* Titre + Artiste : flex row comme Fretlist */}
              <div className="flex flex-col md:flex-row gap-4">
                <label className="flex-1 min-w-0 space-y-2">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Titre</div>
                  <input
                    value={metaTitle}
                    onChange={(e) => {
                      setMetaTitle(e.target.value);
                      setDirty(true);
                    }}
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors"
                  />
                </label>
                <label className="flex-1 min-w-0 space-y-2">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Artiste</div>
                  <input
                    value={metaArtist}
                    onChange={(e) => {
                      setMetaArtist(e.target.value);
                      setDirty(true);
                    }}
                    placeholder="Laisser vide pour les originaux"
                    className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors"
                  />
                </label>
              </div>

              {/* Song Details collapsible (style Fretlist) */}
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setDetailsExpanded((v) => !v)}
                  className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100/50 dark:hover:bg-zinc-800/30 transition-colors"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Détails du chant</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                      Tonalité {metaKey.trim() || "—"}
                    </span>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-zinc-500 dark:text-zinc-400 flex-none ml-2 transition-transform duration-200 ${
                      detailsExpanded ? "rotate-90" : ""
                    }`}
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>
                {detailsExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 space-y-4">
                    <label className="block">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Tonalité</div>
                      <input
                        value={metaKey}
                        onChange={(e) => {
                          const newKey = e.target.value;
                          setMetaKey(newKey);
                          setDirty(true);
                          const trimmed = newKey.trim();
                          if (trimmed) {
                            const keyLine = `{key: ${trimmed}}`;
                            const replaced = editorText.replace(/\{key\s*:\s*[^}]*\}/gi, keyLine);
                            setEditorText(replaced !== editorText ? replaced : (editorText ? `${keyLine}\n${editorText}` : keyLine));
                          } else {
                            setEditorText((prev) => prev.replace(/\{key\s*:\s*[^}]*\}\s*\n?/g, ""));
                          }
                        }}
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors"
                      />
                    </label>

                    <label className="block">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Tags (séparés par des virgules)</div>
                      <input
                        value={metaTags}
                        onChange={(e) => {
                          setMetaTags(e.target.value);
                          setDirty(true);
                        }}
                        className="w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors"
                      />
                    </label>
                    <label className="block">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Lien original (YouTube, etc.)</div>
                      <div className="relative">
                        <input
                          type="url"
                          value={metaReferenceUrl}
                          onChange={(e) => {
                            setMetaReferenceUrl(e.target.value);
                            setDirty(true);
                          }}
                          placeholder="https://www.youtube.com/watch?v=..."
                          className={`w-full rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 px-3 py-2 text-sm outline-none focus-visible:bg-white dark:focus-visible:bg-zinc-950/50 focus:ring-2 focus:ring-accent-500 transition-colors ${metaReferenceUrl.trim() ? "pr-10" : ""}`}
                        />
                        {metaReferenceUrl.trim() ? (
                          <a
                            href={metaReferenceUrl.trim().startsWith("http") ? metaReferenceUrl.trim() : `https://${metaReferenceUrl.trim()}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-accent-600 dark:text-accent-400 hover:bg-accent-500/10 transition-colors"
                            title="Ouvrir le lien"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                          </a>
                        ) : null}
                      </div>
                    </label>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Audio</div>
                      {selectedSong?.audioUrl ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <audio
                            ref={editAudioRef}
                            src={selectedSong.audioUrl}
                            controls
                            className="audio-player h-8 max-w-full min-w-[200px]"
                          />
                          <button
                            type="button"
                            onClick={() => void onDeleteAudio()}
                            className="rounded-md border border-accent-500/30 dark:border-accent-400/30 bg-zinc-200 dark:bg-zinc-800 px-2 py-1 text-xs text-accent-600 dark:text-accent-300 hover:bg-accent-50 dark:hover:bg-accent-950/30 transition-colors"
                          >
                            Supprimer
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <input
                            ref={audioInputRef}
                            type="file"
                            accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/webm,audio/mp4,video/mp4"
                            className="hidden"
                            onChange={(e) => void onAudioFileSelected(e.target.files)}
                          />
                          <button
                            type="button"
                            onClick={() => audioInputRef.current?.click()}
                            disabled={!selectedId || uploadingAudio}
                            className="rounded-lg bg-gradient-to-r from-accent-500/60 to-accent-600/60 hover:from-accent-600 hover:to-accent-700 px-3 py-1.5 text-sm font-medium text-white transition-all disabled:opacity-50"
                          >
                            {uploadingAudio ? "Upload..." : "Upload audio"}
                          </button>
                          <span className="text-xs text-zinc-500">mp3, wav, ogg (max 10 Mo)</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Accords rapides */}
              <div className="rounded-md border border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-950/30 overflow-hidden">
                <div className="px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Accords rapides (tonalité {metaKey.trim() || "—"})
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {chordButtons.map((chord) => (
                      <button
                        key={chord}
                        type="button"
                        onClick={() => insertChordAtCursor(chord)}
                        className="rounded-lg bg-gradient-to-r from-accent-500/60 to-accent-600/60 hover:from-accent-600 hover:to-accent-700 px-3 py-1.5 text-sm font-medium text-white transition-all"
                      >
                        {chord}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={onRemoveChords}
                    className="rounded-lg bg-gradient-to-r from-accent-500/60 to-accent-600/60 hover:from-accent-600 hover:to-accent-700 px-3 py-1.5 text-sm font-medium text-white shrink-0 transition-all"
                    title="Supprimer tous les accords [xxx] du chant"
                  >
                    Effacer accords
                  </button>
                </div>
              </div>

              </div>
              </div>
              {/* Éditeur ChordPro : prend l'espace restant, même largeur max que le formulaire */}
              <div className="flex-1 min-h-0 flex flex-col mx-auto max-w-3xl w-full px-4 pb-4">
                <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 shrink-0">Paroles & accords</div>
                <div className="flex-1 min-h-[200px]">
                  <EditorPane
                    ref={editorRef}
                    value={editorText}
                    height="100%"
                    onChange={(v) => {
                      setEditorText(v);
                      setDirty(true);
                    }}
                    onChordAtCursorChange={handleChordAtCursorChange}
                  />
                </div>
              </div>
              </div>
              </div>
              )}
            </div>
          </div>

          {/* Barre de redimensionnement (style Fretlist) - visible uniquement en mode édition */}
          {editMode && previewOpen && (
            <div
              role="separator"
              aria-orientation="vertical"
              onMouseDown={handleResizeStart}
              className="w-3 shrink-0 flex items-center justify-center border-l border-zinc-200 dark:border-zinc-800 hover:bg-teal/10 transition-colors cursor-col-resize group select-none"
              title="Redimensionner"
            >
              <div className="w-1.5 h-16 rounded-full bg-zinc-300 dark:bg-zinc-600 group-hover:bg-teal transition-colors pointer-events-none" />
            </div>
          )}

          {/* Preview live : largeur redimensionnable (style Fretlist) - visible uniquement en mode édition */}
          {editMode ? (previewOpen ? (
            <aside
              className="shrink-0 overflow-auto border-l border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/30"
              style={{ width: previewWidth }}
              aria-label="Preview live"
            >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Preview</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700 hover:text-zinc-700 dark:hover:text-zinc-200"
                title="Masquer la preview"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M15 3v18" />
                  <path d="m8 9 3 3-3 3" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <ChordProPreview doc={previewDoc} />
            </div>
          </aside>
          ) : (
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="shrink-0 w-10 flex flex-col items-center justify-center border-l border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 transition-colors"
              title="Afficher la preview"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-500 dark:text-zinc-400">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </button>
          )) : null}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.chordpro,.pro"
        className="hidden"
        multiple
        onChange={(e) => void onImportFiles(e.target.files)}
      />

      {typeof document !== "undefined" &&
        activeChordInfo &&
        popupCoords &&
        createPortal(
          <div
            className="fixed z-50 flex gap-1 rounded-lg bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-2 py-1.5 shadow-xl"
            style={{
              left: popupCoords.left,
              top: popupCoords.top - POPUP_GAP,
              transform: "translate(-50%, -100%)",
            }}
          >
            {(["7", "9", "11"] as const).map((ext) => (
              <button
                key={ext}
                type="button"
                onClick={() => applyChordExtension(ext)}
                className="rounded-lg bg-gradient-to-r from-accent-500/60 to-accent-600/60 hover:from-accent-600 hover:to-accent-700 px-3 py-1.5 text-sm font-medium text-white transition-all"
                title={`Ajouter ${ext}`}
              >
                {ext}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

