import React from "react";
import { HighlightedCode } from "codehike/code";

// TODO: type, and category also as generic?
export interface Reference<C = ReferenceContext> {
    title: string;
    description: string | React.ReactNode;
    canonical: string;

    definitions: Definition[]
    examples: ExampleRoot

    /**
     * @unsafe
     */
    category?: ReferenceCategory; // TODO: do we need that?
    /**
     * @unsafe
     */
    type?: ReferenceType; // TODO: do we need that?
    /**
     * @unsafe
     */
    context?: C;

    /**
     * TODO: !!!! BETTER !!!!
     * @unsafe
     */
    __UNSAFE_selector?: (selector: string) => any;
}

export type DefinitionOpenAPIMeta = Meta<"contentType">;

export type DefinitionMeta = DefinitionOpenAPIMeta

export interface Definition<V = any> {
    title: string;

    properties: DefinitionProperty[];

    variants?: DefinitionVariant<V>[];

    description?: string | React.ReactNode;

    meta?: DefinitionMeta[];

    /**
     * @unsafe
     */
    id?: string;

    /**
     * @unsafe
     */
    type?: string;
}

export interface DefinitionVariant<T = any> {
    title: string;

    properties: DefinitionProperty[];

    meta?: Meta<T>[];
}

export interface Meta<T = string> {
    name: T;

    value?: string;
}

export type DefinitionPropertyMeta = Meta<"required" | "deprecated" | "defaults" | "nullable" | "enum">

export interface DefinitionProperty {
    name: string;

    type: string;

    meta?: DefinitionPropertyMeta[];

    description: string | React.ReactNode;

    context?: any // TODO: better type

    properties?: DefinitionProperty[];
}

export interface ExampleRoot {
    groups: ExampleGroup[];
}

export interface ExampleGroup {
    description?: string;

    examples: Example[];
}

export interface Example {
    description?: string; // TODO: replace with title ?

    codeblock: CodeBlock;
}

export interface CodeBlock {
    title?: string;

    tabs: CodeBlockTab[];
}

export interface CodeBlockTab {
    // title of the tab e.g "JavaScript"
    title: string;

    // code in the tab e.g "console.log('Hello World')"
    code: string

    // language of the code e.g "js"
    language: string;

    // context of the generation method e.g openapi or graphql
    context?: ExampleContext;

    // TODO: highlighted code
    highlighted?: HighlightedCode;
}

export type ExampleContext = GraphQLExampleContext | OpenAPIExampleContext;

// TODO: concept only
export enum ReferenceCategory {
    // for React
    COMPONENTS = "components",
    HOOKS = "hooks",
    // end for React

    // for API
    REST = "rest",
    GRAPHQL = "graphql",
    // end for API

    // for code
    FUNCTIONS = "functions",
    //
}

// TODO: concept only
export enum ReferenceType {
    // for React
    COMPONENT = "component",
    HOOK = "hook",
    // end for React

    // for API
    REST_HTTP_GET = "rest_get",
    REST_HTTP_POST = "rest_post",
    REST_HTTP_PUT = "rest_put",
    REST_HTTP_PATCH = "rest_patch",
    REST_HTTP_DELETE = "rest_delete",
    // ---
    GRAPHQL_QUERY = "graphql_query",
    GRAPHQL_MUTATION = "graphql_mutation",
    // end for API

    // for code
    FUNCTION_JS = "function_js",
    // end for code
}

export interface BaseReferenceContext {
    group?: string[];
 
    scopes?: string[];
}

export interface GraphQLReferenceContext extends BaseReferenceContext {
    graphqlTypeShort: string;
    graphqlName: string;
}

// TODO: custom value?
export interface OpenAPIReferenceContext extends BaseReferenceContext {
    method: string;
    path: string;
    fullPath: string;
}

// Add TypeDocReferenceContext to the union type
export interface TypeDocReferenceContext extends BaseReferenceContext {
    packageName: string;
    fileName: string;
    fileFullPath: string;
    line: number;
    col: number;
    signatureText: {
        code: string;
        lang: string;
    };
    sourcecode: {
        code: string;
        lang: string;
    };
}

export type ReferenceContext = GraphQLReferenceContext | OpenAPIReferenceContext | TypeDocReferenceContext

export interface GraphQLExampleContext {
    schema?: any; // TODO:
}

export interface OpenAPIExampleContext {
    status?: number;

    content?: string;
}


