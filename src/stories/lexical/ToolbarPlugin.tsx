import { useCallback, useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from "lexical";
import type { TextFormatType } from "lexical";

const BUTTONS: { format: TextFormatType; label: string; style: CSSProperties }[] = [
  { format: "bold", label: "B", style: { fontWeight: 700 } },
  { format: "italic", label: "I", style: { fontStyle: "italic" } },
  { format: "underline", label: "U", style: { textDecoration: "underline" } },
  { format: "strikethrough", label: "S", style: { textDecoration: "line-through" } },
];

/**
 * Minimal reference toolbar: inline formatting only (bold/italic/underline/strikethrough),
 * highlighting whichever formats are active at the current selection. Not part of the published
 * package; copy it into your own app.
 */
export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [active, setActive] = useState<Partial<Record<TextFormatType, boolean>>>({});

  const syncActiveStates = useCallback(() => {
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;
      setActive({
        bold: selection.hasFormat("bold"),
        italic: selection.hasFormat("italic"),
        underline: selection.hasFormat("underline"),
        strikethrough: selection.hasFormat("strikethrough"),
      });
    });
  }, [editor]);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        syncActiveStates();
        return false;
      },
      COMMAND_PRIORITY_LOW
    );
  }, [editor, syncActiveStates]);

  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e4e4e7", padding: 8 }}>
      {BUTTONS.map(({ format, label, style }) => (
        <button
          key={format}
          type="button"
          // Keep the editor's own selection focused instead of stealing it to the button.
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, format)}
          style={{
            width: 28,
            height: 28,
            borderRadius: 4,
            border: "1px solid #e4e4e7",
            background: active[format] ? "#18181b" : "#fff",
            color: active[format] ? "#fff" : "#3f3f46",
            cursor: "pointer",
            ...style,
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
