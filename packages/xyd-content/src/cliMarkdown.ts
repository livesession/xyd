import * as path from "node:path";

import type { Settings } from "@xyd-js/core";
import { loadOpencliSpec, opencliToReferences } from "@xyd-js/opencli";
import type { DefinitionProperty, Reference } from "@xyd-js/uniform";

import { resolveCliFileOptions } from "./apiFileOptions";

// ---------------------------------------------------------------------------
// The markdown body of a generated CLI page's `.md` twin.
//
// A generated command page is a virtual markdown file that holds only its
// frontmatter (`cli: <source>#<command path>`): the page renders the command
// from the CLI document. Its raw `.md` route — the file `llms.txt` links to and
// a copy-page action fetches — is that same file, so without a body it carried
// none of what the page shows. These helpers convert the command the same way
// the page does (the same document, region and options) and write it out as
// markdown: the title, the description, the usage, every section (Arguments,
// Options, Inherited options, Commands, Global options, Interactive commands,
// Keys, Environment, Exit codes) and the code samples.
// ---------------------------------------------------------------------------

/** One parsed OpenCLI document per source, shared by the pages of one pass. */
export type CliSpecCache = Map<string, Promise<unknown>>;

export interface CliPageMarkdownOptions {
    /** The docs root that a `~/` source is relative to (the working directory by default). */
    cwd?: string;
    /** The directory of the page, which a relative source is relative to (the docs root by default). */
    pageDir?: string;
    /** Documents already loaded in this pass, by resolved source. */
    cache?: CliSpecCache;
}

/**
 * The markdown of the command a generated page names in its frontmatter
 * (`cli: ~/acme.opencli.json#remote add`): the references the page renders,
 * as markdown. Empty when the value names no command of the document.
 */
export async function cliPageMarkdown(
    cliValue: string,
    settings?: Settings,
    options: CliPageMarkdownOptions = {},
): Promise<string> {
    const cwd = options.cwd || process.cwd();
    const { source, region } = splitCliValue(cliValue);
    if (!source || !region) {
        return "";
    }

    const resolved = resolveCliSource(source, cwd, options.pageDir || cwd);

    let load = options.cache?.get(resolved);
    if (!load) {
        load = loadOpencliSpec(resolved);
        options.cache?.set(resolved, load);
    }
    const spec = await load;

    const cliOptions = resolveCliFileOptions(settings?.api?.cli, resolved);
    const references = opencliToReferences(spec as any, {
        regions: [region],
        globalOptionsPerCommand: cliOptions?.globalOptionsPerCommand ?? false,
    }) as unknown as Reference[];

    return cliReferencesMarkdown(references);
}

/** `<source>#<command path>` → its two parts; a URL keeps its own `#` only before the last one. */
function splitCliValue(value: string): { source: string; region: string } {
    const v = (value || "").trim();
    const hash = v.lastIndexOf("#");
    if (hash === -1) {
        return { source: v, region: "" };
    }

    return { source: v.slice(0, hash), region: v.slice(hash + 1).trim() };
}

/** A page's source as a path or URL: `~/` is the docs root, a relative path is the page's. */
function resolveCliSource(source: string, cwd: string, pageDir: string): string {
    if (source.startsWith("http://") || source.startsWith("https://")) {
        return source;
    }
    if (source.startsWith("~/")) {
        return path.join(cwd, source.slice(2));
    }

    return path.resolve(pageDir, source);
}

/** Every reference as markdown, one after another. */
export function cliReferencesMarkdown(references: Reference[]): string {
    return (references || [])
        .map(cliReferenceMarkdown)
        .filter(Boolean)
        .join("\n");
}

/**
 * One CLI reference as markdown: `# title`, the description, the usage as a
 * shell block, a `##` section per definition (its rows as a list, nested rows
 * indented) and the code samples, each group under its description.
 */
export function cliReferenceMarkdown(reference: Reference): string {
    if (!reference) {
        return "";
    }

    const out: string[] = [];
    out.push(`# ${headingText(reference.title || "")}`);

    const description = text(reference.description);
    if (description) {
        out.push(description);
    }

    const usage = (reference.context as { fullPath?: string } | undefined)?.fullPath;
    if (usage) {
        out.push(fence(usage, "shell"));
    }

    for (const definition of reference.definitions || []) {
        const rows = definition.properties || [];
        if (!definition.title || !rows.length) {
            continue;
        }
        out.push(`## ${headingText(definition.title)}`);
        const definitionDescription = text(definition.description);
        if (definitionDescription) {
            out.push(definitionDescription);
        }
        out.push(propertyList(rows, 0));
    }

    let lastHeading = "";
    for (const group of reference.examples?.groups || []) {
        const blocks: string[] = [];
        for (const example of group.examples || []) {
            for (const tab of example.codeblock?.tabs || []) {
                const code = String(tab.code ?? "");
                if (code.trim()) {
                    blocks.push(fence(code, String(tab.language || "")));
                }
            }
        }
        if (!blocks.length) {
            continue;
        }

        // The runnable invocation has no description: it opens the samples.
        const heading = group.description || "Examples";
        if (heading !== lastHeading) {
            out.push(`## ${headingText(heading)}`);
            lastHeading = heading;
        }
        out.push(...blocks);
    }

    return out.join("\n\n") + "\n";
}

/** The rows of a section as a list: `` - `name` (type, required): description ``. */
function propertyList(rows: DefinitionProperty[], depth: number): string {
    const indent = "  ".repeat(depth);

    return rows
        .filter((row) => !hasMeta(row, "internal", "true"))
        .map((row) => {
            const flags: string[] = [];
            const type = typeof row.type === "string" && !row.type.startsWith("$$") ? row.type : "";
            if (type) {
                flags.push(type);
            }
            if (hasMeta(row, "required", "true")) {
                flags.push("required");
            }
            if (hasMeta(row, "deprecated", "true")) {
                flags.push("deprecated");
            }
            const defaults = metaValue(row, "defaults");
            if (defaults !== undefined && defaults !== "") {
                flags.push(`default: ${inlineCode(String(defaults))}`);
            }

            let line = `${indent}- ${row.name ? inlineCode(row.name) : ""}`;
            if (flags.length) {
                line += ` (${flags.join(", ")})`;
            }

            const parts: string[] = [];
            const description = text(row.description);
            if (description) {
                parts.push(description);
            }
            const examples = exampleValues(row);
            if (examples.length) {
                parts.push(`Examples: ${examples.map(inlineCode).join(", ")}.`);
            }
            if (parts.length) {
                // continuation lines stay inside the list item
                line += `: ${parts.join(" ").replace(/\n/g, `\n${indent}  `)}`;
            }

            const children = row.properties || [];
            if (children.length) {
                line += `\n${propertyList(children, depth + 1)}`;
            }

            return line;
        })
        .join("\n");
}

function exampleValues(row: DefinitionProperty): string[] {
    const values: unknown[] = [];
    const example = metaValue(row, "example");
    if (example !== undefined && example !== "") {
        values.push(example);
    }
    const examples = metaValue(row, "examples");
    if (Array.isArray(examples)) {
        values.push(...examples);
    } else if (examples !== undefined && examples !== "") {
        values.push(examples);
    }

    return values.map((v) => String(v));
}

function metaValue(row: DefinitionProperty, name: string): unknown {
    return row.meta?.find((m) => m.name === name)?.value;
}

function hasMeta(row: DefinitionProperty, name: string, value: string): boolean {
    return !!row.meta?.some((m) => m.name === name && String(m.value) === value);
}

/** A description as text: a string as is; anything else (a React node) is left out. */
function text(value: unknown): string {
    return typeof value === "string" ? value.trim() : "";
}

/** A title in a heading: `<command>` and `[command]` stay literal text. */
function headingText(value: string): string {
    return value.replace(/[\\<>[\]*_`]/g, (c) => `\\${c}`);
}

/** Inline code that holds any run of backticks. */
function inlineCode(value: string): string {
    const runs: string[] = value.match(/`+/g) || [];
    const fenceLength = Math.max(0, ...runs.map((run) => run.length)) + 1;
    const ticks = "`".repeat(fenceLength);
    const pad = value.startsWith("`") || value.endsWith("`") ? " " : "";

    return `${ticks}${pad}${value}${pad}${ticks}`;
}

/** A fenced code block longer than any backtick run inside it. */
function fence(code: string, language: string): string {
    const runs: string[] = code.match(/`{3,}/g) || [];
    const fenceLength = Math.max(3, ...runs.map((run) => run.length + 1));
    const ticks = "`".repeat(fenceLength);

    return `${ticks}${language}\n${code.replace(/\n+$/, "")}\n${ticks}`;
}
