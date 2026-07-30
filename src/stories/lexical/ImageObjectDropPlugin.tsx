import { useEffect } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $insertNodes,
  $isRangeSelection,
  COMMAND_PRIORITY_LOW,
  DRAGOVER_COMMAND,
  DROP_COMMAND,
} from "lexical";
import { $createImageNode } from "./ImageNode";
import type { LumeoImage } from "../../types";

export interface ImageObjectDropPluginProps {
  /** Must match the `format` used in <LumeoMiniViewer dragData={{ format }} />. Default: "text/plain". */
  format?: string;
}

/**
 * Reference Lexical plugin for consuming LumeoMiniViewer's draggable thumbnails as real images:
 * unlike `ImageDropPlugin` (which inserts the dropped payload as plain text), this parses the
 * dropped payload as a full `LumeoImage` JSON object and inserts an `ImageNode` carrying every
 * field (id, fileName, width, height, usage type, ...), not just the URL — so the editor's JSON
 * export shows the complete image metadata, not a bare `src`. Configure `LumeoMiniViewer`'s
 * `dragData` to hand over the whole object directly (`pattern: "{value}"`,
 * `getValue: (image) => JSON.stringify(image)`). Not part of the published package; copy it into
 * your own app alongside `ImageNode.tsx`.
 */
export function ImageObjectDropPlugin({ format = "text/plain" }: ImageObjectDropPluginProps) {
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
        const raw = event.dataTransfer?.getData(format);
        if (!raw) return false;
        let image: LumeoImage;
        try {
          image = JSON.parse(raw);
        } catch {
          return false;
        }
        event.preventDefault();
        editor.update(() => {
          const imageNode = $createImageNode({ image });
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            selection.insertNodes([imageNode]);
          } else {
            $insertNodes([imageNode]);
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
