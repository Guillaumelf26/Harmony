"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { EditorView } from "@codemirror/view";
import { getChordAtCursor } from "@/lib/chordAtCursor";

export type ChordAtCursorInfo = { chord: string; start: number; end: number };

type Props = {
  value: string;
  onChange: (value: string) => void;
  height: string;
  onChordAtCursorChange?: (info: ChordAtCursorInfo | null) => void;
};

export type EditorPaneRef = { view: EditorView | undefined };

function assignRef(ref: React.ForwardedRef<EditorPaneRef>, value: EditorPaneRef) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export const EditorPane = forwardRef<EditorPaneRef, Props>(function EditorPane(
  { value, onChange, height, onChordAtCursorChange },
  ref
) {
  const callbackRef = useRef(onChordAtCursorChange);
  callbackRef.current = onChordAtCursorChange;
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);

  const fillParent = height === "100%";

  useEffect(() => {
    if (!fillParent || !containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setMeasuredHeight(Math.max(0, entry.contentRect.height));
    });
    ro.observe(el);
    setMeasuredHeight(el.getBoundingClientRect().height);
    return () => ro.disconnect();
  }, [fillParent]);

  const chordExtension = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        const pos = update.state.selection.main.from;
        const doc = update.state.doc.toString();
        const info = getChordAtCursor(pos, doc);
        callbackRef.current?.(info);
      }),
    []
  );

  const onCreator = useCallback(
    (view: EditorView) => {
      assignRef(ref, { view });
    },
    [ref]
  );

  const codeMirrorHeight = fillParent
    ? (measuredHeight != null ? `${measuredHeight}px` : "300px")
    : height;

  return (
    <div className={`chordpro-editor min-w-0 overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white/90 dark:bg-zinc-950/30 backdrop-blur-sm flex flex-col ${fillParent ? "h-full min-h-0" : ""}`}>
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
        Éditeur (ChordPro)
      </div>
      <div ref={containerRef} className={fillParent ? "flex-1 min-h-0 overflow-hidden" : ""}>
      <CodeMirror
        ref={(r) => assignRef(ref, r ? { view: r.view } : { view: undefined })}
        onCreateEditor={onCreator}
        value={value}
        height={codeMirrorHeight}
        theme={oneDark}
        extensions={[
          markdown(),
          ...(onChordAtCursorChange ? [chordExtension] : []),
        ]}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: true,
          highlightSpecialChars: true,
          history: true,
          foldGutter: true,
          drawSelection: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: true,
          crosshairCursor: true,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: true,
          historyKeymap: true,
          foldKeymap: true,
          completionKeymap: false,
          lintKeymap: false,
        }}
        onChange={onChange}
      />
      </div>
    </div>
  );
});

