import { initDiagramExtra } from "./script";

import { visit } from "unist-util-visit";
import styles from "./styles.css";

export default function ExtraDiagram(
  pluginOptions: any = {} // TODO: fix any
): any {
  return function (settings: any) {
    const headScripts: [string, Record<string, any>, string][] = [];

    headScripts.push(["style", {}, styles]);
    headScripts.push(["script", {}, `(${initDiagramExtra.toString()})()`]);

    return {
      name: "plugin-extra-diagram",
      vite: [],
      head: headScripts,
      markdown: {
        remark: [exampleMermaidExtra],
      },
    };
  };
}

export function exampleMermaidExtra() {
  return (tree: any) => {
    visit(
      tree,
      (node: any) => {
        return node.type === "element" && node.tagName === "svg";
      },
      (node: any, index: number | undefined, parent: any) => {
        // Create a wrapper div
        const wrapper = {
          type: "element",
          tagName: "div",
          properties: {
            className: ["extra-diagram"],
          },
          children: [node],
          position: node.position,
        };

        // Replace the SVG node with the wrapper div in parent's children
        if (parent && typeof index === "number") {
          parent.children[index] = wrapper;
        }
      }
    );
  };
}
