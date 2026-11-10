import { AjvJsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/ajv";
import type { JsonSchemaType, JsonSchemaValidator } from "@modelcontextprotocol/sdk/validation/types.js";
import * as z from "zod/v4";

/**
 * A zod object that lists as `schema`, verbatim.
 *
 * `McpServer.registerTool` takes zod and lists `z.toJSONSchema(inputSchema)`.
 * A generated tool already has its JSON Schema, so instead of turning it into
 * zod source and evaluating that, the schema rides on a loose object through
 * zod's `_zod.toJSONSchema` override: `tools/list` shows the generated schema
 * (descriptions, examples, nullability, `additionalProperties: false`) as it
 * is, and the loose object hands every argument through to the call, which
 * validates them against the same schema (see {@link jsonSchemaValidator}).
 *
 * The override belongs to the schema instance, not to a registry, so it holds
 * whichever zod copy the SDK resolves.
 */
export function jsonSchemaInput(schema: object): z.ZodObject {
    const json = JSON.stringify(schema);
    const input = z.looseObject({});
    // A fresh copy per call: the converter may annotate what it is handed.
    (input._zod as { toJSONSchema?: () => object }).toJSONSchema = () => JSON.parse(json);
    return input;
}

const validators = new WeakMap<object, JsonSchemaValidator<Record<string, unknown>>>();
let ajv: AjvJsonSchemaValidator | undefined;

/** A validator for `schema`, compiled once per schema object (the SDK's Ajv provider). */
export function jsonSchemaValidator(schema: object): JsonSchemaValidator<Record<string, unknown>> {
    let validate = validators.get(schema);
    if (!validate) {
        ajv ??= new AjvJsonSchemaValidator();
        validate = ajv.getValidator<Record<string, unknown>>(schema as JsonSchemaType);
        validators.set(schema, validate);
    }
    return validate;
}
