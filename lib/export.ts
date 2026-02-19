import { jsPDF } from "jspdf";
import { parseChordPro } from "@/chordpro/parse";
import { renderChordProToLines } from "@/chordpro/render";

export type ExportFormat = "chordpro" | "txt" | "pdf";

function safeFilename(title: string): string {
  return (title || "song").replace(/[^\w\-]+/g, "_");
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export ChordPro brut (.chordpro.txt) */
export function exportChordPro(rawText: string, title: string): void {
  const blob = new Blob([rawText], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${safeFilename(title)}.chordpro.txt`);
}

/** Export paroles seules (.txt) - sans accords ni directives ChordPro */
export function exportTxt(rawText: string, title: string): void {
  const doc = parseChordPro(rawText);
  const lines: string[] = [];

  if (doc.title) lines.push(doc.title);
  if (doc.artist) lines.push(doc.artist);
  if (doc.title || doc.artist) lines.push("");

  for (const line of doc.lines) {
    if (line.type === "empty") {
      lines.push("");
      continue;
    }
    if (line.type === "directive") continue;
    if (line.type === "text") {
      const lyricLine = line.segments
        .map((s) => (s.type === "lyric" ? s.text : s.lyricAfter))
        .join("");
      lines.push(lyricLine);
    }
  }

  const text = lines.join("\n");
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  downloadBlob(blob, `${safeFilename(title)}.txt`);
}

/** Export PDF avec accords et paroles formatés */
export function exportPdf(rawText: string, title: string): void {
  const doc = parseChordPro(rawText);
  const renderLines = renderChordProToLines(doc);

  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 20;
  const lineHeight = 6;
  const chordLineHeight = 4;
  let y = margin;
  const maxY = pdf.internal.pageSize.getHeight() - margin;

  // Titre
  if (doc.title) {
    pdf.setFontSize(18);
    pdf.text(doc.title, margin, y);
    y += 10;
  }
  // Artiste / tonalité
  if (doc.artist || doc.key) {
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const meta = [doc.artist, doc.key].filter(Boolean).join(" · ");
    pdf.text(meta, margin, y);
    y += 8;
    pdf.setTextColor(0, 0, 0);
  }

  pdf.setFontSize(11);
  pdf.setFont("helvetica", "normal");

  for (const { chords, lyrics } of renderLines) {
    const isEmpty = !chords && !lyrics;
    if (isEmpty) {
      y += lineHeight;
      continue;
    }

    if (y + chordLineHeight + lineHeight > maxY) {
      pdf.addPage();
      y = margin;
    }

    if (chords) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(255, 185, 0); // accent jaune
      pdf.text(chords, margin, y);
      y += chordLineHeight;
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
    }
    if (lyrics) {
      pdf.text(lyrics, margin, y);
      y += lineHeight;
    }
  }

  pdf.save(`${safeFilename(title)}.pdf`);
}
