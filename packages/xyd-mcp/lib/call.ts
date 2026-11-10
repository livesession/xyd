import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import type { CallToolResult, ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/types.js";
import type { McpTool } from "@xyd-js/uniform";

import { jsonSchemaValidator } from "./schema";

/** What the SDK hands a tool callback beside its arguments. */
export type McpToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;

/** The bearer for one call. */
export type McpTokenResolver = (
    extra: McpToolExtra | undefined
) => string | undefined | null | Promise<string | undefined | null>;

/** A link to a resource that documents the tool, answered beside its result. */
export interface McpToolResourceLink {
    uri: string;
    name?: string;
    title?: string;
    description?: string;
    mimeType?: string;
}

/** How a tool call reaches the API. */
export interface McpToolCallOptions {
    /**
     * The bearer sent as `Authorization: Bearer <token>`. A non-empty string is
     * sent on every call (a local, single-user server); a function is asked per
     * call. Default: the bearer of the request that carried the call
     * (`extra.authInfo.token`, which the HTTP transport takes from that
     * request's `Authorization` header). No token, no `Authorization` header.
     */
    token?: string | McpTokenResolver;
    /**
     * The API base URL, joined with each operation's path. Default: the
     * document's first server (the tool's `binding.fullPath`).
     */
    baseUrl?: string;
    /**
     * Extra request headers (e.g. an API version header), fixed or per call.
     * They are set over the defaults (`Accept: application/json`, and
     * `Content-Type: application/json` with a body), case-insensitively, so
     * an `Accept` or `Content-Type` given here wins; an undefined or null
     * value is left out. The resolved bearer is set last.
     */
    headers?: McpToolHeaders | ((tool: McpTool, extra: McpToolExtra | undefined) => McpToolHeaders | undefined);
    /** The answer is cut after this many bytes, with a marker saying so (default 262144). */
    maxBytes?: number;
    /** Bytes of an error response's body quoted in the error (default 8192). */
    errorBytes?: number;
    /** The request is abandoned after this many milliseconds (default 30000). */
    timeoutMs?: number;
    /** An array query parameter as `a=1&a=2` (`"repeat"`, default) or `a=1,2` (`"comma"`). */
    queryArrays?: "repeat" | "comma";
    /** Validate the arguments against the tool's input schema (default true). */
    validate?: boolean;
    /** A `resource_link` answered beside each result (e.g. the operation's reference page). */
    resourceLink?: (tool: McpTool) => McpToolResourceLink | undefined;
    /** The fetch implementation (default the global `fetch`). */
    fetch?: typeof fetch;
}

/** Header values; an undefined or null one is not sent. */
export type McpToolHeaders = Record<string, string | undefined | null>;

export const DEFAULT_MAX_BYTES = 262144;
export const DEFAULT_ERROR_BYTES = 8192;
export const DEFAULT_TIMEOUT_MS = 30000;

/** The HTTP request a tool call stands for. */
export interface McpToolRequest {
    method: string;
    url: string;
    /** Headers the arguments carry (the grouped layout's `headers` / `cookies`). */
    headers: Record<string, string>;
    /** The JSON request body, serialized. */
    body?: string;
}

const GROUPS = new Set(["pathParams", "queryParams", "headers", "cookies", "requestBody"]);

/**
 * Calls the operation behind `tool` with `args` and answers its response body
 * as one text block: cut at `maxBytes` with a marker, `isError` with the status
 * and the first `errorBytes` of the body on a non-2xx answer. Invalid arguments,
 * an unreachable API and a timeout are tool errors too; none names the token.
 */
export async function callMcpUniformTool(
    tool: McpTool,
    args: Record<string, unknown> | undefined,
    options: McpToolCallOptions & { extra?: McpToolExtra } = {}
): Promise<CallToolResult> {
    const input: Record<string, unknown> = { ...(args || {}) };
    clampLimits(tool, input);

    if (options.validate !== false) {
        const checked = jsonSchemaValidator(tool.inputSchema)(input);
        if (!checked.valid) {
            return toolError(`${tool.name}: invalid arguments: ${checked.errorMessage}`);
        }
    }

    let request: McpToolRequest;
    try {
        request = buildMcpToolRequest(tool, input, options);
    } catch (error) {
        return toolError(`${tool.name}: ${errorMessage(error)}`);
    }

    // Defaults first, then the arguments' header parameters, then the caller's
    // headers (case-insensitive, so they win), then the bearer.
    const headers = new Headers({ Accept: "application/json" });
    if (request.body !== undefined) {
        headers.set("Content-Type", "application/json");
    }
    try {
        for (const [name, value] of Object.entries(request.headers)) {
            headers.set(name, value);
        }
        const extraHeaders =
            typeof options.headers === "function" ? options.headers(tool, options.extra) : options.headers;
        for (const [name, value] of Object.entries(extraHeaders || {})) {
            if (value !== undefined && value !== null) {
                headers.set(name, String(value));
            }
        }
    } catch {
        return toolError(`${tool.name}: the request headers could not be built`);
    }
    let token: string | undefined;
    try {
        token = await resolveToken(options.token, options.extra);
    } catch {
        // The resolver's message may carry what it was resolving from; it stays out of the answer.
        return toolError(`${tool.name}: the credentials for the call could not be resolved`);
    }
    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    const timeoutMs = positive(options.timeoutMs, DEFAULT_TIMEOUT_MS);
    const timeout = AbortSignal.timeout(timeoutMs);
    const cancel = options.extra?.signal;
    const signal = cancel && typeof AbortSignal.any === "function" ? AbortSignal.any([timeout, cancel]) : timeout;

    let response: Response;
    try {
        response = await (options.fetch || fetch)(request.url, {
            method: request.method,
            headers,
            body: request.body,
            signal,
        });
    } catch (error) {
        return toolError(`${tool.name}: the request failed: ${failure(error, cancel, timeout, timeoutMs)}`);
    }

    const status = `HTTP ${response.status}${response.statusText ? ` ${response.statusText}` : ""}`;
    let answer: Awaited<ReturnType<typeof readBody>>;
    try {
        answer = await readBody(
            response,
            response.ok ? positive(options.maxBytes, DEFAULT_MAX_BYTES) : positive(options.errorBytes, DEFAULT_ERROR_BYTES)
        );
    } catch (error) {
        return toolError(
            `${tool.name}: ${status}, but the body could not be read: ${failure(error, cancel, timeout, timeoutMs)}`
        );
    }

    if (!response.ok) {
        const body = answer.text ? `\n${answer.text}${answer.truncated ? "\n[…]" : ""}` : "";
        return toolError(`${tool.name}: ${status}${body}`);
    }

    let text = answer.text || status;
    if (answer.truncated) {
        text += `\n[truncated: ${answer.kept} of ${answer.total} bytes shown; narrow the request (filters, a smaller limit, the next page) to see the rest]`;
    }

    const result: CallToolResult = { content: [{ type: "text", text }] };
    const link = options.resourceLink?.(tool);
    if (link) {
        result.content.push({ type: "resource_link", ...link, name: link.name || tool.name });
    }
    return result;
}

/**
 * The HTTP request a call of `tool` with `args` stands for: the path filled from
 * the path parameters (each one plain segment, percent-encoded), the query
 * string from the query parameters, and the JSON body (`binding.bodyProperty`'s
 * argument, or, in the flat layout, every argument that is not a parameter).
 * An input the flat layout renamed (`binding.inputs`, e.g. `id_query`) goes out
 * under its own name (`id`). Throws on a missing path parameter or a path
 * parameter that is not one plain segment.
 */
export function buildMcpToolRequest(
    tool: McpTool,
    args: Record<string, unknown>,
    options: Pick<McpToolCallOptions, "baseUrl" | "queryArrays"> = {}
): McpToolRequest {
    const { binding } = tool;
    const grouped = layoutOf(tool) === "grouped";
    const wire = (input: string) => binding.inputs?.[input]?.name ?? input;
    const argument = (name: string, group: "pathParams" | "queryParams") => {
        if (!grouped) {
            return args[name];
        }
        const values = args[group];
        return values && typeof values === "object" ? (values as Record<string, unknown>)[name] : undefined;
    };

    const template = options.baseUrl ? joinUrl(options.baseUrl, binding.path) : binding.fullPath;
    if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(template)) {
        throw new Error(`no API base URL for ${binding.method} ${binding.path}: the document names no server; set baseUrl`);
    }

    const pathInputs = new Map(binding.pathParams.map((input) => [wire(input), input]));
    const filled = template.replace(/\{([^}]+)\}/g, (_, name: string) => {
        const value = argument(pathInputs.get(name) ?? name, "pathParams");
        if (value === undefined || value === null || value === "") {
            throw new Error(`missing path parameter \`${name}\``);
        }
        const segment = String(value);
        if (!isPlainSegment(segment)) {
            throw new Error(`path parameter \`${name}\` must be one plain path segment`);
        }
        return encodeURIComponent(segment);
    });

    const url = new URL(filled);
    for (const input of binding.queryParams) {
        const value = argument(input, "queryParams");
        if (value === undefined || value === null) {
            continue;
        }
        const name = wire(input);
        if (Array.isArray(value)) {
            const items = value.filter((item) => item !== undefined && item !== null);
            if (options.queryArrays === "comma") {
                if (items.length) {
                    url.searchParams.append(name, items.map(queryValue).join(","));
                }
            } else {
                for (const item of items) {
                    url.searchParams.append(name, queryValue(item));
                }
            }
        } else {
            url.searchParams.append(name, queryValue(value));
        }
    }

    const headers: Record<string, string> = {};
    if (grouped) {
        for (const [name, value] of Object.entries(objectArg(args.headers))) {
            if (value !== undefined && value !== null) {
                headers[name] = queryValue(value);
            }
        }
        const cookies = Object.entries(objectArg(args.cookies))
            .filter(([, value]) => value !== undefined && value !== null)
            .map(([name, value]) => `${name}=${encodeURIComponent(queryValue(value))}`);
        if (cookies.length) {
            headers.Cookie = cookies.join("; ");
        }
    }

    let body: string | undefined;
    if (binding.body === "json") {
        if (binding.bodyProperty) {
            const value = args[binding.bodyProperty];
            body = value === undefined ? undefined : JSON.stringify(value);
        } else {
            const parameters = new Set([...binding.pathParams, ...binding.queryParams]);
            const fields = Object.fromEntries(
                Object.entries(args)
                    .filter(([input, value]) => !parameters.has(input) && value !== undefined)
                    .map(([input, value]) => [wire(input), value])
            );
            body = JSON.stringify(fields);
        }
    }

    return { method: binding.method, url: url.toString(), headers, body };
}

/**
 * The tool's input layout: `binding.layout` when the tool carries it. A tool
 * generated without it is grouped only when its input has that shape: every
 * top-level property a group (`pathParams`, `queryParams`, `headers`,
 * `cookies`, `requestBody`), the body (if any) under `requestBody`, and every
 * path and query input inside its group's object. Property names alone do not
 * decide it — a flat body may have a field called `headers`, a flat or grouped
 * tool a parameter called `queryParams`.
 */
export function layoutOf(tool: McpTool): "flat" | "grouped" {
    const declared = (tool.binding as { layout?: unknown }).layout;
    if (declared === "flat" || declared === "grouped") {
        return declared;
    }
    const { binding } = tool;
    const properties = (tool.inputSchema.properties || {}) as Record<string, { properties?: Record<string, unknown> }>;
    const names = Object.keys(properties);
    if (!names.length || !names.every((name) => GROUPS.has(name))) {
        return "flat";
    }
    if (binding.body === "json" && binding.bodyProperty !== "requestBody") {
        return "flat";
    }
    const inGroup = (group: string, inputs: string[]) => {
        const members = properties[group]?.properties;
        return inputs.every((input) => !!members && Object.prototype.hasOwnProperty.call(members, input));
    };
    return inGroup("pathParams", binding.pathParams) && inGroup("queryParams", binding.queryParams) ? "grouped" : "flat";
}

/**
 * Clamps an integer `limit` argument into the bounds its schema declares (a
 * server's cap): at the top level in the flat layout, inside `queryParams`,
 * `pathParams` and `requestBody` in the grouped one.
 */
function clampLimits(tool: McpTool, args: Record<string, unknown>) {
    const properties = (tool.inputSchema.properties || {}) as Record<string, { properties?: Record<string, unknown> }>;
    if (layoutOf(tool) === "flat") {
        clampLimit(properties, args);
        return;
    }
    for (const group of ["queryParams", "pathParams", "requestBody"]) {
        const values = args[group];
        const schema = properties[group]?.properties;
        if (schema && values && typeof values === "object" && !Array.isArray(values)) {
            const copy = { ...(values as Record<string, unknown>) };
            clampLimit(schema, copy);
            args[group] = copy;
        }
    }
}

function clampLimit(properties: Record<string, unknown>, args: Record<string, unknown>) {
    const schema = properties.limit as { maximum?: unknown; minimum?: unknown } | undefined;
    const value = args.limit;
    if (!schema || typeof value !== "number" || !Number.isFinite(value)) {
        return;
    }
    let limit = value;
    if (typeof schema.maximum === "number" && limit > schema.maximum) {
        limit = schema.maximum;
    }
    if (typeof schema.minimum === "number" && limit < schema.minimum) {
        limit = schema.minimum;
    }
    args.limit = limit;
}

/** Not empty, not `.` or `..`, no control characters (a `/` is percent-encoded). */
function isPlainSegment(segment: string): boolean {
    // biome-ignore lint/suspicious/noControlCharactersInRegex: control characters are what it refuses
    return segment !== "." && segment !== ".." && !/[\u0000-\u001f\u007f]/.test(segment);
}

function joinUrl(base: string, path: string): string {
    return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

function queryValue(value: unknown): string {
    return typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
}

function objectArg(value: unknown): Record<string, unknown> {
    return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

async function resolveToken(
    token: McpToolCallOptions["token"],
    extra: McpToolExtra | undefined
): Promise<string | undefined> {
    if (typeof token === "string" && token) {
        return token;
    }
    if (typeof token === "function") {
        return (await token(extra)) || undefined;
    }
    return extra?.authInfo?.token || undefined;
}

/** Bytes of a body read before a call stops reading it (and stops counting). */
const MAX_COUNTED_BYTES = 64 * 1024 * 1024;

/**
 * The first `limit` bytes of a response body as text (cut on a character
 * boundary), and how many bytes it had (counted up to 64 MiB).
 */
async function readBody(
    response: Response,
    limit: number
): Promise<{ text: string; kept: number; total: number; truncated: boolean }> {
    if (!response.body) {
        return { text: "", kept: 0, total: 0, truncated: false };
    }
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let kept = 0;
    let total = 0;
    try {
        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                break;
            }
            total += value.byteLength;
            if (kept < limit) {
                const take = value.subarray(0, limit - kept);
                chunks.push(take);
                kept += take.byteLength;
            }
            if (total > MAX_COUNTED_BYTES) {
                await reader.cancel();
                break;
            }
        }
    } finally {
        reader.releaseLock?.();
    }
    const bytes = new Uint8Array(kept);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    const truncated = total > kept;
    const end = truncated ? utf8Boundary(bytes) : bytes.length;
    return { text: new TextDecoder().decode(bytes.subarray(0, end)), kept: end, total, truncated };
}

/** The length of `bytes` without a trailing, incomplete UTF-8 sequence. */
function utf8Boundary(bytes: Uint8Array): number {
    let start = bytes.length - 1;
    // Step back over continuation bytes (10xxxxxx) to the sequence's lead byte.
    while (start >= 0 && start > bytes.length - 4 && (bytes[start] & 0xc0) === 0x80) {
        start--;
    }
    if (start < 0) {
        return bytes.length;
    }
    const lead = bytes[start];
    const needed = lead >= 0xf0 ? 4 : lead >= 0xe0 ? 3 : lead >= 0xc0 ? 2 : 1;
    return start + needed > bytes.length ? start : bytes.length;
}

/** Why a request failed: cancelled by the client, out of time, or the error itself. */
function failure(error: unknown, cancel: AbortSignal | undefined, timeout: AbortSignal, timeoutMs: number): string {
    if (cancel?.aborted) {
        return "cancelled by the client";
    }
    if (timeout.aborted || (error instanceof Error && error.name === "TimeoutError")) {
        return `no answer within ${timeoutMs} ms`;
    }
    return errorMessage(error);
}

function toolError(text: string): CallToolResult {
    return { isError: true, content: [{ type: "text", text }] };
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function positive(value: number | undefined, fallback: number): number {
    return typeof value === "number" && Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
}
