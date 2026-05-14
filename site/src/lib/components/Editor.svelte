<script lang="ts">
  import { onMount, untrack } from "svelte";
  import { EditorState, type Extension } from "@codemirror/state";
  import {
    EditorView,
    keymap,
    lineNumbers,
    highlightActiveLine,
    drawSelection,
    gutter,
    GutterMarker,
  } from "@codemirror/view";
  import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
  import { sql, PostgreSQL } from "@codemirror/lang-sql";
  import { HighlightStyle, syntaxHighlighting, bracketMatching } from "@codemirror/language";
  import { tags as t } from "@lezer/highlight";

  interface Props {
    value: string;
    onchange: (next: string) => void;
    /** 1-based line numbers that should get a severity marker in the gutter. */
    marked?: { line: number; severity: "error" | "warn" }[];
  }

  let { value = $bindable(""), onchange, marked = [] }: Props = $props();

  let host: HTMLDivElement;
  let view: EditorView | null = null;

  const highlight = HighlightStyle.define([
    { tag: t.keyword, color: "var(--kw)", fontWeight: "600" },
    { tag: [t.string, t.special(t.string)], color: "var(--str)" },
    { tag: t.number, color: "var(--num)" },
    { tag: [t.bool, t.null], color: "var(--kw)" },
    { tag: t.comment, color: "var(--com)", fontStyle: "italic" },
    { tag: t.operator, color: "var(--punc)" },
    { tag: t.punctuation, color: "var(--punc)" },
    { tag: t.variableName, color: "var(--fg-strong)" },
    { tag: t.typeName, color: "var(--typ)" },
    { tag: t.function(t.variableName), color: "var(--typ)" },
  ]);

  const theme = EditorView.theme({
    "&": {
      backgroundColor: "transparent",
      color: "var(--fg)",
      height: "100%",
      fontSize: "0.86rem",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
      caretColor: "var(--brand)",
      padding: "0.9rem 0",
    },
    ".cm-line": { padding: "0 1rem" },
    ".cm-gutters": {
      backgroundColor: "transparent",
      border: "none",
      color: "var(--fg-faint)",
      fontFamily: "var(--font-mono)",
      fontSize: "0.72rem",
      paddingRight: "0.6rem",
    },
    ".cm-activeLine": { backgroundColor: "var(--brand-tint)" },
    ".cm-activeLineGutter": {
      backgroundColor: "transparent",
      color: "var(--brand)",
    },
    ".cm-selectionBackground, ::selection": {
      backgroundColor: "var(--brand-soft) !important",
    },
    ".cm-cursor": { borderLeftColor: "var(--brand)" },
    "&.cm-focused": { outline: "none" },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "var(--brand-soft) !important",
    },
    ".cm-marker-gutter": {
      width: "10px",
    },
    ".cm-marker-gutter .cm-gutterElement": {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
  });

  class SeverityDot extends GutterMarker {
    severity: "error" | "warn";
    constructor(severity: "error" | "warn") {
      super();
      this.severity = severity;
    }
    toDOM() {
      const dot = document.createElement("div");
      dot.style.width = "6px";
      dot.style.height = "6px";
      dot.style.borderRadius = "50%";
      dot.style.background = this.severity === "error" ? "var(--err)" : "var(--warn)";
      return dot;
    }
  }

  // Read the prop reactively through a closure so the gutter callback always
  // sees the latest `marked` value. Whenever it changes, dispatch an empty
  // transaction so CodeMirror re-renders the gutter.
  $effect(() => {
    void marked;
    view?.dispatch({});
  });

  const markerGutter = gutter({
    class: "cm-marker-gutter",
    lineMarker(view, line) {
      const lineNo = view.state.doc.lineAt(line.from).number;
      const hit = marked.find((m) => m.line === lineNo);
      return hit ? new SeverityDot(hit.severity) : null;
    },
    initialSpacer: () => new SeverityDot("warn"),
  });

  onMount(() => {
    const initial = untrack(() => value);
    const extensions: Extension[] = [
      markerGutter,
      lineNumbers(),
      history(),
      drawSelection(),
      bracketMatching(),
      highlightActiveLine(),
      sql({ dialect: PostgreSQL, upperCaseKeywords: true }),
      syntaxHighlighting(highlight),
      theme,
      keymap.of([...defaultKeymap, ...historyKeymap, indentWithTab]),
      EditorView.updateListener.of((upd) => {
        if (upd.docChanged) {
          const next = upd.state.doc.toString();
          value = next;
          onchange(next);
        }
      }),
    ];
    const state = EditorState.create({ doc: initial, extensions });
    view = new EditorView({ state, parent: host });

    return () => {
      view?.destroy();
      view = null;
    };
  });

  $effect(() => {
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      });
    }
  });
</script>

<div class="editor" bind:this={host}></div>

<style>
  .editor {
    height: 100%;
    width: 100%;
    overflow: auto;
  }
  :global(.editor .cm-editor) {
    height: 100%;
  }
</style>
