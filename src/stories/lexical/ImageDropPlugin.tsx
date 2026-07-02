import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_LOW, DRAGOVER_COMMAND, DROP_COMMAND } from "lexical";

export interface ImageDropPluginProps {
  /** Must match the `format` used in <LumeoMiniViewer dragData={{ format }} />. Default: "text/plain". */
  format?: string;
}

/**
 * Reference Lexical plugin for consuming LumeoMiniViewer's draggable thumbnails: accepts the
 * dropped payload and inserts it as text at the current selection. A production editor would
 * typically resolve the drop caret position instead of the last selection — this keeps the
 * example short. Not part of the published package; copy it into your own app.
 */
export function ImageDropPlugin({ format = "text/plain" }: ImageDropPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const unregisterDragOver = editor.registerCommand(
      DRAGOVER_COMMAND,
      (event: DragEvent) => {
        event.preventDefault();
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    const unregisterDrop = editor.registerCommand(
      DROP_COMMAND,
      (event: DragEvent) => {
        const text = event.dataTransfer?.getData(format);
        if (!text) return false;
        event.preventDefault();
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertText(text);
          }
        });
        return true;
      },
      COMMAND_PRIORITY_LOW
    );

    return () => {
      unregisterDragOver();
      unregisterDrop();
    };
  }, [editor, format]);

  return null;
}
