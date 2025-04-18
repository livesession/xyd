import { fromMarkdown } from "mdast-util-from-markdown";
import {u} from "unist-builder";

import {
    ExampleRoot,
    Definition,
    ReferenceCategory,
    ReferenceContext,
    ReferenceType,
    DefinitionProperty
} from "../types";

// START_DEPTH_LEVEL is the start depth level for the markdown AST
// starts from 2 because 1 is reserved for the title
const START_DEPTH_LEVEL = 2

// TODO: fix any
export function root(ast: any) {
    return u('root', ast);
}

export function heading(
    title: string,
    canonical: string,
    description: string,
    refCategory?: ReferenceCategory,
    refType?: ReferenceType,
    refContext?: ReferenceContext
) {
    const uTitle = u(
        'heading',
        {depth: START_DEPTH_LEVEL},
        [u('text', `!!references ${title}`)]
    )

    const uCanonical = u(
        'heading',
        {depth: uTitle.depth + 1},
        [u('text', `!canonical ${canonical}`)]
    )

    let uDesc = [
        u(
            'heading',
            {depth: uTitle.depth + 1},
            [u('text', `!description`),]
        ),
        u('paragraph', [u('text', description)])
    ]

    let uRefCategory
    if (refCategory) {
        uRefCategory = u(
            'heading',
            {depth: uTitle.depth + 1},
            [u('text', `!category ${refCategory}`)]
        )
    }

    let uRefType
    if (refType) {
        uRefType = u(
            'heading',
            {depth: uTitle.depth + 1},
            [u('text', `!type ${refType}`)]
        )
    }

    let uContext = []

    if (refContext && Object.keys(refContext)) {
        uContext.push(u(
            'heading',
            {depth: uTitle.depth + 1},
            [
                u('text', `!context`),
            ]
        ))


        for (const [key, value] of Object.entries(refContext)) {
            if (typeof value === "object") {
                // TODO: support ```<lang> ??
                if (value.code) {
                    uContext.push(
                        u('heading', {depth: uContext[0].depth + 1}, [u('text', `!${key}`)])
                    );

                    uContext.push(
                        u('code', {lang: value.lang}, value.code)
                    );

                    continue;
                }
            }

            uContext.push(
                u('heading', {depth: uContext[0].depth + 1}, [u('text', `!${key} ${value.toString()}`)])
            );
        }
    }

    return {
        title: uTitle,
        canonical: uCanonical,
        description: uDesc,
        category: uRefCategory || null,
        type: uRefType || null,
        context: uContext || null
    }
}

export function examples(examples: ExampleRoot) {
    const md = []

    const uExampleRoot = u(
        'heading',
        {depth: START_DEPTH_LEVEL + 1},
        [u('text', `!examples`)]
    )
    md.push(uExampleRoot)

    examples.groups.forEach(group => {
        const uExampleGroups = u(
            'heading',
            {depth: uExampleRoot.depth + 1},
            [u('text', `!!groups`)]
        )
        md.push(uExampleGroups)

        const uGroupDescription = u(
            'heading',
            {depth: uExampleGroups.depth + 1},
            [u('text', `!description ${group.description}`)]
        )
        md.push(uGroupDescription)

        group.examples.forEach(example => {
            const uExamples = u(
                'heading',
                {depth: uExampleGroups.depth + 1},
                [u('text', `!!examples`)]
            )
            md.push(uExamples)

            const codeBlock = u(
                'heading',
                {depth: uExamples.depth + 1},
                [u('text', `!codeblock`)]
            )
            md.push(codeBlock)

            const codeBlockTitle = u(
                'heading',
                {depth: codeBlock.depth + 1},
                [u('text', `!title ${example.codeblock.title}`)]
            )
            md.push(codeBlockTitle)

            const tabs = u(
                'heading',
                {depth: codeBlock.depth + 1},
                [u('text', `!!tabs`)]
            )
            md.push(tabs)

            example.codeblock.tabs.forEach(tab => {
                const code = u('code', {
                    lang: tab.language,
                    meta: `!code ${tab.title}`
                }, tab.code);

                md.push(code)
            })

        })
    })

    return md
}

export function definitions(definitions: Definition[]) {
    const md: any[] = []

    definitions.forEach(definition => {
        const uDefinition = u(
            'heading',
            {depth: START_DEPTH_LEVEL + 1},
            [u('text', `!!definitions`)]
        )
        md.push(uDefinition)

        md.push(u(
            'heading',
            {depth: uDefinition.depth + 1},
            [u('text', `!title ${definition.title}`)]
        ))

        definition.properties.forEach(prop => {
            properties(
                uDefinition.depth + 1,
                {
                    name: prop.name,
                    type: prop.type,
                    description: prop.description,
                    context: prop.context,
                    properties: prop.properties  // TODO: fix ts
                },
                md,
            )
        })
    })

    return md
}

// TODO: any[]
export function properties(
    depth: number,
    props: DefinitionProperty,
    output: any[] = []
) {
    const paramName = props.name;

    const propTitle = `!!properties ${paramName}`; // TODO: check if `!!properties is enough`
    const uPropTitle = u('heading', {depth}, [u('text', propTitle)]);
    const uPropName = u('paragraph', {depth}, [u('text', `!name ${paramName}`)]);
    const uPropType = u('paragraph', {depth}, [u('text', `!type ${props.type}`)]);
    const markdownAst = fromMarkdown(props.description || '');
    const uPropDesc = u("paragraph", { depth }, markdownAst.children);
    const uContext = []

    if (props.context && Object.keys(props.context)) {
        uContext.push(u(
            'heading',
            {depth: depth + 1},
            [
                u('text', `!context`),
            ]
        ))

        for (const [key, value] of Object.entries(props.context)) {
            uContext.push(u(
                    'heading',
                    {depth: uContext[0].depth + 1},
                    [u('text', `!${key} ${value}`)]
                )
            )
        }
    }

    output.push(
        uPropTitle,
        uPropName,
        uPropType,
        uPropDesc,
        ...uContext
    );

    if (props.properties) {
        const deepDepth = depth + 1

        for (const prop of props.properties) {
            properties(deepDepth, prop, output)
        }
    }
}



