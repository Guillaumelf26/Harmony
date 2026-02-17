"use client";

import CodeMirror from "@uiw/react-codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

type Props = {
  value: string;
  onChange: (value: string) => void;
  height: string;
};

export function EditorPane({ value, onChange, height }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/30">
      <div className="border-b border-zinc-800 px-3 py-2 text-xs text-zinc-400">
        Éditeur (ChordPro)
      </div>
      <CodeMirror
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
}

