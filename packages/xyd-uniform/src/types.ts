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

export interface GraphQLReferenceContext {
}

// TODO: custom value?
export interface OpenAPIReferenceContext {
    method: string;

    path: string;
}

export type ReferenceContext = GraphQLReferenceContext | OpenAPIReferenceContext;

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

export interface GraphQLExampleContext {
    schema?: any; // TODO:
}

export interface OpenAPIExampleContext {
    status?: number;

    content?: string;
}

export type ExampleContext = GraphQLExampleContext | OpenAPIExampleContext;

export interface CodeBlockTab {
    // title of the tab e.g "JavaScript"
    title: string;

    // code in the tab e.g "console.log('Hello World')"
    code: string
    
    // language of the code e.g "js"
    language: string;

    // context of the generation method e.g openapi or graphql
    context?: ExampleContext;
}

export interface Reference {
    title: string;
    description: string;
    canonical: string;

    definitions: Definition[]
    examples: ExampleRoot

    category?: ReferenceCategory; // TODO: do we need that?
    type?: ReferenceType; // TODO: do we need that?
    context?: ReferenceContext;
}

export interface Definition {
    title: string;

    properties: DefinitionProperty[];


    type?: string;

    id?: string;

    description?: string;
}

export interface DefinitionProperty {
    name: string;

    type: string;

    description: string;

    context?: any // TODO: better type

    properties?: DefinitionProperty[];
}