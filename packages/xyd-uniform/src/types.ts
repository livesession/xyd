import React from "react";
import {HighlightedCode} from "codehike/code";

// TODO: type, and category also as generic?
export interface Reference<
    C = ReferenceContext,
    M extends DefinitionMeta = DefinitionMeta,
    VM extends DefinitionVariantMeta = DefinitionVariantMeta
> {
    title: string;
    description: string | React.ReactNode;
    canonical: string;

    definitions: Definition<M, VM>[] // TODO: in the future from generic?
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

export type DefinitionOpenAPIMeta = Meta<"contentType" | "required">;
export type DefinitionTypeDocMeta = Meta<"type">;
export type DefinitionGraphqlMeta = Meta<"type" | "graphqlName">;

export type DefinitionMeta = DefinitionOpenAPIMeta | DefinitionTypeDocMeta | DefinitionGraphqlMeta

export type SymbolDef = {
    id?: string | string[];

    canonical?: string | string[];
}

export interface Definition<
    M extends DefinitionMeta = DefinitionMeta,
    VM extends DefinitionVariantMeta = DefinitionVariantMeta
> {
    title: string;

    properties: DefinitionProperty[];

    rootProperty?: DefinitionProperty

    variants?: DefinitionVariant<VM>[];

    description?: string | React.ReactNode;

    meta?: M[];

    /**
     * @unsafe
     */
    symbolDef?: SymbolDef;

    /**
     * @unsafe
     */
    id?: string;

    /**
     * @unsafe
     */
    type?: string;
}

export type DefinitionVariantOpenAPIMeta = Meta<"status" | "contentType">;
export type CommonDefinitionVariantMeta = Meta<"symbolName">;

export type DefinitionVariantMeta = CommonDefinitionVariantMeta | DefinitionVariantOpenAPIMeta

export interface DefinitionVariant<
    M extends DefinitionVariantMeta = DefinitionVariantMeta
> {
    title: string;

    properties: DefinitionProperty[];

    rootProperty?: DefinitionProperty

    description?: string | React.ReactNode;

    symbolDef?: SymbolDef;

    meta?: M[];
}

export interface Meta<T = string> {
    name: T;

    value?: unknown; // TODO: better type?
}

export type DefinitionPropertyMeta = Meta<"required" | "deprecated" | "internal" | "defaults" | "nullable" | "enum-type"> // TODO: better solution than enum-type?

export enum DEFINED_DEFINITION_PROPERTY_TYPE {
    UNION = "$$union",

    XOR = "$$xor",

    ARRAY = "$$array",

    ENUM = "$$enum",
}

export interface DefinitionProperty {
    name: string;

    type: string | DEFINED_DEFINITION_PROPERTY_TYPE

    description: string | React.ReactNode;

    // TODO: in the future more advanced examples?
    examples?: string | string[];

    symbolDef?: SymbolDef;

    meta?: DefinitionPropertyMeta[];

    context?: any // TODO: better type

    properties?: DefinitionProperty[];

    rootProperty?: DefinitionProperty;
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
    // TODO: better type system for specific api typesl like gql or rest
    REST_HTTP_GET = "rest_get",
    REST_HTTP_POST = "rest_post",
    REST_HTTP_PUT = "rest_put",
    REST_HTTP_PATCH = "rest_patch",
    REST_HTTP_DELETE = "rest_delete",
    REST_HTTP_OPTIONS = "rest_options",
    REST_HTTP_HEAD = "rest_head",
    REST_HTTP_TRACE = "rest_trace",

    REST_COMPONENT_SCHEMA = "rest_component_schema",
    // ---
    GRAPHQL_QUERY = "graphql_query",
    GRAPHQL_MUTATION = "graphql_mutation",
    GRAPHQL_SUBSCRIPTION = "graphql_subscription",

    GRAPHQL_SCALAR = "graphql_scalar",
    GRAPHQL_OBJECT = "graphql_object",
    GRAPHQL_INTERFACE = "graphql_interface",
    GRAPHQL_UNION = "graphql_union",
    GRAPHQL_ENUM = "graphql_enum",
    GRAPHQL_INPUT = "graphql_input",
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
    /**
     * @unsafe
     */
    graphqlTypeShort: string;

    graphqlName: string;
}

// TODO: custom value?
export interface OpenAPIReferenceContext extends BaseReferenceContext {
    method?: string;

    path?: string;

    fullPath?: string;

    componentSchema?: string
}

export type TypeDocReferenceContextMeta = Meta<"internal">

// Add TypeDocReferenceContext to the union type
export interface TypeDocReferenceContext extends BaseReferenceContext {
    symbolId: string;
    symbolName: string;
    symbolKind: number;
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
    category?: string;
    meta?: TypeDocReferenceContextMeta[]
}

export type ReferenceContext = GraphQLReferenceContext | OpenAPIReferenceContext | TypeDocReferenceContext

export interface GraphQLExampleContext {
    schema?: any; // TODO:
}

export interface OpenAPIExampleContext {
    status?: number;

    content?: string;
}


