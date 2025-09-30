import TurndownService, { Node } from "turndown";
import { u } from "unist-builder";
import { remark } from "remark";
import remarkStringify from "remark-stringify";
import remarkGfm from "remark-gfm";

export function turndownPluginXyd(turndownService: TurndownService) {
  return turndownService.use([
    rules.pre,
    rules.ignoreTablist,
    rules.ignoreSampleButtons,
    rules.ignoreMetaInfo,
    rules.atlasProps,
  ]);
}

export const rules = {
  /**
   * Handles xyd code blocks
   * 
   * @todo: in the future it should be inside atlas?  
   */
  pre: (turndownService: TurndownService) => {
    turndownService.addRule("xyd::pre", {
      filter: function (node: any, options: any): boolean {
        return (
          node.nodeName === "XYD-CODE-PRE" &&
          node.firstChild &&
          node.firstChild.nodeName === "PRE"
        );
      },

      replacement: function (content: string, node: any, options: any): string {
        const language = node.firstChild.getAttribute("data-lang") || "";
        const code = node.firstChild.textContent || "";

        const fenceChar = options.fence.charAt(0);
        let fenceSize = 3;
        const fenceInCodeRegex = new RegExp("^" + fenceChar + "{3,}", "gm");

        let match: RegExpExecArray | null;
        while ((match = fenceInCodeRegex.exec(code))) {
          if (match[0].length >= fenceSize) {
            fenceSize = match[0].length + 1;
          }
        }

        const fence = repeat(fenceChar, fenceSize);

        return (
          "\n\n" +
          fence +
          language +
          "\n" +
          code.replace(/\n$/, "") +
          "\n" +
          fence +
          "\n\n"
        );
      },
    });
  },

  /**
   * Handles tablist elements
   * Ignore tablist elements to prevent language tabs from being rendered as text
   * 
   * @todo: in the future it should be inside atlas?  
   */
  ignoreTablist: (turndownService: TurndownService) => {
    turndownService.addRule("ignoreTablist", {
      filter: function (node) {
        return (
          node.getAttribute &&
          (node.getAttribute("role") === "tablist" ||
            node.getAttribute("role") === "tab" ||
            node.getAttribute("part") === "languages-list" ||
            node.getAttribute("part") === "language-trigger")
        );
      },
      replacement: function () {
        return "";
      },
    });
  },

  /**
   * Handles sample buttons
   * Handle atlas-sample-buttons to format response examples properly
   * 
   * @todo: in the future it should be inside atlas?  
   */
  ignoreSampleButtons: (turndownService: TurndownService) => {
    turndownService.addRule("atlasSampleButtons", {
      filter: ["atlas-sample-buttons" as keyof HTMLElementTagNameMap],
      replacement: function (content, node) {
        return "";
      },
    });
  },

  /**
   * Handles meta info elements
   * Handle atlas-apiref-meta-info to format as markdown lists
   * 
   * @todo: in the future it should be inside atlas?  
   */
  ignoreMetaInfo: (turndownService: TurndownService) => {
    // Handle atlas-apiref-meta-info to format as markdown lists
    turndownService.addRule("atlasMetaInfo", {
      filter: ["atlas-apiref-meta-info" as keyof HTMLElementTagNameMap],
      replacement: function (content, node) {
        return ""; // Return empty - handled in atlasProps rule
      },
    });
  },

  /**
   * Handles atlas props elements
   * Handle atlas-apiref-prop into array format
   * 
   * @todo: in the future it should be inside atlas?  
   */
  atlasProps: (turndownService: TurndownService) => {
    turndownService.addRule("atlasProps", {
      filter: ["atlas-apiref-prop" as keyof HTMLElementTagNameMap],
      replacement: function (content, node: Node) {
        // Collect all property data into arrays for table generation
        const tableData: string[][] = [];

        function collectPropData(n: Node, parentName = "") {
          // Extract property name
          const propNameEl = n.querySelector("atlas-apiref-propname code");
          const propName = propNameEl
            ? propNameEl.textContent?.trim()
            : "(unknown)";
          const fullName = parentName ? `${parentName}.${propName}` : propName;

          // Extract type
          const propTypeEl = n.querySelector("atlas-apiref-proptype code");
          const propType = propTypeEl ? propTypeEl.textContent?.trim() : "";

          // Extract description and meta-info separately
          const descEl = n.querySelector("atlas-apiref-propdescription");
          let description = "";
          let metaInfo = "";

          if (descEl) {
            // Get direct text content (first text node)
            const directText = Array.from(descEl.childNodes)
              .filter((node) => node.nodeType === 3) // Text nodes only
              .map((node) => node.textContent?.trim())
              .filter((text) => text)
              .join(" ");

            description = directText;

            // Extract meta-info
            const metaInfoEl = descEl.querySelector("atlas-apiref-meta-info");
            if (metaInfoEl) {
              const metaChildren = Array.from(
                metaInfoEl.querySelectorAll("div")
              );
              const metaItems = metaChildren
                .map((child) => child.textContent?.trim())
                .filter((text) => text);
              if (metaItems.length > 0) {
                metaInfo = metaItems.join(", ");
              }
            }
          }

          // Extract meta info (required/optional)
          const metaEl = n.querySelector("atlas-apiref-propmeta");
          const requiredInfo = metaEl?.textContent?.trim() || "";

          // Combine notes
          const notes = [requiredInfo, metaInfo].filter(Boolean).join(", ");

          // Add this property row to table data
          tableData.push([
            fullName || "",
            propType || "",
            description || "",
            notes || "",
          ]);

          // Recursively collect nested props (inside div > ul)
          const nestedProps = n.querySelectorAll("div ul atlas-apiref-prop");
          nestedProps.forEach((child) => {
            collectPropData(child as Node, fullName);
          });
        }

        // Only generate table if this is the first property in the group
        if ("previousElementSibling" in node) {
          const prevSibling = node.previousElementSibling;
          if (!prevSibling || prevSibling.nodeName !== "ATLAS-APIREF-PROP") {
            // Collect all properties starting from this node
            collectPropData(node);

            // Also collect any following sibling properties
            if ("nextElementSibling" in node) {
              let nextSibling = node.nextElementSibling;

              while (
                nextSibling &&
                nextSibling.nodeName === "ATLAS-APIREF-PROP"
              ) {
                collectPropData(nextSibling as Node);
                nextSibling = nextSibling.nextElementSibling;
              }
            }

            // Create table using unist-builder
            const headers = ["Property", "Type", "Description", "Notes"];
            const tableAST = createTableAST(headers, tableData);

            // Convert to markdown string
            return tableASTToMarkdown(tableAST);
          }
        }

        // If not the first property, return empty string to avoid duplicate tables
        return "";
      },
    });
  },
};

function repeat(character: string, count: number): string {
  return Array(count + 1).join(character);
}

// Helper function to create table AST using unist-builder
function createTableAST(headers: string[], rows: string[][]) {
  return u("table", [
    // Table header
    u(
      "tableRow",
      headers.map((header) => u("tableCell", [u("text", header)]))
    ),
    // Table rows
    ...rows.map((row) =>
      u(
        "tableRow",
        row.map((cell) => u("tableCell", [u("text", cell)]))
      )
    ),
  ]);
}

// Helper function to convert table AST to markdown string using remark
function tableASTToMarkdown(tableAST: any) {
  const root = u("root", [tableAST]);
  return remark()
    .use(remarkGfm) // Add GitHub Flavored Markdown support for tables
    .use(remarkStringify)
    .stringify(root);
}
