// The schemas in this package and the allowlist in opensdk's Rust CLI describe
// the SAME option surface, in two languages, with no link between them. When
// they drift the failure is silent in the worst direction: the Rust accepts an
// option the schema does not declare, so a WORKING config is flagged as an error
// by every editor validating against these files.
//
// That is not hypothetical. It has happened twice — `busybox` shipped undeclared
// for months, and `entry` repeated it — and both times the config that broke was
// one of ours. This test is the link.
//
// It reads the Rust source rather than a build artifact on purpose: the allowlist
// is a `const` array of string literals, it is the single source of truth for
// what `split_cli_options` accepts, and parsing it needs no Rust toolchain.
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../../..");
const CLI_TARGETS_RS = resolve(repoRoot, "opensdk/cli/src/cli_targets.rs");
const SDK_SCHEMA = resolve(here, "../sdk.schema.json");

/** Pull the string literals out of a `pub const NAME: &[&str] = &[ ... ];`. */
function rustStringConst(source: string, name: string): string[] {
    const decl = source.indexOf(`const ${name}:`);
    if (decl === -1) throw new Error(`${name} not found in cli_targets.rs`);
    const open = source.indexOf("[", decl);
    const close = source.indexOf("];", open);
    if (open === -1 || close === -1) throw new Error(`${name} is not an array literal`);
    return [...source.slice(open, close).matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

/** The backend-owned keys, which the schema folds into the same section. */
function rustBackendKeys(source: string): Set<string> {
    // `CliBackend::Go => &["modulePath", ...],` — one arm per backend.
    const arms = [...source.matchAll(/CliBackend::\w+\s*=>\s*&\[([^\]]*)\]/g)];
    const keys = arms.flatMap((m) => [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]));
    if (keys.length === 0) throw new Error("no backend_keys arms found");
    return new Set(keys);
}

// The opensdk submodule is absent on runners that do not check it out
// (tests-unit.yml). Skipping is correct there — but it must be VISIBLE, which is
// why tests-native.yml re-runs this suite with submodules and prints what was
// skipped. A silent skip would recreate the very gap this file closes.
const haveSubmodule = existsSync(CLI_TARGETS_RS);

describe.skipIf(!haveSubmodule)("CLI converter options: Rust allowlist vs JSON schema", () => {
    const source = readFileSync(CLI_TARGETS_RS, "utf8");
    const schema = JSON.parse(readFileSync(SDK_SCHEMA, "utf8"));

    // Section-level keys the schema adds that are not converter options.
    const SECTION_OWN = new Set(["output", "publish"]);

    const converterKeys = new Set(rustStringConst(source, "CLI_CONVERTER_KEYS"));
    const backendKeys = rustBackendKeys(source);

    for (const def of ["GoCliSection", "RustCliSection"]) {
        it(`${def} declares exactly the options the Rust accepts`, () => {
            const props = schema.$defs?.[def]?.properties;
            expect(props, `${def} missing from sdk.schema.json`).toBeDefined();

            const declared = new Set(
                Object.keys(props).filter((k) => !SECTION_OWN.has(k) && !backendKeys.has(k)),
            );

            // Report BOTH directions by name — "undeclared" is the bug that bit
            // us twice, "stale" is a key the Rust dropped and the schema still
            // advertises, which sends people to an option that no longer exists.
            const undeclared = [...converterKeys].filter((k) => !declared.has(k)).sort();
            const stale = [...declared].filter((k) => !converterKeys.has(k)).sort();

            expect(
                { undeclared, stale },
                `${def} is out of sync with CLI_CONVERTER_KEYS in opensdk/cli/src/cli_targets.rs.\n` +
                    `  undeclared = accepted by the Rust, missing from the schema ` +
                    `(editors will flag a working config — add it to CLI_CONVERTER_PROPS in scripts/gen-schema.mjs)\n` +
                    `  stale      = advertised by the schema, rejected by the Rust ` +
                    `(split_cli_options will hard-error on it)`,
            ).toEqual({ undeclared: [], stale: [] });
        });
    }

    it("the schema's own section keys stay disjoint from the backend keys", () => {
        // Mirrors the Rust-side disjointness test; if a key ever lands in both
        // lists the split becomes order-dependent and one side wins silently.
        const overlap = [...converterKeys].filter((k) => backendKeys.has(k));
        expect(overlap, "a key is claimed by both the converter and a backend").toEqual([]);
    });

    it("both schema files agree on the CLI sections", () => {
        // chain.schema.json embeds copies; a partial regeneration would leave
        // one file updated and the other not.
        const chain = JSON.parse(
            readFileSync(resolve(here, "../chain.schema.json"), "utf8"),
        );
        for (const def of ["GoCliSection", "RustCliSection"]) {
            expect(chain.$defs?.[def], `${def} missing from chain.schema.json`).toEqual(
                schema.$defs[def],
            );
        }
    });
});
