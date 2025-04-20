import {remark} from "remark";
import remarkStringify from "remark-stringify";

import {Reference} from "../types";

import {definitions, examples, heading, root} from "./utils";

// TODO: any
export function compile(ast: any) {
    return remark()
        // .use(unlimitedHeadings)
        .use(remarkStringify, {
            bullet: '-',
            fences: true,
            listItemIndent: 'one',
            incrementListMarker: false,
            handlers: {
                heading(node) {
                    return `${"#".repeat(node.depth)} ${node.children[0].value}`;
                },
            },
        })
        .stringify(root(ast));
}

export function referenceAST(ref: Reference) {
    const md = []

    const mdHeading = heading(
        ref.title,
        ref.canonical,
        typeof ref.description === "string" ? ref.description : "",
        ref.category,
        ref.type,
        ref.context
    )

    md.push(
        mdHeading.title,
    )

    if (mdHeading?.description?.length) {
        md.push(...mdHeading.description)
    }

    md.push(
        mdHeading.canonical,
    )

    if (mdHeading.category) {
        md.push(mdHeading.category)
    }

    if (mdHeading.type) {
        md.push(mdHeading.type)
    }

    if (mdHeading?.context?.length) {
        md.push(...mdHeading.context)
    }

    const mdExamples = examples(ref.examples)
    const mdDefinitions = definitions(ref.definitions)
    md.push(...mdExamples, ...mdDefinitions)

    return md;
}
