import {describe, it, expect} from "vitest";
import {JSONSchema7} from "json-schema";
import fs from "fs";
import path from "path";

import {uniformPropertiesToJsonSchema, uniformToInputJsonSchema} from "./converters";
import {
    DefinitionProperty,
    DEFINED_DEFINITION_PROPERTY_TYPE,
    Reference,
} from "./types";

describe("uniformPropertiesToJsonSchema", () => {
    const tests = [
        {
            input: "./__fixtures__/1.basic/input.json",
            output: "./__fixtures__/1.basic/output.json",
        },
        {
            input: "./__fixtures__/2.advanced/input.json",
            output: "./__fixtures__/2.advanced/output.json",
        },
        {
            input: "./__fixtures__/2.advanced.livesession/input.json",
            output: "./__fixtures__/2.advanced.livesession/output.json",
        },
    ];

    describe("fixture-based tests", () => {
        tests.forEach((testCase, index) => {
            it(`should convert ${testCase.input} correctly`, () => {
                // Check if input file exists
                const inputPath = path.resolve(__dirname, testCase.input);
                const outputPath = path.resolve(__dirname, testCase.output);

                if (!fs.existsSync(inputPath)) {
                    console.warn(`Input file ${inputPath} does not exist, skipping test`);
                    return;
                }

                if (!fs.existsSync(outputPath)) {
                    console.warn(
                        `Output file ${outputPath} does not exist, skipping test`
                    );
                    return;
                }

                // Read input file
                const inputData = JSON.parse(fs.readFileSync(inputPath, "utf8"));
                const expectedOutput = JSON.parse(fs.readFileSync(outputPath, "utf8"));
                // Convert input data

                let inputCheck: JSONSchema7[] | JSONSchema7 | null = null;

                if (Array.isArray(inputData)) {
                    inputCheck = []
                    for (const def of inputData) {
                        const inputJsonSchema = uniformToInputJsonSchema(def);
                        if (inputJsonSchema) {
                            inputCheck.push(inputJsonSchema);
                        }
                    }
                } else {
                    const inputJsonSchema = uniformToInputJsonSchema(inputData);
                    inputCheck = inputJsonSchema
                }

                // Compare with expected output
                expect(inputCheck).toEqual(expectedOutput);
                // fs.writeFileSync(outputPath, JSON.stringify(inputCheck, null, 2))
            });
        });
    });
});
