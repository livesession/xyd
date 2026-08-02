import * as documan from "@xyd-js/documan"
import { spawn, spawnSync } from "node:child_process"
import { createRequire } from "node:module"

export async function dev(options: any = {}) {
    // Opt-in Bun engine (S1): drop Vite + React Router in dev and serve via the
    // Bun render server + Rust watcher. Gated on XYD_BUN during migration; the
    // Vite path below stays the default.
    if (process.env.XYD_BUN) {
        return devBun(options)
    }

    await documan.dev(options)

    // keep `xyd dev` alive
    await new Promise(() => {
    });
}

/**
 * Spawn the Bun dev server. The CLI itself runs under node (its bin shebang is
 * node), and the launcher is TSX that only Bun can run — so we spawn a bun
 * child on the launcher resolved from documan's `./bun-launcher` export. The
 * child (a long-lived server) keeps `xyd dev` alive.
 */
async function devBun(options: any = {}) {
    const probe = spawnSync("bun", ["--version"], { stdio: "ignore" })
    if (probe.status !== 0) {
        console.error("XYD_BUN is set but Bun is not on PATH. Install Bun: https://bun.sh")
        process.exit(1)
    }

    const require = createRequire(import.meta.url)
    let launcher: string
    try {
        launcher = require.resolve("@xyd-js/documan/bun-launcher")
    } catch (e) {
        console.error("Could not resolve @xyd-js/documan/bun-launcher:", (e as any)?.message)
        process.exit(1)
        return
    }

    await new Promise<void>((resolve, reject) => {
        const child = spawn("bun", [launcher], {
            stdio: "inherit",
            cwd: process.cwd(), // launcher's appInit + ContentFS are cwd-relative
            env: {
                ...process.env,
                XYD_PORT: String(options.port ?? process.env.XYD_PORT ?? 5175),
            },
        })
        child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`xyd dev (bun) exited ${code}`))))
        child.on("error", reject)
    })
}
