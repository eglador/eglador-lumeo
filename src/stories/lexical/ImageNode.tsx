import { DecoratorNode } from "lexical";
import type { EditorConfig, LexicalNode, NodeKey, SerializedLexicalNode, Spread } from "lexical";
import type { LumeoImage } from "../../types";

export interface ImagePayload {
  image: LumeoImage;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<{ image: LumeoImage; type: "image"; version: 1 }, SerializedLexicalNode>;

/**
 * Reference decorator node: renders a real `<img>` inside the editor and carries the *entire*
 * dropped `LumeoImage` object (id, fileName, url, width, height, usage type, etc.) — not just a
 * `src` string — so every field is preserved in the editor state and shows up in its JSON export
 * (nested under `image`, not spread into the node's own `type`/`version` keys, so nothing
 * collides with Lexical's own node discriminators). Unlike `ImageDropPlugin`, which inserts the
 * dropped payload as plain text, this is a real embedded object. Not part of the published
 * package; copy it into your own app alongside `ImageObjectDropPlugin.tsx`.
 */
export class ImageNode extends DecoratorNode<JSX.Element> {
  __image: LumeoImage;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__image, node.__key);
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode({ image: serializedNode.image });
  }

  exportJSON(): SerializedImageNode {
    return { image: this.__image, type: "image", version: 1 };
  }

  constructor(image: LumeoImage, key?: NodeKey) {
    super(key);
    this.__image = image;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const span = document.createElement("span");
    const className = config.theme.image;
    if (typeof className === "string") span.className = className;
    return span;
  }

  updateDOM(): false {
    return false;
  }

  decorate(): JSX.Element {
    return (
      <img
        src={this.__image.url}
        alt={this.__image.fileName}
        style={{ display: "block", margin: "8px 0", maxWidth: "100%", borderRadius: 6 }}
      />
    );
  }
}

export function $createImageNode({ image, key }: ImagePayload): ImageNode {
  return new ImageNode(image, key);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
