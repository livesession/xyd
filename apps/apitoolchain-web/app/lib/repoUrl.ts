import type { GitProvider, GitProviderKind } from "~/data";

/** Default web host per provider kind (self-hosted Gitea has no default). */
const REPO_HOST: Record<GitProviderKind, string> = {
  github: "https://github.com",
  gitlab: "https://gitlab.com",
  bitbucket: "https://bitbucket.org",
  gitea: "",
};

/** Web URL for a connected repo, from the provider's base URL (or default host). */
export function repoWebUrl(
  provider: GitProvider | undefined,
  repo: string,
): string | undefined {
  const base = (provider?.baseUrl || (provider ? REPO_HOST[provider.kind] : ""))
    .trim()
    .replace(/\/+$/, "");
  return base ? `${base}/${repo}` : undefined;
}
