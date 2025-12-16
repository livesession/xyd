import { createExtension } from "@blocknote/core";
import { createBlockConfig, createBlockSpec } from "@blocknote/core";
import { createReactBlockSpec } from "@blocknote/react";
import {
  addDefaultPropsExternalHTML,
  defaultProps,
  parseDefaultProps,
} from "@blocknote/core";
import Paragraph from "@tiptap/extension-paragraph";

export type ParagraphBlockConfig = ReturnType<
  typeof createParagraphBlockConfig
>;

export const createParagraphBlockConfig = createBlockConfig(
  () =>
    ({
      type: "paragraph" as const,
      propSchema: defaultProps,
      content: "inline" as const,
    }) as const,
);

export const createParagraphBlockSpec = createBlockSpec(
  createParagraphBlockConfig,
  // {
  //   type: "paragraph" as const,
  //   propSchema: defaultProps,
  //   content: "inline" as const,
  // },
  {
    // meta: {
    //   isolating: false,
    // },
    // parse: (e) => {
    //   if (e.tagName !== "P") {
    //     return undefined;
    //   }

    //   // Edge case for things like images directly inside paragraph.
    //   if (!e.textContent?.trim()) {
    //     return undefined;
    //   }

    //   return {}
    //   return parseDefaultProps(e);
    // },
    render: () => {
      const dom = document.createElement("p");
      // return <div>
      //   Hllo Paragraph
      // </div>

      return {
        dom,
        contentDOM: dom,
      };
    },
    // toExternalHTML: (block) => {
    //   const dom = document.createElement("p");
    //   addDefaultPropsExternalHTML(block.props, dom);
    //   return {
    //     dom,
    //     contentDOM: dom,
    //   };
    // },
    runsBefore: ["default"],
  },
  // [
  //   createExtension({
  //     key: "paragraph-shortcuts",
  //     keyboardShortcuts: {
  //       "Mod-Alt-0": ({ editor }) => {
  //         const cursorPosition = editor.getTextCursorPosition();

  //         if (
  //           editor.schema.blockSchema[cursorPosition.block.type].content !==
  //           "inline"
  //         ) {
  //           return false;
  //         }

  //         editor.updateBlock(cursorPosition.block, {
  //           type: "paragraph",
  //           props: {},
  //         });
  //         return true;
  //       },
  //     },
  //   }),
  // ],
);