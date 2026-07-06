import {
  Badge,
  Button,
  EmptyState,
  Field,
  Icon,
  type IconName,
  Input,
  Mono,
  Select,
} from "@apitoolchain/design-system";
import { useEffect, useRef, useState } from "react";
import { Link, useFetcher } from "react-router";
import { SettingsHeader } from "~/components/SettingsHeader";
import {
  connectGitProvider,
  type GitProvider,
  type GitProviderKind,
  listGitProviders,
  removeGitProvider,
} from "~/data";
import { oauthConfigured } from "~/oauth.server";
import type { Route } from "./+types/settings.connections";

export function meta() {
  return [{ title: "Connections — apitoolchain" }];
}

const KIND_OPTIONS: { value: GitProviderKind; label: string }[] = [
  { value: "github", label: "GitHub" },
  { value: "gitlab", label: "GitLab" },
  { value: "gitea", label: "Gitea" },
  { value: "bitbucket", label: "Bitbucket" },
];
const KIND_LABEL: Record<GitProviderKind, string> = {
  gitea: "Gitea",
  github: "GitHub",
  gitlab: "GitLab",
  bitbucket: "Bitbucket",
};
/** Brand mark for each provider (design-system icon registry). */
const KIND_ICON: Record<GitProviderKind, IconName> = {
  gitea: "gitea",
  github: "github",
  gitlab: "gitlab",
  bitbucket: "bitbucket",
};
/** GitHub & GitLab connect via OAuth; the rest use a token. */
const isOAuthKind = (k: GitProviderKind): k is "github" | "gitlab" =>
  k === "github" || k === "gitlab";

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return {
    providers: await listGitProviders(),
    oauth: oauthConfigured(),
    connected: url.searchParams.get("connected"),
    oauthError: url.searchParams.get("oauth_error"),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const form = await request.formData();
  if (form.get("intent") === "remove") {
    return removeGitProvider(String(form.get("id") ?? ""));
  }
  const token = String(form.get("token") ?? "").trim();
  if (!token)
    return { ok: false as const, message: "An access token is required." };
  return connectGitProvider({
    kind: String(form.get("kind") ?? "gitea") as GitProviderKind,
    token,
    baseUrl: String(form.get("baseUrl") ?? "").trim() || undefined,
    name: String(form.get("name") ?? "").trim() || undefined,
  });
}

export default function SettingsConnectionsRoute({
  loaderData,
}: Route.ComponentProps) {
  const { providers, oauth, connected, oauthError } = loaderData;
  return (
    <>
      <SettingsHeader active="connections" />
      <div className="flex max-w-[640px] flex-col gap-6">
        <p className="text-sm text-subtle">
          Connect a git provider to push API specs and generated SDKs into your
          repos. GitHub and GitLab connect via OAuth — no token or base URL to
          paste. Credentials are stored server-side and never sent to the
          browser.
        </p>
        {connected && (
          <div className="rounded-control bg-success-bg px-3 py-2 text-[13px] text-success">
            Connected {KIND_LABEL[connected as GitProviderKind] ?? connected}.
          </div>
        )}
        {oauthError && (
          <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
            {oauthError}
          </div>
        )}
        <ConnectProviderForm oauth={oauth} />
        <ProvidersList providers={providers} />
      </div>
    </>
  );
}

function ConnectProviderForm({
  oauth,
}: {
  oauth: Record<"github" | "gitlab", boolean>;
}) {
  const [kind, setKind] = useState<GitProviderKind>("github");
  return (
    <div className="flex flex-col gap-4 rounded-panel border border-line bg-surface p-5">
      <div className="text-sm font-semibold text-ink">Connect a provider</div>
      <Field label="Provider" htmlFor="gp-kind">
        <Select
          id="gp-kind"
          value={kind}
          onChange={(v) => setKind(v as GitProviderKind)}
          options={KIND_OPTIONS}
          leadingIcon={KIND_ICON[kind]}
        />
      </Field>
      {isOAuthKind(kind) ? (
        <OAuthConnect kind={kind} configured={oauth[kind]} />
      ) : (
        <TokenConnect kind={kind} />
      )}
    </div>
  );
}

/** OAuth (GitHub / GitLab): a real navigation to the authorize-start route. */
function OAuthConnect({
  kind,
  configured,
}: {
  kind: "github" | "gitlab";
  configured: boolean;
}) {
  const label = KIND_LABEL[kind];
  const envStem = kind === "github" ? "GITHUB" : "GITLAB";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[13px] text-subtle">
        You'll be redirected to {label} to authorize access to your repositories
        — no token or base URL needed.
      </p>
      <div>
        <Button
          variant="primary"
          icon="git"
          href={configured ? `/settings/connections/oauth/${kind}` : undefined}
          disabled={!configured}
        >
          Connect with {label}
        </Button>
      </div>
      {!configured && (
        <div className="rounded-control bg-surface-muted px-3 py-2 text-[12px] text-subtle">
          {label} OAuth isn't configured. Set{" "}
          <Mono>{envStem}_OAUTH_CLIENT_ID</Mono> and{" "}
          <Mono>{envStem}_OAUTH_CLIENT_SECRET</Mono> on the web server, and
          register the app's callback URL as{" "}
          <Mono>{`<origin>/settings/connections/oauth/${kind}`}</Mono>.
        </div>
      )}
    </div>
  );
}

/** Token flow (Gitea self-hosted / Bitbucket app password). */
function TokenConnect({ kind }: { kind: GitProviderKind }) {
  const fetcher = useFetcher<typeof action>();
  const [baseUrl, setBaseUrl] = useState("");
  const [token, setToken] = useState("");
  const submitting = fetcher.state !== "idle";
  const submitted = useRef(false);
  const error = fetcher.data && !fetcher.data.ok ? fetcher.data.message : null;
  const selfHosted = kind === "gitea";

  useEffect(() => {
    if (submitted.current && fetcher.state === "idle" && fetcher.data?.ok) {
      submitted.current = false;
      setToken("");
      setBaseUrl("");
    }
  }, [fetcher.state, fetcher.data]);

  function connect() {
    if (!token.trim() || submitting) return;
    submitted.current = true;
    fetcher.submit(
      { intent: "connect", kind, baseUrl, token },
      { method: "post" },
    );
  }

  return (
    <>
      <Field
        label="Base URL"
        htmlFor="gp-url"
        hint={
          selfHosted
            ? "Required for a self-hosted Gitea, e.g. http://localhost:3000"
            : "Optional — only for self-hosted / enterprise instances."
        }
      >
        <Input
          id="gp-url"
          value={baseUrl}
          onChange={setBaseUrl}
          placeholder={
            selfHosted ? "http://localhost:3000" : "https://bitbucket.org"
          }
        />
      </Field>
      <Field
        label="Access token"
        htmlFor="gp-token"
        hint="A personal access token / app password with repo scope."
      >
        <Input
          id="gp-token"
          type="password"
          value={token}
          onChange={setToken}
          placeholder="••••••••"
        />
      </Field>
      {error && (
        <div className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger">
          {error}
        </div>
      )}
      <div>
        <Button
          variant="primary"
          icon="git"
          onClick={connect}
          disabled={!token.trim() || submitting}
        >
          {submitting ? "Connecting…" : "Connect provider"}
        </Button>
      </div>
    </>
  );
}

function ProvidersList({ providers }: { providers: GitProvider[] }) {
  if (providers.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <div className="text-sm font-semibold text-ink">
          Connected providers
        </div>
        <EmptyState
          icon="git"
          title="No git providers connected"
          description="Connect a provider above to sync specs and SDKs into repos."
        />
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="text-sm font-semibold text-ink">Connected providers</div>
      <div className="flex flex-col divide-y divide-line-soft rounded-panel border border-line bg-surface">
        {providers.map((p) => (
          <ProviderRow key={p.id} provider={p} />
        ))}
      </div>
    </div>
  );
}

function ProviderRow({ provider: p }: { provider: GitProvider }) {
  // No Remove here — disconnecting lives on the provider detail page.
  return (
    <Link
      to={`/settings/connections/${p.id}`}
      className="flex items-center justify-between gap-3 px-4 py-3 no-underline"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Badge tone="neutral" icon={KIND_ICON[p.kind]}>
          {KIND_LABEL[p.kind]}
        </Badge>
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-ink">{p.name}</div>
          <Mono tone="muted">
            {p.connectedAs}
            {p.baseUrl ? ` · ${p.baseUrl}` : ""}
          </Mono>
        </div>
      </div>
      <Icon
        icon="chevronRight"
        size={16}
        className="shrink-0 text-muted"
        aria-hidden={true}
      />
    </Link>
  );
}
