import path from "path";
import fs from "fs/promises";

import yaml from "js-yaml";
import {OpenAPIV3} from "openapi-types";
import GithubSlugger from 'github-slugger';
import $refParser, {ParserOptions} from "@apidevtools/json-schema-ref-parser";

import {ReferenceType} from "@xyd-js/uniform";

export function slug(str: string): string {
    const slugger = new GithubSlugger();
    return slugger.slug(str);
}

// deferencedOpenAPI reads an OpenAPI spec file and returns a dereferenced OpenAPIV3.Document
// dereferenced means that all $ref references are resolved automatically
export async function deferencedOpenAPI(openApiPath: string) {
    const openApiSpec = await readOpenApiSpec(openApiPath);
    if (!openApiSpec) {
        return
    }

    const cwd = process.cwd();

    const remoteOasPath = openApiPath.startsWith('http://') || openApiPath.startsWith('https://') ? true : false

    const circularRefs: Set<string> = new Set();

    const options: ParserOptions = {
        dereference: {
            onCircular(defPath: string) {
                const v = `#${defPath.split('#')[1]}`
                circularRefs.add(v);
            },
            // circular: true, // ignore circular references,
            // onCi
            onDereference(defPath: any, value: any, parent: any) {
                if (circularRefs.has(defPath) || circularRefs.has(path.join(defPath, "properties"))) {
                    value.__UNSAFE_circular = true; // TODO: BETTER WAY TO MARK CIRCULAR REFS
                }
                if (value && typeof value === 'object') {
                    value.__UNSAFE_refPath = () => defPath
                }
                if (parent && typeof parent === 'object') {
                    parent.__UNSAFE_refPath = () => defPath
                }
            }
        }
    } as ParserOptions;

    if (remoteOasPath) {
        if (!options.resolve) {
            options.resolve = {}
        }

        options.resolve.file = {
            read: async (file: any) => {
                // 1) Convert absolute local path back into a repo-relative path:
                //    "/Users/.../docs/foo.md" → "docs/foo.md"
                let rel = path.relative(cwd, file.url);
                rel = rel.split(path.sep).join('/');

                // 2) Resolve against your GitHub raw URL:
                const absoluteUrl = new URL(rel, openApiPath).href;
                //    → "https://raw.githubusercontent.com/.../docs/foo.md"

                // 3) Fetch it:
                const res = await fetch(absoluteUrl);
                if (!res.ok) {
                    throw new Error(`Failed to fetch ${absoluteUrl}: ${res.status}`);
                }

                let content;
                if (file.extension === '.json' || file.extension === '.yaml' || file.extension === '.yml') {
                    // If the file is JSON or YAML, return the parsed content
                    if (file.extension === '.json') {
                        content = await res.json();
                    } else {
                        content = yaml.load(await res.text());
                    }
                } else {
                    content = await res.text();        // hand back the Markdown
                }

                return content;
            }
        }
    }

    await $refParser.dereference(openApiSpec, options);
    // await $refParser.bundle(openApiSpec, options);

    return openApiSpec as OpenAPIV3.Document
}

// readOpenApiSpec reads an OpenAPI spec file or URL and returns the content
async function readOpenApiSpec(filePath: string) {
    let content: string;
    let fromUrl = false
    if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Failed to fetch OpenAPI spec from URL: ${response.statusText}`);
        }
        content = await response.text();
        fromUrl = true
    } else {
        try {
            await fs.access(filePath);
        } catch (error) {
            console.log(`⚠️ "(openapi): ${filePath}" is defined in the docs.json navigation but the file does not exist.`)
            return
        }
        content = await fs.readFile(filePath, 'utf-8');
    }

    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.yaml' || ext === '.yml') {
        return yaml.load(content);
    } else if (ext === '.json') {
        return JSON.parse(content);
    } else if (fromUrl && content.startsWith('{')) {
        try {
            return JSON.parse(content);
        } catch (error) {
            throw new Error(`Failed to parse JSON from URL: ${error}`);
        }
    } else {
        throw new Error('Unsupported file format. Use JSON or YAML.');
    }
}

// httpMethodToUniformMethod converts an HTTP method to a uniform ReferenceType
export function httpMethodToUniformMethod(method: string): ReferenceType | null {
    switch (method) {
        case 'get':
            return ReferenceType.REST_HTTP_GET
        case 'put':
            return ReferenceType.REST_HTTP_PUT
        case 'patch':
            return ReferenceType.REST_HTTP_PATCH
        case 'post':
            return ReferenceType.REST_HTTP_POST
        case 'delete':
            return ReferenceType.REST_HTTP_DELETE
        case 'options':
            return ReferenceType.REST_HTTP_OPTIONS
        case 'head':
            return ReferenceType.REST_HTTP_HEAD
        case 'trace':
            return ReferenceType.REST_HTTP_TRACE
        default:
            return null
    }
}

