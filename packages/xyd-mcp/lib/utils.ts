import { deferencedOpenAPI, oapSchemaToReferences } from "@xyd-js/openapi";
import { gqlSchemaToReferences } from "@xyd-js/gql";
import { Reference } from "@xyd-js/uniform";

export async function uniformFromSource(
  uniformSource: string
): Promise<Reference[] | undefined> {
  let references: Reference[] = [];

  const sourceType = uniformSourceDetector(uniformSource);
  switch (sourceType) {
    case "openapi": {
      const openApiSpec = await deferencedOpenAPI(uniformSource);
      if (!openApiSpec) {
        console.warn(`Failed to read OpenAPI spec from ${uniformSource}`);
        return;
      }
      references = await oapSchemaToReferences(openApiSpec);
      break;
    }

    case "graphql": {
      references = await gqlSchemaToReferences(uniformSource);
      break;
    }

    case "typescript": {
      throw new Error("Typescript is not supported yet");
      break;
    }

    case "react": {
      throw new Error("React is not supported yet");
      break;
    }
  }

  return references;
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
