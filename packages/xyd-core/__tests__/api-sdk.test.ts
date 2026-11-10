import { describe, it, expect } from "vitest";

import { resolveApiSdkConfig, anyApiSdkEnabled, API_SDK_LANGUAGES } from "../src/api-sdk";
import type { APIFile } from "../src/types/settings";

/**
 * `api.openapi[..].sdk` resolution — pure string matching used by BOTH the
 * build-side call sites (verbatim config sources) and the client-side layout
 * (absolute paths from page metadata). All shapes of APIFile enumerate.
 */
const ALL = API_SDK_LANGUAGES.map(l => l.language);

describe("resolveApiSdkConfig", () => {
    it("string entries never carry sdk", () => {
        expect(resolveApiSdkConfig("./api.yaml", "./api.yaml")).toBeNull();
        expect(resolveApiSdkConfig(["./a.yaml", "./b.yaml"], "./a.yaml")).toBeNull();
    });

    it("matches by exact (verbatim) source", () => {
        const cfg: APIFile = { source: "./books-api.yaml", route: "docs/api", sdk: true };
        expect(resolveApiSdkConfig(cfg, "./books-api.yaml")).toEqual({
            languages: ALL,
            defaultLanguage: "shell", // the raw-HTTP view is the default
        });
    });

    it("matches an absolute metadata path by normalized suffix", () => {
        const cfg: APIFile = { source: "./books-api.yaml", sdk: true };
        expect(resolveApiSdkConfig(cfg, "/proj/docs/books-api.yaml")).not.toBeNull();
        expect(resolveApiSdkConfig(cfg, "/proj/docs/other-api.yaml")).toBeNull();

        const parentCfg: APIFile = { source: "../shared/api.yaml", sdk: true };
        expect(resolveApiSdkConfig(parentCfg, "/repo/shared/api.yaml")).not.toBeNull();
    });

    it("suffix match respects path boundaries", () => {
        const cfg: APIFile = { source: "./api.yaml", sdk: true };
        // "…/notapi.yaml" must NOT match "api.yaml"
        expect(resolveApiSdkConfig(cfg, "/proj/notapi.yaml")).toBeNull();
        expect(resolveApiSdkConfig(cfg, "/proj/api.yaml")).not.toBeNull();
    });

    it("mixed arrays: only the sdk-enabled advanced entry matches", () => {
        const cfg = [
            "./plain.yaml",
            { source: "./sdk.yaml", route: "docs/api", sdk: true },
        ] as unknown as APIFile;
        expect(resolveApiSdkConfig(cfg, "/x/plain.yaml")).toBeNull();
        expect(resolveApiSdkConfig(cfg, "/x/sdk.yaml")).not.toBeNull();
    });

    it("map form works", () => {
        const cfg: APIFile = {
            v1: "./v1.yaml",
            v2: { source: "./v2.yaml", sdk: true },
        };
        expect(resolveApiSdkConfig(cfg, "/x/v1.yaml")).toBeNull();
        expect(resolveApiSdkConfig(cfg, "/x/v2.yaml")).not.toBeNull();
    });

    it("languages keep the CONFIGURED order (the switcher order); unknown ids drop; repeats collapse; empty result → all", () => {
        const cfg: APIFile = {
            source: "./a.yaml",
            sdk: { languages: ["python", "go"] },
        };
        expect(resolveApiSdkConfig(cfg, "./a.yaml")).toEqual({
            languages: ["python", "go"],
            configuredLanguages: ["python", "go"],
            defaultLanguage: "shell",
        });

        const mixed: APIFile = {
            source: "./a.yaml",
            sdk: { languages: ["typescript", "cobol", "python", "typescript", "go"] as any },
        };
        expect(resolveApiSdkConfig(mixed, "./a.yaml")?.languages).toEqual(["typescript", "python", "go"]);
        expect(resolveApiSdkConfig(mixed, "./a.yaml")?.configuredLanguages).toEqual(["typescript", "python", "go"]);

        const junk: APIFile = { source: "./a.yaml", sdk: { languages: ["rust", "cobol"] as any } };
        expect(resolveApiSdkConfig(junk, "./a.yaml")?.languages).toEqual(ALL);
        expect(resolveApiSdkConfig(junk, "./a.yaml")?.configuredLanguages).toBeUndefined();
    });

    it("configuredLanguages is absent for `sdk: true` — a spec's own x-sdk order then stands", () => {
        const all = resolveApiSdkConfig({ source: "./a.yaml", sdk: true }, "./a.yaml");
        expect(all?.languages).toEqual(ALL);
        expect(all?.configuredLanguages).toBeUndefined();
        expect(resolveApiSdkConfig({ source: "./a.yaml", sdk: {} }, "./a.yaml")?.configuredLanguages).toBeUndefined();
    });

    it("remote URLs match by exact equality only", () => {
        const cfg: APIFile = { source: "https://api.example.com/spec.yaml", sdk: true };
        expect(resolveApiSdkConfig(cfg, "https://api.example.com/spec.yaml")).not.toBeNull();
        expect(resolveApiSdkConfig(cfg, "/local/spec.yaml")).toBeNull();
    });

    it("sdk: false / absent disables", () => {
        expect(resolveApiSdkConfig({ source: "./a.yaml", sdk: false }, "./a.yaml")).toBeNull();
        expect(resolveApiSdkConfig({ source: "./a.yaml" }, "./a.yaml")).toBeNull();
    });
});

describe("anyApiSdkEnabled", () => {
    it("detects sdk anywhere across shapes", () => {
        expect(anyApiSdkEnabled(undefined)).toBe(false);
        expect(anyApiSdkEnabled("./a.yaml")).toBe(false);
        expect(anyApiSdkEnabled({ source: "./a.yaml" })).toBe(false);
        expect(anyApiSdkEnabled({ source: "./a.yaml", sdk: true })).toBe(true);
        expect(anyApiSdkEnabled(["./p.yaml", { source: "./s.yaml", sdk: {} }] as unknown as APIFile)).toBe(true);
        expect(anyApiSdkEnabled({ a: "./p.yaml", b: { source: "./s.yaml", sdk: true } })).toBe(true);
    });
});
