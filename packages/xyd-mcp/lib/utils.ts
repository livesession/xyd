import type { Reference } from "@xyd-js/uniform";

// The converters load on first use: a server that registers tools it generated
// ahead of time never needs them.

export async function uniformFromSource(
  uniformSource: string
): Promise<Reference[] | undefined> {
  let references: Reference[] = [];

  const sourceType = uniformSourceDetector(uniformSource);
  switch (sourceType) {
    case "openapi": {
      const { deferencedOpenAPI, oapSchemaToReferences } = await import("@xyd-js/openapi");
      const openApiSpec = await deferencedOpenAPI(uniformSource);
      if (!openApiSpec) {
        console.warn(`Failed to read OpenAPI spec from ${uniformSource}`);
        return;
      }
      references = await oapSchemaToReferences(openApiSpec);
      break;
    }

    case "graphql": {
      const { gqlSchemaToReferences } = await import("@xyd-js/gql");
      references = await gqlSchemaToReferences(uniformSource);
      break;
    }

    case "typescript": {
      throw new Error("Typescript is not supported yet");
    }

    case "react": {
      throw new Error("React is not supported yet");
    }
  }

  return references;
}

/**
 * The references of a uniform source, strictly: a source of no supported kind
 * or a document that cannot be read is an error, never an empty list.
 */
export async function loadUniformSource(uniformSource: string): Promise<Reference[]> {
  const kind = uniformSourceDetector(stripQuery(uniformSource));
  if (kind !== "openapi" && kind !== "graphql") {
    throw new Error(
      `unsupported source ${JSON.stringify(uniformSource)}: expected an OpenAPI (.json, .yaml, .yml) or GraphQL (.graphql, .graphqls) document`
    );
  }
  if (kind === "openapi") {
    const { deferencedOpenAPI, oapSchemaToReferences } = await import("@xyd-js/openapi");
    const document = await deferencedOpenAPI(uniformSource);
    if (!document) {
      throw new Error(`could not read the OpenAPI document ${JSON.stringify(uniformSource)}`);
    }
    return oapSchemaToReferences(document);
  }
  const { gqlSchemaToReferences } = await import("@xyd-js/gql");
  return gqlSchemaToReferences(uniformSource);
}

/** A URL's path without its query string or fragment, for the extension check. */
function stripQuery(source: string): string {
  return /^https?:\/\//i.test(source) ? source.replace(/[?#].*$/, "") : source;
}

// TODO: in the future from shared xyd package
function uniformSourceDetector(
  sourcePath: string
): "openapi" | "graphql" | "typescript" | "react" | null {
  // Get file extension
  const extension = sourcePath.toLowerCase().split(".").pop();

  if (!extension) {
    return null;
  }

  // Check for GraphQL files
  if (extension === "graphql" || extension === "graphqls") {
    return "graphql";
  }

  // Check for TypeScript/JavaScript files
  if (extension === "js" || extension === "tsx" || extension === "ts") {
    return "typescript";
  }

  // Check for OpenAPI files (JSON or YAML)
  if (extension === "json" || extension === "yaml" || extension === "yml") {
    return "openapi";
  }

  // Check for React files
  if (extension === "jsx" || extension === "tsx") {
    return "react";
  }

  return null;
}


export function getToolName(canonical: string) {
  return canonical
    .replace(/[^a-zA-Z0-9_-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase()
    .substring(0, 128); // Ensure max length of 128
}

/** The URI `mcpUniformResources` gives the reference page of `canonical`. */
export function mcpUniformResourceUri(canonical: string) {
  return `api-reference://${getToolName(canonical)}`;
}
