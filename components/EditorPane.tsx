"use client";

import { forwardRef, useCallback, useMemo, useRef } from "react";
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

  const chordExtension = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (!update.selectionSet) return;
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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
        Éditeur (ChordPro)
      </div>
      <CodeMirror
        ref={(r) => assignRef(ref, r ? { view: r.view } : { view: undefined })}
        onCreateEditor={onCreator}
        value={value}
        height={height}
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
  );
});

