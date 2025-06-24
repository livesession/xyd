import { visit } from "unist-util-visit";
import { parseImportPath } from "./functions/utils";
import { mdParameters } from "./utils/mdParameters";

/**
 * This plugin injects the code meta into the code node's data
 * so that it can be used in the code block component
 */
export function remarkInjectCodeMeta() {
    return (tree: any) => {
        console.time('plugin:remarkInjectCodeMeta');
        visit(tree, 'code', (node) => {
            const { filePath, regions, lineRanges } = parseImportPath(node.lang || "") || {}
            node.lang = filePath
            node.data = node.data || {}
            node.data.regions = regions
            node.data.lineRanges = lineRanges

            const { attributes, sanitizedText } = mdParameters(node.meta || "", {
                htmlMd: true
            });

            const props: { [prop: string]: any } = {
                regions: JSON.stringify(node.data.regions),
                lineRanges: JSON.stringify(node.data.lineRanges)
            }

            let meta = ""
            if (attributes && attributes.lines === "true") {
                props.lineNumbers = true
            }
            if (attributes && attributes.scroll === "false") {
                props.size = "full"
            }
            if (attributes && attributes.scroll === "true") {
                props.size = ""
            }
            if (attributes && attributes.descHead && attributes.descHead !== "false") {
                props.descriptionHead = attributes.descHead
            }
            if (attributes && attributes.desc && attributes.desc !== "false") {
                props.descriptionContent = attributes.desc
            }
            if (attributes && attributes.descIcon && attributes.descIcon !== "false") {
                props.descriptionIcon = attributes.descIcon
            }
            if (attributes && attributes.meta && attributes.meta !== "false") {
                meta = attributes.meta
                node.meta = meta
            }

            node.data.hProperties = {
                ...(node.data.hProperties || {}),
                ...props
            }

            meta = meta || sanitizedText
            if (meta) {
                node.data.hProperties = {
                    ...(node.data.hProperties || {}),
                    meta: meta
                };
            }
        });
        console.timeEnd('plugin:remarkInjectCodeMeta');
    };
}
