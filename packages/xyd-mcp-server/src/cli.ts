import { parseArgs } from "node:util";

import type { McpUniformToolsOptions } from "@xyd-js/mcp";

import { createMcpHttpApp, LOCAL_HOSTS } from "./http";
import { prepareMcpServer } from "./prepare";
import { serveMcpStdio } from "./stdio";

export const USAGE = `Usage:
  xyd-mcp-server [http] <source> [llms-source] [options]   serve over streamable HTTP
  xyd-mcp-server stdio <source> [llms-source] [options]    serve over stdio (a local client)

  <source>        an OpenAPI (.json, .yaml, .yml) or GraphQL (.graphql) document, a path
                  or a URL; several separated by commas
  [llms-source]   llms.txt URL(s) for a docs search tool (needs OPENAI_API_KEY)

HTTP:
  --port <n>               the port (default: $PORT, else 3000)
  --host <host>            the interface to listen on (default: all)
  --path <path>            a mount path; repeat or separate by commas (default: /mcp)
  --stateless              no sessions: a server per request, JSON answers, GET/DELETE 405
  --allowed-hosts <names>  Host header names accepted besides ${LOCAL_HOSTS.join(", ")}
                           (DNS-rebinding protection; comma-separated)
  --disable-host-check     accept any Host header (when a proxy in front checks it)

  Every request's "Authorization: Bearer <token>" is sent on by the tool calls of that
  request; the server keeps no token.

stdio:
  --token-env <NAME>       the environment variable holding the API bearer (default: API_TOKEN)

Tools:
  --base-url <url>         the API base URL (default: the document's first server)
  --header <"Name: value"> a header on every API call (e.g. a version header); repeatable
  --read-only              only the read-only tools (GET, HEAD, OPTIONS, TRACE)
  --tools <names>          only these tools (comma-separated)
  --limit-cap <n>          cap an integer "limit" parameter at n
  --max-bytes <n>          cut answers after n bytes (default: 262144)
  --grouped                group tool inputs (pathParams, queryParams, ...) instead of flat
  --skip-resources         no markdown reference resources (and no links to them)
  --name <name>            the server name answered in initialize

  -h, --help               this help
`;

export interface CliOptions {
    mode: "http" | "stdio";
    uniformSources: string[];
    llmsSources: string[];
    port: number;
    host?: string;
    paths: string[];
    stateless: boolean;
    allowedHosts: string[] | false;
    tokenEnv: string;
    baseUrl?: string;
    headers: Record<string, string>;
    readOnly: boolean;
    tools?: string[];
    limitCap?: number;
    maxBytes?: number;
    grouped: boolean;
    resources: boolean;
    name?: string;
}

/** The command line as options; `"help"` for `-h` / `--help`. Throws on a usage error. */
export function parseCli(argv: string[], env: NodeJS.ProcessEnv = process.env): CliOptions | "help" {
    const { values, positionals } = parseArgs({
        args: argv,
        allowPositionals: true,
        strict: true,
        options: {
            port: { type: "string" },
            host: { type: "string" },
            path: { type: "string", multiple: true },
            stateless: { type: "boolean" },
            "allowed-hosts": { type: "string", multiple: true },
            "disable-host-check": { type: "boolean" },
            "token-env": { type: "string" },
            "base-url": { type: "string" },
            header: { type: "string", multiple: true },
            "read-only": { type: "boolean" },
            tools: { type: "string", multiple: true },
            "limit-cap": { type: "string" },
            "max-bytes": { type: "string" },
            grouped: { type: "boolean" },
            "skip-resources": { type: "boolean" },
            name: { type: "string" },
            help: { type: "boolean", short: "h" },
        },
    });
    if (values.help) {
        return "help";
    }

    let mode: CliOptions["mode"] = "http";
    if (positionals[0] === "http" || positionals[0] === "stdio") {
        mode = positionals.shift() as CliOptions["mode"];
    }
    const [source, llms, ...rest] = positionals;
    if (!source) {
        throw new Error("missing <source>: the API document to serve");
    }
    if (rest.length) {
        throw new Error(`unexpected argument: ${rest[0]}`);
    }

    const httpOnly = ["port", "host", "path", "stateless", "allowed-hosts", "disable-host-check"] as const;
    if (mode === "stdio") {
        const given = httpOnly.find((flag) => values[flag] !== undefined);
        if (given) {
            throw new Error(`--${given} applies to the http mode`);
        }
    } else if (values["token-env"] !== undefined) {
        throw new Error("--token-env applies to the stdio mode; over HTTP each request carries its own bearer");
    }
    if (values["disable-host-check"] && values["allowed-hosts"]) {
        throw new Error("--allowed-hosts and --disable-host-check exclude each other");
    }

    const extraHosts = commaList(values["allowed-hosts"]);
    const paths = commaList(values.path).map((p) => (p.startsWith("/") ? p : `/${p}`));

    return {
        mode,
        uniformSources: commaList([source]),
        llmsSources: commaList(llms ? [llms] : []),
        port: integer(values.port ?? env.PORT, "--port", 3000, 0),
        host: values.host,
        paths: paths.length ? paths : ["/mcp"],
        stateless: !!values.stateless,
        allowedHosts: values["disable-host-check"] ? false : [...LOCAL_HOSTS, ...extraHosts],
        tokenEnv: values["token-env"] || "API_TOKEN",
        baseUrl: values["base-url"],
        headers: headerMap(values.header || []),
        readOnly: !!values["read-only"],
        tools: values.tools ? commaList(values.tools) : undefined,
        limitCap: values["limit-cap"] === undefined ? undefined : integer(values["limit-cap"], "--limit-cap", 0, 1),
        maxBytes: values["max-bytes"] === undefined ? undefined : integer(values["max-bytes"], "--max-bytes", 0, 1),
        grouped: !!values.grouped,
        resources: !values["skip-resources"],
        name: values.name,
    };
}

/** Runs the command line: `xyd-mcp-server [http|stdio] <source> [llms-source] [options]`. */
export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
    let options: CliOptions | "help";
    try {
        options = parseCli(argv);
    } catch (error) {
        process.stderr.write(`xyd-mcp-server: ${error instanceof Error ? error.message : String(error)}\n\n${USAGE}`);
        process.exitCode = 2;
        return;
    }
    if (options === "help") {
        process.stdout.write(USAGE);
        return;
    }

    if (options.mode === "stdio") {
        // stdout carries JSON-RPC only: whatever the libraries log goes to stderr.
        console.log = console.error;
        console.info = console.error;
        console.debug = console.error;
    }

    const allowed = options.tools ? new Set(options.tools) : undefined;
    const tools: McpUniformToolsOptions = {
        flatten: !options.grouped,
        limitCap: options.limitCap,
        readOnlyMode: options.readOnly,
        filter: allowed ? (tool) => allowed.has(tool.name) : undefined,
        baseUrl: options.baseUrl,
        headers: Object.keys(options.headers).length ? options.headers : undefined,
        maxBytes: options.maxBytes,
        token: options.mode === "stdio" ? process.env[options.tokenEnv] || undefined : undefined,
    };

    let prepared: Awaited<ReturnType<typeof prepareMcpServer>>;
    try {
        prepared = await prepareMcpServer({
            uniformSources: options.uniformSources,
            llmsSources: options.llmsSources,
            openAIApiKey: process.env.OPENAI_API_KEY,
            name: options.name,
            resources: options.resources,
            tools,
        });
    } catch (error) {
        console.error("xyd-mcp-server: could not read the sources:", error);
        process.exitCode = 1;
        return;
    }
    if (allowed) {
        const missing = [...allowed].filter((name) => !prepared.tools.some((tool) => tool.name === name));
        if (missing.length) {
            console.error(`xyd-mcp-server: no such tool: ${missing.join(", ")}`);
        }
    }

    if (options.mode === "stdio") {
        await serveMcpStdio(prepared);
        console.error(`xyd-mcp-server: ${prepared.tools.length} tools on stdio`);
        return;
    }

    const app = createMcpHttpApp(prepared, {
        stateless: options.stateless,
        paths: options.paths,
        allowedHosts: options.allowedHosts,
    });
    const onListening = () => {
        const address = listener.address();
        const port = typeof address === "object" && address ? address.port : options.port;
        const where = options.paths.map((p) => `http://${options.host || "localhost"}:${port}${p}`).join(", ");
        const mode = options.stateless ? "stateless" : "sessions";
        const hosts = options.allowedHosts === false ? "any Host accepted" : `Host: ${options.allowedHosts.join(", ")}`;
        console.log(`xyd-mcp-server: ${prepared.tools.length} tools at ${where} (${mode}; ${hosts})`);
    };
    const listener = options.host
        ? app.listen(options.port, options.host, onListening)
        : app.listen(options.port, onListening);
    listener.on("error", (error) => {
        console.error("xyd-mcp-server:", error.message);
        process.exitCode = 1;
    });
}

function commaList(values: string[] | undefined): string[] {
    return (values || [])
        .flatMap((value) => value.split(","))
        .map((value) => value.trim())
        .filter(Boolean);
}

function integer(value: string | undefined, flag: string, fallback: number, min: number): number {
    if (value === undefined || value === "") {
        return fallback;
    }
    const n = Number(value);
    if (!Number.isInteger(n) || n < min) {
        throw new Error(`${flag} wants a whole number of at least ${min}, not ${value}`);
    }
    return n;
}

function headerMap(values: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const value of values) {
        const colon = value.indexOf(":");
        const name = colon > 0 ? value.slice(0, colon).trim() : "";
        if (!name || /[^!#$%&'*+.^_`|~0-9A-Za-z-]/.test(name)) {
            throw new Error(`--header wants "Name: value", not ${JSON.stringify(value)}`);
        }
        out[name] = value.slice(colon + 1).trim();
    }
    return out;
}
