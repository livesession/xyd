import * as fs from "node:fs";
import * as path from "node:path";
import { createRequire } from "node:module";

import { XydError } from "./log";

export interface ResolvedCli {
    /** argv WITHOUT the `build` subcommand, e.g. ["node", "/…/xyd-cli/dist/index.js"] */
    argv: string[];
    /** where it came from — for logging */
    source: "command option" | "local xyd-js" | "local @xyd-js/cli" | "PATH";
}

function binFromPackage(pkgJsonPath: string): string | null {
    try {
        const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8"));
        const bin = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.xyd;
        if (!bin) return null;
        const abs = path.join(path.dirname(pkgJsonPath), bin);
        return fs.existsSync(abs) ? abs : null;
    } catch {
        return null;
    }
}

/** Scan PATH for an executable named `xyd` (covers the compiled native binary + global installs). */
function xydOnPath(): string | null {
    const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
    for (const dir of (process.env.PATH || "").split(path.delimiter)) {
        if (!dir) continue;
        for (const ext of exts) {
            const candidate = path.join(dir, `xyd${ext}`);
            try {
                fs.accessSync(candidate, fs.constants.X_OK);
                if (fs.statSync(candidate).isFile()) return candidate;
            } catch { /* not here */ }
        }
    }
    return null;
}

/**
 * Resolve which xyd CLI to spawn, in order:
 *  1. the `command` option (full control)
 *  2. `xyd-js` / `@xyd-js/cli` installed in the HOST project
 *  3. an `xyd` executable on PATH
 * No `npx xyd-js@latest` auto-fallback — a build silently downloading `latest` is not reproducible.
 */
export function resolveCli(command: string[] | undefined, hostRoot: string): ResolvedCli {
    if (command?.length) {
        return { argv: command, source: "command option" };
    }

    const require = createRequire(path.join(hostRoot, "package.json"));
    for (const [pkgName, source] of [["xyd-js", "local xyd-js"], ["@xyd-js/cli", "local @xyd-js/cli"]] as const) {
        try {
            const bin = binFromPackage(require.resolve(`${pkgName}/package.json`));
            if (bin) return { argv: [process.execPath, bin], source };
        } catch { /* not installed */ }
    }

    const onPath = xydOnPath();
    if (onPath) return { argv: [onPath], source: "PATH" };

    throw new XydError(
        `could not find the xyd CLI.\n` +
        `  Fix one of:\n` +
        `  - npm i -D xyd-js            (recommended: pin a version)\n` +
        `  - install the \`xyd\` binary on PATH (https://xyd.dev)\n` +
        `  - pass \`command: ["bunx", "xyd-js@<version>"]\` (or any argv) to the plugin`
    );
}
