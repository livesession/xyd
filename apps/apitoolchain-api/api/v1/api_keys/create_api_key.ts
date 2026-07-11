import { createHash, randomBytes } from "node:crypto";
import * as keyQ from "../../../dbnode/api_keys";
import { pool } from "../../../dbnode/pool";
import { randomId } from "../../../util";
import type { ApiKeys } from "../../openapi/v1/src/generated/models/all/platform-api";
import { requireAuth } from "../__kit/auth";
import { invalid } from "../__kit/errors";
import { toApiKey } from "../__kit/mappers";

/**
 * POST /api-keys — mint a key. The plaintext secret is returned ONCE; only its
 * SHA-256 hash + a public prefix are stored, so it can't be retrieved again.
 */
export const createApiKey: ApiKeys["create"] = async (ctx, input) => {
  const auth = await requireAuth(ctx);
  const name = (input.name ?? "").trim();
  if (!name) return invalid("a key name is required");

  const secret = `atk_live_${randomBytes(24).toString("hex")}`;
  const keyHash = createHash("sha256").update(secret).digest("hex");
  const prefix = secret.slice(0, 13); // `atk_live_` + 4 chars

  const row = await keyQ.insertApiKey(pool, {
    id: randomId("key"),
    projectId: auth.projectId,
    name,
    keyHash,
    prefix,
  });
  return { key: toApiKey(row as NonNullable<typeof row>), secret };
};
