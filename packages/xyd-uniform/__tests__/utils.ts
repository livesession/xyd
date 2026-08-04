import * as path from "node:path";
import * as fs from "node:fs";

import {expect} from "vitest";

import {uniformToInputJsonSchema} from "../src/converters";
import {pluginJsonView} from "../src/plugins/pluginJsonView";
import {pluginNavigation} from "../src/plugins/pluginNavigation";
import uniform from "../src/index";
import type {Reference} from "../src/types";

// Oracle regen is EXPLICIT ONLY (fixture-freeze rule): committed output.json
// files are the parity oracle for the Rust migration (crates/xyd_uniform).
//   UNIFORM_BUILD_FIXTURES=1 pnpm vitest run
const REGEN = process.env.UNIFORM_BUILD_FIXTURES === "1";

function writeOracle(fixtureName: string, result: unknown) {
    fs.writeFileSync(
        path.join(fixturePath(fixtureName), "output.json"),
        JSON.stringify(result, null, 2),
    );
}

export function fixturePath(name: string) {
    return path.join(__dirname, "../__fixtures__", name);
}

export function readFixture(name: string) {
    return JSON.parse(fs.readFileSync(fixturePath(name), "utf8"));
}

export function loadReference(fixtureName: string): Reference {
    return readFixture(`${fixtureName}/reference.json`);
}

export function loadInstance(fixtureName: string): any {
    return readFixture(`${fixtureName}/instance.json`);
}

export function fixture(strings: TemplateStringsArray, ...values: any[]): { reference: Reference; instance: any } {
    const name = String.raw(strings, ...values);
    return {
        reference: loadReference(name),
        instance: loadInstance(name),
    };
}

export async function testConverters(fixtureName: string) {
    const inputData = readFixture(`${fixtureName}/input.json`);
    const expectedOutput = readFixture(`${fixtureName}/output.json`);

    let result;

    if (Array.isArray(inputData)) {
        result = [];
        for (const def of inputData) {
            const schema = uniformToInputJsonSchema(def);
            if (schema) result.push(schema);
        }
    } else {
        result = uniformToInputJsonSchema(inputData);
    }

    if (REGEN) {
        writeOracle(fixtureName, result);
        return;
    }
    expect(result).toEqual(expectedOutput);
}

export async function testPluginJsonView(fixtureName: string) {
    const inputs: Reference[] = readFixture(`${fixtureName}/input.json`);
    const expectedOutput: string[] = readFixture(`${fixtureName}/output.json`);

    const plugin = pluginJsonView();
    const result = uniform(inputs, {plugins: [plugin]});

    if (REGEN) {
        writeOracle(fixtureName, result.out.jsonViews);
        return;
    }
    expect(result.out.jsonViews).toStrictEqual(expectedOutput);
}

/**
 * Fixture-driven pluginNavigation parity case. input.json:
 * `{ settings?, options: {urlPrefix, defaultGroup?}, references: Reference[] }`
 * output.json: `{ pageFrontMatter, sidebar }` (the plugin's deferred output).
 */
export async function testPluginNavigation(fixtureName: string) {
    const input = readFixture(`${fixtureName}/input.json`);

    const plugin = pluginNavigation(input.settings || {}, input.options);
    const result = uniform(input.references as Reference[], {plugins: [plugin]});
    const out = {
        pageFrontMatter: (result.out as any).pageFrontMatter,
        sidebar: (result.out as any).sidebar,
    };

    if (REGEN) {
        writeOracle(fixtureName, out);
        return;
    }
    const expectedOutput = readFixture(`${fixtureName}/output.json`);
    expect(out).toEqual(expectedOutput);
}