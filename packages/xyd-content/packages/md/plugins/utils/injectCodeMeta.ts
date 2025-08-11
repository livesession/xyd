import { parseImportPath } from "../functions/utils";
import { mdParameters } from "./mdParameters";

/**
 * Injects code meta and props into a code node
 */
export function injectCodeMeta(node: any, metaString?: string) {
    const { filePath, regions, lineRanges } = parseImportPath(node.lang || "") || {};
    node.lang = filePath;
    node.data = node.data || {};
    node.data.regions = regions;
    node.data.lineRanges = lineRanges;

    const { attributes, sanitizedText: defaultMetaTitle } = mdParameters(metaString || node.meta || "", {
        htmlMd: true
    });
    node.meta = defaultMetaTitle;

    const props: { [prop: string]: any } = {
        regions: JSON.stringify(node.data.regions),
        lineRanges: JSON.stringify(node.data.lineRanges)
    };
    props.meta = node.lang || "";
    props.title = defaultMetaTitle;

    if (attributes && attributes.lines === "true") {
        props.lineNumbers = "true";
    }
    if (attributes && attributes.scroll === "false") {
        props.size = "full";
    }
    if (attributes && attributes.scroll === "true") {
        props.size = "";
    }
    if (attributes && attributes.descHead && attributes.descHead !== "false") {
        props.descriptionHead = attributes.descHead;
    }
    if (attributes && attributes.desc && attributes.desc !== "false") {
        props.descriptionContent = attributes.desc;
    }
    if (attributes && attributes.descIcon && attributes.descIcon !== "false") {
        props.descriptionIcon = attributes.descIcon;
    }
    if (attributes && attributes.meta && attributes.meta !== "false") {
        props.meta = attributes.meta;
    }
    if (attributes && attributes.title && attributes.title !== "false") {
        props.title = attributes.title;
    }
    if (attributes?.title === "false") {
        props.title = "";
    }

    node.data.hProperties = {
        ...(node.data.hProperties || {}),
        ...props
    };
}

