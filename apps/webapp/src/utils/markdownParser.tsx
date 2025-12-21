import { Schema } from "prosemirror-model";
import { HTMLToBlocks } from "@blocknote/core";
import { toMarkdown } from "mdast-util-to-markdown";
// import { markdownPlugins } from "@xyd-js/content/md";
// import { ContentFS } from "@xyd-js/content";
import React from "react";
import ReactDOMServer from "react-dom/server";
import { UXAnalytics, UXNode } from "openux-js";
import { ReactContent } from "@xyd-js/components/content";

const rc = new ReactContent();
const contentComponents = rc.components();

// Helper to generate unique IDs (simple UUID v4)
function generateId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Counter for unique markers
let markerCounter = 0;

function containerDirective(state: any, node: any) {
  // const attributes = node.attributes || {};
  // const contentType = node.name;
  const markerId = `__CUSTOM_COMPONENT_${markerCounter++}__`;

  // Create a paragraph with a unique marker text
  const result = {
    type: "element",
    tagName: "p",
    properties: {},
    children: [{ type: "text", value: markerId }],
  };

  state.patch(node, result);
  return state.applyData(node, result);
}

const analytics = {
  track() {},
};

export async function customMarkdownToBlocks(
  editor: any,
  markdown: string,
  fileName: string,
  pmSchema: Schema
) {
  // // Compile markdown using the main process
  // try {

  //   if (result.success && result.compiledContent) {
  //     console.log("Compiled markdown:", result.compiledContent);
  //     // You can use the compiled content here if needed
  //   } else if (result.error) {
  //     console.error("Failed to compile markdown:", result.error);
  //   }
  // } catch (e) {
  //   console.error(e);
  // }

  const result = await window.electronAPI.editor.compileMarkdown(
    markdown,
    fileName
  );

  const mdxResult = mdxExport(result.compiledContent || "");

  let htmlString = "";
  let reactTree

  if (mdxResult && mdxResult.default) {
    const MDXComponent = mdxResult.default;
    // TODO: !!! support all components from react content !!!
    reactTree = MDXComponent({
      components: {
        ...contentComponents,
        wrapper({ children }) {
          return (
            <UXNode name="app" props={{}}>
              <UXAnalytics analytics={analytics}>{children}</UXAnalytics>
            </UXNode>
          );
        },
        // pre: CodeSample
      },
    });

    htmlString = ReactDOMServer.renderToStaticMarkup(reactTree);

    // console.log("htmlString", htmlString);
    // console.log("reactTree", reactTree);
  }

  // Reset marker counter
  // markerCounter = 0;

  // Store component data by marker ID
  // const componentData = new Map<
  //   string,
  //   { type: string; attributes: any; childrenMdast: any[] }
  // >();

  // // First pass: extract the markdown AST to get component children
  // const firstProcessor = unified()
  //   .use(remarkParse)
  //   .use(remarkGfm)
  //   .use(remarkDirective);

  // const mdast = firstProcessor.parse(markdown);

  // Walk the tree to find containerDirectives and store their children
  // function visitNode(node: any) {
  //   if (node.type === "containerDirective") {
  //     const markerId = `__CUSTOM_COMPONENT_${markerCounter++}__`;
  //     const contentType = node.name;
  //     const attributes = node.attributes || {};

  //     // Store the actual AST children nodes
  //     componentData.set(markerId, {
  //       type: contentType,
  //       attributes,
  //       childrenMdast: node.children || [],
  //     });
  //   }

  //   if (node.children) {
  //     node.children.forEach(visitNode);
  //   }
  // }

  // visitNode(mdast);

  // Reset counter for second pass
  // markerCounter = 0;

  // Second pass: convert to HTML with markers
  // const processor = unified()
  //   .use(remarkParse)
  //   .use(remarkGfm)
  //   .use(remarkDirective)
  //   .use(remarkRehype, {
  //     handlers: {
  //       ...(remarkRehypeDefaultHandlers as any),
  //       image: (state: any, node: any) => {
  //         const url = String(node?.url || "");
  //         if (isVideoUrl(url)) {
  //           return video(state, node);
  //         } else {
  //           return remarkRehypeDefaultHandlers.image(state, node);
  //         }
  //       },
  //       code,
  //       blockquote: (state: any, node: any) => {
  //         const result = {
  //           type: "element",
  //           tagName: "blockquote",
  //           properties: {},
  //           children: state.wrap(state.all(node), false),
  //         };
  //         state.patch(node, result);
  //         return state.applyData(node, result);
  //       },
  //       containerDirective,
  //     },
  //   })
  //   .use(rehypeStringify);

  // const file = await processor.process(markdown);
  // const htmlString = file.value as string;

  // console.log("html string", htmlString)
  let blocks = HTMLToBlocks(htmlString, pmSchema);
  // console.log(blocks, 999)

  // Replace marker blocks with actual custom blocks
  const finalBlocks: any[] = [];

  for (const block of blocks) {
    finalBlocks.push(block);
  }

  console.log("htmlString", htmlString)
  console.log("result", result);
  console.log("Final blocks:", finalBlocks);

  return [finalBlocks, reactTree];
}

function mdxExport(code: string) {
  const scope = {
    Fragment: React.Fragment,
    jsxs: React.createElement,
    jsx: React.createElement,
    jsxDEV: React.createElement,
  };
  const fn = new Function(...Object.keys(scope), code);
  return fn(scope);
}


/*
   // Check if this block is a marker paragraph
    if (
      block.type === "paragraph" &&
      block.content?.[0]?.type === "text" &&
      block.content[0].text?.startsWith("__CUSTOM_COMPONENT_")
    ) {
      continue;

      const markerId = block.content[0].text;
      const component = componentData.get(markerId);

      if (component) {
        let childBlocks: any[] = [];

        // Convert the MDAST children back to markdown string
        if (component.childrenMdast && component.childrenMdast.length > 0) {
          // Create a temporary MDAST root with the children
          const tempMdast = {
            type: "root",
            children: component.childrenMdast,
          };

          // Convert back to markdown string
          const childrenMarkdown = toMarkdown(tempMdast);

          // Recursively parse the children markdown
          childBlocks = await customMarkdownToBlocks(
            childrenMarkdown,
            pmSchema
          );
        }

        // If no children or empty, create a default empty paragraph
        if (childBlocks.length === 0) {
          childBlocks = [
            {
              id: generateId(),
              type: "paragraph",
              props: {
                backgroundColor: "default",
                textColor: "default",
                textAlignment: "left",
              },
              content: [],
              children: [],
            },
          ];
        }

        console.log(component);
        console.log(11111);
        // Create the custom block with all required fields
        finalBlocks.push({
          id: generateId(), // <-- CRITICAL: Add unique ID
          type: component.type, // "callout", "badge", etc.
          props: component.attributes, // { kind: "warning" }, etc.
          children: [
            {
              id: "adff56dd-e521-46f4-98e9-a33c1b563455",
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "ok",
                },
              ],
            },
          ],
          // content: [{
          //   type: "text",
          //   text: "ok"
          //   // text: component?.childrenMdast || ""
          // }],
          // children: [
          //   {
          //   // id:"adff56dd-e521-46f4-98e9-a33c1b563455",
          //   id: "adff56dd-e521-46f4-98e9-a33c1b563455",
          //   type:"callout",
          //   // props:{"backgroundColor":"default","textColor":"default","textAlignment":"left","level":2,"isToggleable":false},
          //   content:[{"type":"text","text":"Heading2","styles":{}}],
          //   children:[]
          //   }
          // ]
          // children: childBlocks,
        });
      } else {
        // Marker not found, keep original block
        finalBlocks.push(block);
      }
    } else {
      // Regular block, keep as is
     
    }
      */