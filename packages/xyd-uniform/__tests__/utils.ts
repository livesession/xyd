import * as path from "node:path";
import * as fs from "node:fs";

import {expect} from "vitest";

import {uniformToInputJsonSchema} from "../src/converters";
import {pluginJsonView} from "../src/plugins/pluginJsonView";
import uniform from "../src/index";
import type {Reference} from "../src/types";

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

    expect(result).toEqual(expectedOutput);
}

export async function testPluginJsonView(fixtureName: string) {
    const inputs: Reference[] = readFixture(`${fixtureName}/input.json`);
    const expectedOutput: string[] = readFixture(`${fixtureName}/output.json`);

    const plugin = pluginJsonView();
    const result = uniform(inputs, {plugins: [plugin]});

    expect(result.out.jsonViews).toStrictEqual(expectedOutput);
}