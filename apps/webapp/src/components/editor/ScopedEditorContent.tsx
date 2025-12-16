import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EditorContent, useEditor } from '@tiptap/react';
import { BlockNoteView } from "@blocknote/mantine";
import { ContentDecorator } from '@xyd-js/components/content';
import interCSS from "@blocknote/core/fonts/inter.css?inline";
import mantineCSS from "@blocknote/mantine/style.css?inline";

// Import CSS as raw string using Vite's ?inline query
// @ts-ignore
import xydTheme from '@xyd-js/themes/index.css?inline';
import '@xyd-js/themes/tokens.css';

interface ScopedEditorContentProps {
  editor: ReturnType<typeof useEditor>;
  className?: string;
}

// console.log(xydTheme, 999)

export const ScopedEditorContent: React.FC<ScopedEditorContentProps> = ({ editor, className }) => {
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);

  // Callback ref to capture the DOM node when it mounts
  const onRefChange = React.useCallback((node: HTMLDivElement | null) => {
    setContainer(node);
    if (node && !node.shadowRoot) {
      const root = node.attachShadow({ mode: 'open' });
      setShadowRoot(root);
    } else if (node?.shadowRoot) {
      setShadowRoot(node.shadowRoot);
    }
  }, []);

  return (
    <div ref={onRefChange} className={className}>
      {shadowRoot && createPortal(
        <>
          {/* <style dangerouslySetInnerHTML={{
            __html: `
            @layer @reset, components, blocknote;

@layer blocknote {
  ${mantineCSS}
}


            `}}></style> */}
          <style>{interCSS}</style>
          <style>{mantineCSS}</style>
          <style>{xydTheme}</style>

          <div className="scoped-editor-wrapper h-full">
            <ContentDecorator>
              <BlockNoteView editor={editor} className="h-full" />
            </ContentDecorator>
          </div>
        </>,
        shadowRoot as unknown as Element
      )}
    </div>
  );
};


// Helper to ensure styles/context work ? 
// Actually Tiptap EditorContent mounts directly. 
// When using Portal, React handles the tree.
// We need to inject styles. 

// Wait, createPortal renders React children into a DOM node.
// We render the <style> and the <EditorContent> into the shadowRoot.
