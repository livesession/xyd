import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

import type { Settings } from "@xyd-js/core";

import { loadI18nTranslations } from "../src";

/**
 * loadI18nTranslations resolves catalogs in priority order:
 *   1. i18n.translations[locale] is a string → load that JSON file
 *      (path is resolved relative to process.cwd() unless absolute).
 *   2. i18n.translations[locale] is an object → use it as the inline catalog.
 *   3. Convention fallback: i18n/<locale>.json at process.cwd().
 *
 * These tests temporarily chdir into a tmp workspace per test so the
 * relative-path and convention-fallback branches are exercised
 * deterministically without polluting the repo.
 */
describe("loadI18nTranslations", () => {
    let tmpDir: string;
    let prevCwd: string;

    beforeEach(() => {
        prevCwd = process.cwd();
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "xyd-i18n-test-"));
        process.chdir(tmpDir);
    });

    afterEach(() => {
        process.chdir(prevCwd);
        fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    function settings(translations?: Record<string, any>): Settings {
        return { i18n: translations ? { translations } : undefined } as Settings;
    }

    it("loads a catalog from a relative file path", () => {
        fs.mkdirSync(path.join(tmpDir, "locales"));
        fs.writeFileSync(
            path.join(tmpDir, "locales/english.json"),
            JSON.stringify({ "footer.x": "Footer X" })
        );

        const out = loadI18nTranslations(
            settings({ en: "./locales/english.json" }),
            ["en"]
        );

        expect(out.en).toEqual({ "footer.x": "Footer X" });
    });

    it("loads a catalog from an absolute file path", () => {
        const abs = path.join(tmpDir, "absolute-en.json");
        fs.writeFileSync(abs, JSON.stringify({ key: "abs" }));

        const out = loadI18nTranslations(settings({ en: abs }), ["en"]);

        expect(out.en).toEqual({ key: "abs" });
    });

    it("uses an inline catalog object as-is", () => {
        const inline = { "footer.copyright": "All rights reserved" };

        const out = loadI18nTranslations(settings({ en: inline }), ["en"]);

        expect(out.en).toEqual(inline);
        // Reference identity: inline objects are taken without re-serialization.
        expect(out.en).toBe(inline);
    });

    it("falls back to i18n/<locale>.json convention when locale is omitted", () => {
        fs.mkdirSync(path.join(tmpDir, "i18n"));
        fs.writeFileSync(
            path.join(tmpDir, "i18n/pl.json"),
            JSON.stringify({ "footer.x": "Stopka X" })
        );

        const out = loadI18nTranslations(settings({}), ["pl"]);

        expect(out.pl).toEqual({ "footer.x": "Stopka X" });
    });

    it("uses convention fallback when i18n.translations is undefined entirely", () => {
        fs.mkdirSync(path.join(tmpDir, "i18n"));
        fs.writeFileSync(path.join(tmpDir, "i18n/de.json"), JSON.stringify({ x: "X" }));

        const out = loadI18nTranslations(settings(), ["de"]);

        expect(out.de).toEqual({ x: "X" });
    });

    it("supports mixed declaration: file path for en, inline for pl, convention for de", () => {
        // en — custom path
        fs.mkdirSync(path.join(tmpDir, "locales"));
        fs.writeFileSync(
            path.join(tmpDir, "locales/english.json"),
            JSON.stringify({ k: "en value" })
        );
        // de — convention
        fs.mkdirSync(path.join(tmpDir, "i18n"));
        fs.writeFileSync(
            path.join(tmpDir, "i18n/de.json"),
            JSON.stringify({ k: "de value" })
        );

        const out = loadI18nTranslations(
            settings({
                en: "./locales/english.json",
                pl: { k: "pl value" },
                // de intentionally omitted → convention path
            }),
            ["en", "pl", "de"]
        );

        expect(out.en).toEqual({ k: "en value" });
        expect(out.pl).toEqual({ k: "pl value" });
        expect(out.de).toEqual({ k: "de value" });
    });

    it("logs a warning and skips missing locale when neither declaration nor convention file exists", () => {
        // No file written; no inline catalog declared.
        const out = loadI18nTranslations(settings(), ["pl"]);

        expect(out.pl).toBeUndefined();
    });

    it("logs a warning and skips when declared file path doesn't exist", () => {
        const out = loadI18nTranslations(
            settings({ en: "./does-not-exist.json" }),
            ["en"]
        );

        expect(out.en).toBeUndefined();
    });

    it("logs a warning and skips when declared file is invalid JSON", () => {
        fs.writeFileSync(path.join(tmpDir, "broken.json"), "{ not valid json }");

        const out = loadI18nTranslations(settings({ en: "./broken.json" }), ["en"]);

        expect(out.en).toBeUndefined();
    });
});
