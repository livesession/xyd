import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import path from "node:path";

import { getRandomPort } from "./resolve-xyd";

/**
 * The `xyd-mcp-server` bin the server suites run: `$XYD_E2E_MCP_SERVER_BIN` (a
 * published server, as the CI job installs it), else the monorepo's when its dist
 * is built (`pnpm --filter "@xyd-js/mcp-server..." build`); null otherwise.
 */
export function mcpServerBin(): string | null {
    const given = process.env.XYD_E2E_MCP_SERVER_BIN;
    if (given) {
        return existsSync(given) ? given : null;
    }
    const root = path.resolve(__dirname, "../../..");
    const bin = path.join(root, "packages/xyd-mcp-server/bin/xyd-mcp-server.mjs");
    const cli = path.join(root, "packages/xyd-mcp-server/dist/cli.js");
    return existsSync(bin) && existsSync(cli) ? bin : null;
}

/**
 * Whether the server suites skip: only when no server is at hand AND none is
 * required. `XYD_E2E_REQUIRE_MCP_SERVER=1` (set by the CI job that installs one)
 * turns a missing server into a failure, so a broken install cannot pass as a skip.
 */
export function mcpServerSuitesSkip(): boolean {
    return !mcpServerBin() && process.env.XYD_E2E_REQUIRE_MCP_SERVER !== "1";
}

/** The bin, or an error saying how to get one. */
export function requireMcpServerBin(): string {
    const bin = mcpServerBin();
    if (!bin) {
        throw new Error(MCP_SERVER_MISSING);
    }
    return bin;
}

export const MCP_SERVER_MISSING =
    "no xyd-mcp-server: set XYD_E2E_MCP_SERVER_BIN to an installed one, or build the monorepo's: pnpm --filter \"@xyd-js/mcp-server...\" build";

/** The API document the server tests serve. */
export const PETS_OPENAPI = path.resolve(__dirname, "../9.mcp/pets.openapi.yaml");

export interface RunningMcpServer {
    url: string;
    origin: string;
    process: ChildProcess;
    output: () => string;
    stop: () => Promise<void>;
}

/**
 * Starts `xyd-mcp-server http <args…> --port <free>` and waits for it to listen.
 */
export async function startMcpServer(args: string[], env: Record<string, string> = {}): Promise<RunningMcpServer> {
    const bin = requireMcpServerBin();
    const port = await getRandomPort();
    const child = spawn(process.execPath, [bin, "http", ...args, "--host", "127.0.0.1", "--port", String(port)], {
        env: { ...process.env, ...env },
        stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    const collect = (chunk: Buffer) => {
        output += chunk.toString();
    };
    child.stdout?.on("data", collect);
    child.stderr?.on("data", collect);

    await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`xyd-mcp-server did not start:\n${output}`)), 60_000);
        const check = () => {
            if (output.includes(" tools at ")) {
                clearTimeout(timer);
                resolve();
            }
        };
        child.stdout?.on("data", check);
        child.on("exit", (code) => {
            clearTimeout(timer);
            reject(new Error(`xyd-mcp-server exited (${code}):\n${output}`));
        });
    });

    const origin = `http://127.0.0.1:${port}`;
    return {
        url: `${origin}/mcp`,
        origin,
        process: child,
        output: () => output,
        stop: () =>
            new Promise<void>((resolve) => {
                if (child.exitCode !== null) return resolve();
                child.once("exit", () => resolve());
                child.kill("SIGTERM");
            }),
    };
}

export interface ApiStub {
    url: string;
    /** Every request: its path and query, its Authorization and version headers. */
    seen: Array<{ url: string; authorization?: string; version?: string; method: string }>;
    stop: () => Promise<void>;
}

/** The HTTP API behind the tools: answers a pet, records each request. */
export async function startApiStub(): Promise<ApiStub> {
    const seen: ApiStub["seen"] = [];
    const server: Server = createServer((req, res) => {
        const version = req.headers["x-api-version"];
        seen.push({
            url: req.url || "",
            authorization: req.headers.authorization,
            version: Array.isArray(version) ? version[0] : version,
            method: req.method || "",
        });
        req.resume();
        req.on("end", () => {
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({ id: "1", name: "Rex" }));
        });
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    return {
        url: `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`,
        seen,
        stop: () => new Promise<void>((resolve) => server.close(() => resolve())),
    };
}
