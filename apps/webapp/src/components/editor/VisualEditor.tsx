import { useEditor, ReactNodeViewRenderer } from '@tiptap/react';
import { createReactBlockSpec, useCreateBlockNote } from "@blocknote/react";
import { BlockNoteSchema, createBlockConfig, createBlockSpec, createExtension, defaultBlockSpecs, defaultProps } from "@blocknote/core";
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Heading from '@tiptap/extension-heading';
import Paragraph from '@tiptap/extension-paragraph';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import { Bold, Italic, Strikethrough, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Undo, Redo } from 'lucide-react';
import { marked } from 'marked';
import TurndownService from 'turndown';
import { useEffect } from 'react';
import { HeadingNode, ParagraphNode, ListNode, ListItemNode } from './EditorNodes';
import { ScopedEditorContent } from './ScopedEditorContent';
import { customMarkdownToBlocks } from '../../utils/markdownParser';
import { createParagraphBlockSpec } from './paragraph.tsx';
import { Callout } from "@xyd-js/components/writer"

interface VisualEditorProps {
  content: string; // Markdown content
  onChange?: (markdown: string) => void;
  readOnly?: boolean;
}

// const turndownService = new TurndownService({
//   headingStyle: 'atx',
//   codeBlockStyle: 'fenced'
// });

// The types of alerts that users can choose from.
export const alertTypes = [
  {
    title: "Warning",
    value: "warning",
    color: "#e69819",
    backgroundColor: {
      light: "#fff6e6",
      dark: "#805d20",
    },
  },
  {
    title: "Error",
    value: "error",
    color: "#d80d0d",
    backgroundColor: {
      light: "#ffe6e6",
      dark: "#802020",
    },
  },
  {
    title: "Info",
    value: "info",
    color: "#507aff",
    backgroundColor: {
      light: "#e6ebff",
      dark: "#203380",
    },
  },
  {
    title: "Success",
    value: "success",
    color: "#0bc10b",
    backgroundColor: {
      light: "#e6ffe6",
      dark: "#208020",
    },
  },
] as const;


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
      return (
        <div>
          Alert
        </div>
      );
    },
  },
);

export const createCallout2 = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
    content: "inline",
  },
  {
    render: (props) => {
      console.log(88888)
      return (
        <Callout>
          <div className="inline-content" ref={props.contentRef} />
          <h1>
            hello
          </h1>
        </Callout>
      );
    },
  },
);


export const createCallout = createReactBlockSpec(
  {
    type: "callout",
    propSchema: {
      textAlignment: defaultProps.textAlignment,
      textColor: defaultProps.textColor,
    },
    content: "none",
  },
  {
    render: (props) => {
      console.log(88888, props)
      return (
        <Callout>
          Hello World
        </Callout>
      );
    },
  },
);

export function VisualEditor({ content, onChange, readOnly = false }: VisualEditorProps) {
  // Create schema with custom blocks
  const schema = BlockNoteSchema.create({
    blockSpecs: {
      ...defaultBlockSpecs,
      alert: createAlert(),
      callout: createCallout(),
    },
  });

  const editor = useCreateBlockNote({
    domAttributes: {
      editor: {
        class: "my-editor-styles",
      },
    },
    schema,
    _tiptapOptions: {
      extensions: [
        // StarterKit.configure({
        //   heading: false,
        //   paragraph: false,
        //   bulletList: false,
        //   orderedList: false,
        //   listItem: false,
        // }),
        // Heading.extend({
        //   addNodeView() {
        //     return ReactNodeViewRenderer(HeadingNode);
        //   },
        // }),
        // Paragraph.extend({
        //   addNodeView() {
        //     return ReactNodeViewRenderer(ParagraphNode);
        //   },
        // }),
        // BulletList.extend({
        //   addNodeView() {
        //     return ReactNodeViewRenderer(ListNode);
        //   },
        // }),
        // OrderedList.extend({
        //   addNodeView() {
        //     return ReactNodeViewRenderer(ListNode);
        //   },
        // }),
        // ListItem.extend({
        //   addNodeView() {
        //     return ReactNodeViewRenderer(ListItemNode);
        //   },
        // }),
        // Link.configure({
        //   openOnClick: false,
        // }),
        // Placeholder.configure({
        //   placeholder: 'Start writing...',
        // }),
      ],
      // content: content,
      // editable: !readOnly,
      // onUpdate: ({ editor }) => {
      //   const html = editor.getHTML();
      //   const markdown = turndownService.turndown(html);
      //   onChange?.(markdown);
      // },
      // editorProps: {
      //   attributes: {
      //     class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none h-full max-w-none p-4'
      //   }
      // }
    }
  });

  async function updateContent() {
    // content is null or undefined check?
    if (!content) return;
    // Access underlying Tiptap/ProseMirror schema. 
    // We cast to any because _tiptapEditor is internal/private in strict types but accessible at runtime.
    const pmSchema = (editor as any)._tiptapEditor?.schema;
    if (!pmSchema) return;

    const blocksFromMarkdown = await customMarkdownToBlocks(content, pmSchema);
    editor.replaceBlocks(editor.document, blocksFromMarkdown as any);
  }

  useEffect(() => {
    updateContent()
  }, [editor, content]);
  // Sync content when it changes externally (e.g. file switch)
  // useEffect(() => {
  //   if (editor && content) {
  //      // Only update if the content is significantly different to avoid cursor jumps
  //      // A simple check: if we are focused, we assume the user is typing, so we don't overwrite
  //      // unless the content prop changed to something completely different (like a file switch).
  //      // For this simple implementation, we'll convert MD->HTML.

  //      // Note: This is a tricky part in bidirectional sync. 
  //      // If local state update triggered this, we want to skip.
  //      // But we don't have a reliable way to know if 'content' came from 'onChange' or file switch.
  //      // We can rely on the fact that CodeWorkbench edits update 'files' state, 
  //      // but VisualEditor edits ALSO update 'files' state.

  //      // Ideally, we only setContent if the editor is NOT focused, OR if we force it (file switch).
  //      // We'll trust that React key prop on parent handles full remounts for file switches?
  //      // No, we are reusing the component.

  //      // Let's parse the current editor content to MD
  //      const currentMarkdown = turndownService.turndown(editor.getHTML());
  //      if (currentMarkdown.trim() !== content.trim()) {
  //          // Content changed externally
  //          const html = marked.parse(content) as string;
  //          editor.commands.setContent(html);
  //      }
  //   }
  // }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full w-full border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
      <div className="flex-1 overflow-y-auto cursor-text">
        <ScopedEditorContent editor={editor} className="h-full" />
      </div>

      <style>{`
        .ProseMirror p.is-editor-empty:first-child::before {
            color: #adb5bd;
            content: attr(data-placeholder);
            float: left;
            height: 0;
            pointer-events: none;
        }
        .ProseMirror {
            height: 100%;
            outline: none;
        }
       `}</style>
    </div>
  );
}
