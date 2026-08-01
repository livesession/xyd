/**
 * A compact OpenAPI 3.0 spec the preview generates a real SDK from. Chosen to
 * showcase what the sdk.json options affect: a bearer scheme (→ envVar), a
 * server (→ baseURL), a flat resource (`pets.*`) AND a nested one
 * (`store.orders.*`) so resource-chain casing shows per language, a `404` (→
 * error kind + busybox helpers), and a couple schemas (→ typed params/models).
 */
export const petstore: Record<string, unknown> = {
  openapi: "3.0.3",
  info: {
    title: "Acme",
    version: "1.0.0",
    description: "A tiny sample API used by the sdk.json wizard preview.",
  },
  servers: [{ url: "https://api.acme.com/v1" }],
  security: [{ bearerAuth: [] }],
  paths: {
    "/pets": {
      get: {
        operationId: "listPets",
        summary: "List pets",
        parameters: [
          {
            name: "limit",
            in: "query",
            schema: { type: "integer", format: "int32" },
          },
          {
            name: "status",
            in: "query",
            schema: { type: "string", enum: ["available", "pending", "sold"] },
          },
        ],
        responses: {
          "200": {
            description: "A list of pets",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Pet" },
                },
              },
            },
          },
          "401": {
            description: "Unauthorized",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      post: {
        operationId: "createPet",
        summary: "Create a pet",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewPet" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pet" },
              },
            },
          },
          "422": {
            description: "Validation",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
    },
    "/pets/{petId}": {
      get: {
        operationId: "getPet",
        summary: "Retrieve a pet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "200": {
            description: "A pet",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Pet" },
              },
            },
          },
          "404": {
            description: "Not found",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Error" },
              },
            },
          },
        },
      },
      delete: {
        operationId: "deletePet",
        summary: "Delete a pet",
        parameters: [
          {
            name: "petId",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
        responses: {
          "204": { description: "Deleted" },
          "404": { description: "Not found" },
        },
      },
    },
    "/store/orders": {
      get: {
        operationId: "listOrders",
        summary: "List store orders",
        responses: {
          "200": {
            description: "Orders",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/Order" },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: "createOrder",
        summary: "Place a store order",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewOrder" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Order" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer" },
    },
    schemas: {
      Pet: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          status: { type: "string", enum: ["available", "pending", "sold"] },
          tags: { type: "array", items: { type: "string" } },
        },
      },
      NewPet: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
          status: { type: "string", enum: ["available", "pending", "sold"] },
        },
      },
      Order: {
        type: "object",
        required: ["id", "petId"],
        properties: {
          id: { type: "string" },
          petId: { type: "string" },
          quantity: { type: "integer", format: "int32" },
        },
      },
      NewOrder: {
        type: "object",
        required: ["petId"],
        properties: {
          petId: { type: "string" },
          quantity: { type: "integer", format: "int32" },
        },
      },
      Error: {
        type: "object",
        required: ["message"],
        properties: { code: { type: "string" }, message: { type: "string" } },
      },
    },
  },
};

/** The bundled sample specs, keyed by `specId` (default = the first). */
export const SAMPLE_SPECS: {
  id: string;
  label: string;
  doc: Record<string, unknown>;
}[] = [{ id: "petstore", label: "Petstore (sample)", doc: petstore }];
