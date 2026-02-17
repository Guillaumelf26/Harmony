"use client";

import { forwardRef, useCallback } from "react";
import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import type { EditorView } from "@codemirror/view";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height: string;
};

export type EditorPaneRef = { view: EditorView | undefined };

function assignRef(ref: React.ForwardedRef<EditorPaneRef>, value: EditorPaneRef) {
  if (typeof ref === "function") ref(value);
  else if (ref) ref.current = value;
}

export const EditorPane = forwardRef<EditorPaneRef, Props>(function EditorPane(
  { value, onChange, height },
  ref
) {
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
        extensions={[markdown()]}
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

