import { gitProviderClient } from "../../../clients/gitprovider";
import * as gitQ from "../../../dbnode/git";
import { pool } from "../../../dbnode/pool";
import { randomId } from "../../../util";
import type { GitProviders } from "../../openapi/v1/src/generated/models/all/platform-api";
import { invalid } from "../__kit/errors";
import { toGitProvider } from "../__kit/mappers";

/**
 * POST /git-providers — connect an account. The token is validated by asking the
 * provider's whoami (via gitproviderd) and stored server-side only.
 */
export const create: GitProviders["create"] = async (_ctx, input) => {
  const baseUrl = input.baseUrl ?? "";
  let login: string;
  try {
    const user = await gitProviderClient.whoami({
      kind: input.kind,
      baseUrl,
      token: input.token,
    });
    login = user.login;
  } catch (e) {
    return invalid(`could not connect: ${(e as Error).message}`);
  }
  // One connection per account: (re-)connecting the same kind+account+baseUrl
  // refreshes the existing row's token in place (keeping its id, so any
  // repo_connections stay attached) instead of piling up duplicates.
  const existing = await gitQ.findGitProviderByAccount(pool, {
    kind: input.kind,
    connectedAs: login,
    baseUrl,
  });
  if (existing) {
    const updated = await gitQ.updateGitProviderToken(pool, {
      id: existing.id,
      token: input.token,
      name: input.name ?? existing.name,
    });
    return toGitProvider(updated as NonNullable<typeof updated>);
  }
  const row = await gitQ.insertGitProvider(pool, {
    id: randomId("gp"),
    kind: input.kind,
    name: input.name ?? `${input.kind} (${login})`,
    baseUrl,
    token: input.token,
    connectedAs: login,
  });
  return toGitProvider(row as NonNullable<typeof row>);
};
