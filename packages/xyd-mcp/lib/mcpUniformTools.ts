import { JSONSchema7 } from "json-schema";

import { jsonSchemaToZod } from "json-schema-to-zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  uniformToInputJsonSchema,
  type DefinitionTypeREST,
  type Reference,
} from "@xyd-js/uniform";
import * as z from "zod";

import { uniformFromSource } from "./utils";
import { getToolName } from "./utils";
  
// TODO: share uniform with tools and resources
// TODO: support for graphql and react better
export async function mcpUniformTools(
  server: McpServer,
  uniformSource: string,
  token: string
) {
  const references = await uniformFromSource(uniformSource);

  if (!references?.length) {
    return;
  }

  for (const reference of references) {
    if (reference?.context && "componentSchema" in reference.context) {
      continue;
    }

    const inputSchemaJson = inputSchemaFromReference(reference);

    let inputSchema: z.ZodRawShape | null = null;
    if (inputSchemaJson) {
      const zodSchemaString = jsonSchemaToZod(inputSchemaJson, {
        module: "none",
      });

      const zodObject = await stringToZodSchema(zodSchemaString);

      if (zodObject && typeof zodObject === "object" && "shape" in zodObject) {
        const sourceShape = zodObject.shape as Readonly<
          Record<string, unknown>
        >;
        const mutableShape: Record<string, z.ZodTypeAny> = {};
        for (const key of Object.keys(sourceShape)) {
          mutableShape[key] = sourceShape[key] as unknown as z.ZodTypeAny;
        }
        inputSchema = mutableShape as z.ZodRawShape;
      }
    }

    const toolName = getToolName(reference.canonical);

    server.registerTool(
      toolName,
      {
        description: reference.description as string,
        //@ts-ignore TODO: fix
        inputSchema: inputSchema || undefined,
      },
      async (extra) => {
        try {
          const [url, fetchOptions] = buildFetchRequest(
            extra,
            reference.context,
            token
          );

          const response = await fetch(url, fetchOptions);
          if (response.status === 401) {
            return {
              content: [
                {
                  type: "text",
                  text: `Error executing ${toolName}: Unauthorized`,
                },
              ],
            };
          }
          const data = await response.json(); // TODO: support other formats

          return {
            content: [
              {
                type: "resource_link",
                uri: `api-reference://${reference.canonical}`,
                name: reference.canonical,
                description: reference.description as string,
                mimeType: "text/markdown",
              },
              {
                type: "text",
                text: JSON.stringify(data, null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            content: [
              {
                type: "text",
                text: `Error executing ${reference.canonical}: ${error.message}`,
              },
            ],
          };
        }
      }
    );
  }
}

const TYPE_MAP: Record<DefinitionTypeREST, string> = {
  "$rest.param.path": "pathParams",
  "$rest.param.query": "queryParams",
  "$rest.param.header": "headers",
  "$rest.param.cookie": "cookies",
  "$rest.request.body": "requestBody",
};

// TODO: it should be in uniform via plugin?
function inputSchemaFromReference(ref: Reference): JSONSchema7 | undefined {
  const schema = uniformToInputJsonSchema(ref);

  if (!schema) {
    return undefined;
  }

  const schemasByType: Record<string, any> = {};

  if (!schema.allOf && !schema.oneOf) {
    schemasByType[schema?.$id || ""] = schema;
  } else {
    for (const subSchema of schema.allOf || schema.oneOf || []) {
      let id = "";
      if (typeof subSchema === "object" && "$id" in subSchema) {
        id = subSchema.$id as string;
      }
      if (!id || typeof subSchema !== "object") {
        continue;
      }

      schemasByType[id] = subSchema;
    }
  }

  const structuredProperties: Record<string, any> = {};

  // Create structured properties for each parameter type
  for (const [id, subSchema] of Object.entries(schemasByType)) {
    const friendlyType = TYPE_MAP[id];
    if (friendlyType && subSchema && typeof subSchema === "object") {
      structuredProperties[friendlyType] = subSchema;
    }
  }

  if (Object.keys(structuredProperties).length === 0) {
    console.error("No structured properties found for:", ref.canonical);
  }

  return {
    type: "object" as const,
    properties: structuredProperties,
  };
}

/**
 * Builds a fetch request based on MCP tool parameters and context
 */
function buildFetchRequest(
  parameters: any,
  context: any,
  token: string
): [string, RequestInit] {
  const { method, fullPath, path } = context;

  // Extract different parameter types
  const { queryParams, pathParams, headers, requestBody } = parameters || {};

  // Build the URL by replacing path parameters
  let url = fullPath || path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      url = url.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
  }

  // Add query parameters
  if (queryParams && Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    }
    const queryString = searchParams.toString();
    if (queryString) {
      url += (url.includes("?") ? "&" : "?") + queryString;
    }
  }

  // Build fetch options
  const fetchOptions: RequestInit = {
    method: method.toUpperCase(),
    headers: {
      Authorization: `Bearer ${token}`,
      //   "Content-Type": "application/json",
      //   Accept: "application/json",
      ...headers,
    },
  };

  // Add request body for POST/PUT/PATCH methods
  if (requestBody && ["POST", "PUT", "PATCH"].includes(method.toUpperCase())) {
    fetchOptions.body = JSON.stringify(requestBody);
  }

  return [url, fetchOptions];
}

async function stringToZodSchema(
  zodSchemaString: string
): Promise<z.ZodSchema | null> {
  const schemaFactory = new Function("z", `return (${zodSchemaString});`);

  const schema = schemaFactory(z);

  return schema;
}
