export interface JsonSchemaObject {
    type?: string | string[];
    description?: string;
    properties?: Record<string, JsonSchemaObject>;
    required?: string[];
    items?: JsonSchemaObject;
    enum?: unknown[];
    default?: unknown;
    nullable?: boolean;
    format?: string;
    [key: string]: unknown;
}

export interface McpTool {
    name: string;
    description?: string;
    inputSchema?: JsonSchemaObject;
}

export interface McpResource {
    uri: string;
    name?: string;
    description?: string;
    mimeType?: string;
}

export interface JsonRpcResponse<T> {
    jsonrpc: "2.0";
    id: number | string;
    result?: T;
    error?: { code: number; message: string; data?: unknown };
}
