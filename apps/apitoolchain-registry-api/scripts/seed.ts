import { pool } from "../src/db/pool";
import { registerApi } from "../src/handlers/apis/register_api";
import { ensureBucket } from "../src/storage";

// A small real OpenAPI spec, registered through the actual ingest path so a
// spec object lands in object storage and the dashboard isn't empty on boot.
const PETSTORE = `openapi: 3.0.3
info:
  title: Petstore
  version: "2.1.0"
  description: A sample Petstore API.
paths:
  /pets:
    get:
      operationId: listPets
      summary: List pets
      responses:
        "200":
          description: A list of pets
          content:
            application/json:
              schema:
                type: array
                items: { $ref: "#/components/schemas/Pet" }
    post:
      operationId: createPet
      summary: Create a pet
      requestBody:
        content:
          application/json:
            schema: { $ref: "#/components/schemas/NewPet" }
      responses:
        "201": { description: Created }
  /pets/{petId}:
    get:
      operationId: getPet
      summary: Get a pet
      parameters:
        - name: petId
          in: path
          required: true
          schema: { type: string }
      responses:
        "200":
          description: A pet
          content:
            application/json:
              schema: { $ref: "#/components/schemas/Pet" }
components:
  schemas:
    Pet:
      type: object
      required: [id, name]
      properties:
        id: { type: string }
        name: { type: string }
        tag: { type: string }
    NewPet:
      type: object
      required: [name]
      properties:
        name: { type: string }
        tag: { type: string }
`;

await ensureBucket();
const result = await registerApi(undefined, {
  name: "Petstore",
  ns: "acme",
  specText: PETSTORE,
  source: "github.com/acme/petstore",
});
if ("statusCode" in result) {
  console.error("[seed] register failed:", result.message);
  process.exit(1);
}
console.log(
  `[seed] registered ${result.id} (${result.versions.length} version) — ok`,
);
await pool.end();
