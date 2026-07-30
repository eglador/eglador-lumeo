import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";

/**
 * Reference debug panel: mirrors the editor state's JSON export live below the editor, so you can
 * see exactly what would be persisted — including a dropped `ImageNode`'s full nested `image`
 * object, not just its rendered `<img>`. Not part of the published package; copy it into your own
 * app while developing, or build your own equivalent from `editor.getEditorState().toJSON()`.
 */
export function JsonOutputPlugin() {
  const [editor] = useLexicalComposerContext();
  const [json, setJson] = useState("");

  useEffect(() => {
    const sync = () => setJson(JSON.stringify(editor.getEditorState().toJSON(), null, 2));
    sync();
    return editor.registerUpdateListener(sync);
  }, [editor]);

  return (
    <pre
      style={{
        margin: 0,
        maxHeight: 220,
        overflow: "auto",
        borderTop: "1px solid #e4e4e7",
        background: "#fafafa",
        padding: 12,
        fontSize: 11,
        lineHeight: 1.5,
        color: "#3f3f46",
      }}
    >
      {json}
    </pre>
  );
}
