// S6+ C-S5 both-mode gate for the settings data plane (env substitution + the
// sync presets). Fixtures live in the crate the Rust impl also tests against
// (crates/xyd_settings/fixtures/process_settings/<case>/) so the JS oracle, the
// cargo parity test, and this shim test all share ONE input/output.
//
// The committed `output.json` is the JS-owned oracle: it is produced by the
// live `postLoadSetupJS` (replaceEnvVars + presetsSyncData) — regenerate with
// `SETTINGS_BUILD_FIXTURES=1 pnpm --filter @xyd-js/plugin-docs test`.
//
// Assertions (both modes verified in-process):
//   - JS: `postLoadSetupJS(input)` deep-equals the committed oracle (JS drift).
//   - Native: `settingsNative.processSettings(input, env)` deep-equals AND is
//     byte-identical to the JS oracle (the Rust ⇄ JS data-plane parity). Skips
//     gracefully when the addon is absent or XYD_NATIVE=0 (the fallback path,
//     already covered by the JS assertion).
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Settings } from "@xyd-js/core";

import { postLoadSetupJS } from "../src/presets/docs/settings";
import { settingsNative } from "../src/native";

const FIXTURES = path.resolve(
    fileURLToPath(new URL(".", import.meta.url)),
    "../../../crates/xyd_settings/fixtures/process_settings"
);

const REGEN = process.env.SETTINGS_BUILD_FIXTURES === "1";
const nativeAvailable =
    !!settingsNative?.processSettings && process.env.XYD_NATIVE !== "0";

function cases(): string[] {
    return fs
        .readdirSync(FIXTURES, { withFileTypes: true })
        .filter((e) => e.isDirectory() && fs.existsSync(path.join(FIXTURES, e.name, "input.json")))
        .map((e) => e.name)
        .sort();
}

function readJson(p: string): any {
    return JSON.parse(fs.readFileSync(p, "utf-8"));
}

// Snapshot process.env, apply the fixture env, run fn, restore.
function withEnv<T>(env: Record<string, string>, fn: () => T): T {
    const saved = process.env;
    process.env = { ...saved, ...env };
    try {
        return fn();
    } finally {
        process.env = saved;
    }
}

describe("settings process_settings (native ⇄ JS, both modes)", () => {
    for (const name of cases()) {
        it(name, () => {
            const dir = path.join(FIXTURES, name);
            const input = readJson(path.join(dir, "input.json")) as Settings;
            const env = readJson(path.join(dir, "env.json")) as Record<string, string>;

            // JS-owned oracle — always deterministic given the fixture env.
            const oracle = withEnv(env, () => postLoadSetupJS(structuredClone(input)));

            if (REGEN) {
                fs.writeFileSync(
                    path.join(dir, "output.json"),
                    JSON.stringify(oracle, null, 2) + "\n"
                );
                return;
            }

            const committed = readJson(path.join(dir, "output.json"));
            // JS path (fallback / XYD_NATIVE=0) matches the committed oracle.
            expect(oracle).toEqual(committed);

            if (nativeAvailable) {
                const native = JSON.parse(
                    settingsNative.processSettings(
                        JSON.stringify(input),
                        JSON.stringify(env)
                    )
                );
                // Rust data plane is structurally AND byte-identical to JS.
                expect(native).toEqual(oracle);
                expect(JSON.stringify(native)).toBe(JSON.stringify(oracle));
            }
        });
    }
});
