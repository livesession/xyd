#!/usr/bin/env node
// Waits until the registry can INSTALL a snapshot release: the given packages at
// their version, and every dependency of theirs pinned to that same version (the
// packages published together), each listed in the registry's install metadata.
//
//   node scripts/wait-for-npm-release.mjs [--timeout <seconds>] [--interval <seconds>] <name@version>...
//
// Why not `npm view`: it reads the full package document, while package managers
// resolve from the abbreviated install document (`Accept:
// application/vnd.npm.install-v1+json`), which the registry's CDN refreshes on its
// own schedule. Right after a publish of ~50 packages, `npm view` already lists a
// version that `pnpm add` cannot find for minutes — in a different sibling on each
// try — so retrying the install blindly fails with ERR_PNPM_NO_MATCHING_VERSION.
// This polls the document the installer will read, for every package it will need.
//
// Exit 0 when all are visible; exit 1, naming the missing ones, after --timeout.

const REGISTRY = (process.env.NPM_CONFIG_REGISTRY || "https://registry.npmjs.org").replace(/\/+$/, "");

function parseArgs(argv) {
    const out = { timeout: 900, interval: 10, specs: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === "--timeout") out.timeout = Number(argv[++i]);
        else if (arg === "--interval") out.interval = Number(argv[++i]);
        else out.specs.push(arg);
    }
    if (!out.specs.length || !Number.isFinite(out.timeout) || !Number.isFinite(out.interval)) {
        console.error("usage: wait-for-npm-release.mjs [--timeout <s>] [--interval <s>] <name@version>...");
        process.exit(2);
    }
    return out;
}

/** `@scope/name@1.2.3` → ["@scope/name", "1.2.3"]. */
function splitSpec(spec) {
    const at = spec.lastIndexOf("@");
    if (at <= 0) {
        throw new Error(`not a name@version: ${spec}`);
    }
    return [spec.slice(0, at), spec.slice(at + 1)];
}

/** The install document's entry for `name@version`, or null while it is not listed. */
async function installEntry(name, version) {
    const url = `${REGISTRY}/${name.replace("/", "%2f")}`;
    try {
        const res = await fetch(url, {
            headers: { accept: "application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8" },
            cache: "no-store",
        });
        if (!res.ok) {
            return null;
        }
        const doc = await res.json();
        return doc?.versions?.[version] ?? null;
    } catch {
        return null;
    }
}

/** The dependencies of a manifest that the installer will resolve to exactly `version`. */
function pinnedDependencies(manifest, version) {
    const out = [];
    for (const field of ["dependencies", "optionalDependencies", "peerDependencies"]) {
        for (const [name, spec] of Object.entries(manifest[field] || {})) {
            if (spec === version) {
                out.push(name);
            }
        }
    }
    return out;
}

async function main() {
    const { timeout, interval, specs } = parseArgs(process.argv.slice(2));
    const deadline = Date.now() + timeout * 1000;

    // name → version still to confirm; confirmed ones move to `seen`.
    const pending = new Map();
    const seen = new Set();
    for (const spec of specs) {
        const [name, version] = splitSpec(spec);
        pending.set(name, version);
    }

    for (let round = 1; ; round++) {
        // Check every pending package once per round — including the dependencies
        // the confirmed ones reveal during the round.
        const checked = new Set();
        for (let next = [...pending].filter(([name]) => !checked.has(name)); next.length; next = [...pending].filter(([name]) => !checked.has(name))) {
            await Promise.all(
                next.map(async ([name, version]) => {
                    checked.add(name);
                    const entry = await installEntry(name, version);
                    if (!entry) {
                        return;
                    }
                    pending.delete(name);
                    seen.add(name);
                    for (const dep of pinnedDependencies(entry, version)) {
                        if (!seen.has(dep) && !pending.has(dep)) {
                            pending.set(dep, version);
                        }
                    }
                })
            );
        }
        if (!pending.size) {
            console.log(`✅ ${seen.size} packages installable from ${REGISTRY}`);
            return;
        }
        const missing = [...pending].map(([name, version]) => `${name}@${version}`);
        if (Date.now() + interval * 1000 > deadline) {
            console.error(`::error::not installable after ${timeout}s: ${missing.join(", ")}`);
            process.exit(1);
        }
        console.log(`round ${round}: ${seen.size} ready, waiting for ${missing.length}: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? ", …" : ""}`);
        await new Promise((resolve) => setTimeout(resolve, interval * 1000));
    }
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
