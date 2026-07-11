/**
 * A small but real OpenAPI 3.0 document — the editor's fallback when no backend
 * is configured (`APITOOLCHAIN_API_URL` unset), so the whole editor UX (Monaco +
 * xyd sidebar grouped by tag + Atlas render) works offline out of the box.
 */
export const SAMPLE_OPENAPI = `openapi: 3.0.3
info:
  title: Petstore API
  version: 1.0.0
  description: A sample OpenAPI document you can edit — the docs on the right update live.
servers:
  - url: https://api.petstore.example/v1
tags:
  - name: Pets
    description: Everything about your pets
  - name: Store
    description: Orders and inventory
paths:
  /pets:
    get:
      tags: [Pets]
      operationId: listPets
      summary: List all pets
      parameters:
        - name: limit
          in: query
          description: Maximum number of pets to return
          required: false
          schema:
            type: integer
            format: int32
            default: 20
      responses:
        "200":
          description: A paged array of pets
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Pet"
    post:
      tags: [Pets]
      operationId: createPet
      summary: Create a pet
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NewPet"
      responses:
        "201":
          description: The created pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
  /pets/{petId}:
    get:
      tags: [Pets]
      operationId: getPet
      summary: Get a pet by id
      parameters:
        - name: petId
          in: path
          required: true
          description: The id of the pet to retrieve
          schema:
            type: string
      responses:
        "200":
          description: The pet
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Pet"
        "404":
          description: Pet not found
    delete:
      tags: [Pets]
      operationId: deletePet
      summary: Delete a pet
      parameters:
        - name: petId
          in: path
          required: true
          schema:
            type: string
      responses:
        "204":
          description: Deleted
  /store/inventory:
    get:
      tags: [Store]
      operationId: getInventory
      summary: Inventory by status
      responses:
        "200":
          description: A map of status to quantity
          content:
            application/json:
              schema:
                type: object
                additionalProperties:
                  type: integer
                  format: int32
components:
  schemas:
    Pet:
      type: object
      required: [id, name]
      properties:
        id:
          type: string
          description: Unique identifier
        name:
          type: string
          description: The pet's name
        tag:
          type: string
          description: An optional category tag
        status:
          type: string
          description: Availability in the store
          enum: [available, pending, sold]
    NewPet:
      type: object
      required: [name]
      properties:
        name:
          type: string
        tag:
          type: string
`;
