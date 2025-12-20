import { createReactBlockSpec, useCreateBlockNote } from "@blocknote/react";
import {
  BlockNoteSchema,
  defaultBlockSpecs,
  defaultProps,
} from "@blocknote/core";
import { ScopedEditorContent } from "./ScopedEditorContent";
import { customMarkdownToBlocks } from "../../utils/markdownParser";
import { useEffect, useRef, useState } from "react";

interface VisualEditorProps {
  content: string; // Markdown content (body only, no frontmatter)
  fileName: string
  frontmatter?: string; // YAML frontmatter (optional)
  onChange?: (markdown: string) => void; // Returns full markdown with frontmatter
  readOnly?: boolean;
}

// The Alert block.
export const createAlert = createReactBlockSpec(
  {
    type: "alert",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
      type: {
        default: "warning",
        values: ["warning", "error", "info", "success"],
      },
    },
    content: "inline",
  },
  {
    render: (props) => {
      return <div>Alert</div>;
    },
  }
);

export function VisualEditor({
  content,
  fileName,
  frontmatter,
  onChange,
  readOnly = false,
}: VisualEditorProps) {
  // Create schema with custom blocks
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
    },
  });

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        class: "my-editor-styles",
      },
    },
    schema,
  });

  const lastEmittedContent = useRef<string | null>(null);
  const [contentElements, setContentElements] = useState()

  async function updateContent() {
    // content is null or undefined check?
    if (!content) return;

    // // Check if the new content is what we just emitted.
    // // If so, ignore it to prevent loop/re-render flicker.
    if (content === lastEmittedContent.current) return;

    console.log(2222);

    // Access underlying Tiptap/ProseMirror schema.
    // We cast to any because _tiptapEditor is internal/private in strict types but accessible at runtime.
    const pmSchema = (editor as any)._tiptapEditor?.schema;
    if (!pmSchema) return;

    console.log(3333);
    const [blocksFromMarkdown, reactElements] = await customMarkdownToBlocks(content, fileName, pmSchema);
    // editor.replaceBlocks(editor.document, blocksFromMarkdown as any);

    if (reactElements) {
      setContentElements(reactElements)
    }
    console.log("blocksFromMarkdown", blocksFromMarkdown);
  }

  // Handle incoming content changes
  useEffect(() => {
    updateContent();
  }, [editor, content]);

  // Handle outgoing content changes
  useEffect(() => {
    if (editor && onChange) {
      // Debounce or immediate? Immediate is fine for local.
      const cleanup = editor.onEditorContentChange(async () => {
        const bodyMarkdown = await editor.blocksToMarkdownLossy(
          editor.document
        );

        // Combine frontmatter with body content
        let fullMarkdown = bodyMarkdown;
        if (frontmatter && frontmatter.trim() !== "") {
          fullMarkdown = `---\n${frontmatter.trim()}\n---\n\n${bodyMarkdown}`;
        }

        if (fullMarkdown !== lastEmittedContent.current) {
          lastEmittedContent.current = fullMarkdown;
          onChange(fullMarkdown);
        }
      });
      return cleanup;
    }
  }, [editor, onChange, frontmatter]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full w-full border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto cursor-text">
        <ScopedEditorContent editor={editor} contentElements={contentElements} className="h-full" />
      </div>
    </div>
  );
}
