import { data } from "react-router";
import { listProviderBranches, listProviderRepos } from "~/data";
import type { Route } from "./+types/git.repos";

// Never let the browser cache the picker/list — always reflect the provider.
const NO_STORE = { headers: { "Cache-Control": "no-store" } };

/**
 * Resource route for the ConnectRepoModal wizard + the Connections repo list,
 * fetched via `fetcher.load`:
 * - `?providerId=` → the provider's repos (the repo picker / list).
 * - `?providerId=&repo=owner/name` → that repo's branches (the branch picker).
 * Server-only — the token stays in the gateway.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const providerId = url.searchParams.get("providerId");
  const repo = url.searchParams.get("repo");
  if (!providerId) return data({ repos: [], branches: [] }, NO_STORE);
  if (repo) {
    return data(
      { branches: await listProviderBranches(providerId, repo) },
      NO_STORE,
    );
  }
  return data({ repos: await listProviderRepos(providerId) }, NO_STORE);
}
