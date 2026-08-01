-- git providers + repo connections. A git_provider is a connected account (its
-- token is server-side only, never returned to the browser). A repo_connection
-- links a spec (api_id) or an SDK target (sdk_target id) to a repo; syncing it
-- pushes the artifact there via the gitproviderd service. Sync runs reuse the
-- existing `jobs` table (kind = 'git.sync').

CREATE TABLE git_providers (
  id           text PRIMARY KEY,
  kind         text NOT NULL,            -- github | gitlab | bitbucket | gitea
  name         text NOT NULL,
  base_url     text NOT NULL DEFAULT '',
  token        text NOT NULL,            -- PAT / app password (dev: plaintext)
  connected_as text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE repo_connections (
  id               text PRIMARY KEY,
  provider_id      text NOT NULL REFERENCES git_providers(id) ON DELETE CASCADE,
  target_kind      text NOT NULL,        -- spec | sdk
  target_id        text NOT NULL,        -- api id (spec) or sdk_target id (sdk)
  ref              text NOT NULL DEFAULT '',
  repo             text NOT NULL,        -- owner/name
  branch           text NOT NULL DEFAULT '',
  prefix           text NOT NULL DEFAULT '',
  last_synced_at   timestamptz,
  last_sync_status text NOT NULL DEFAULT '',
  last_sync_error  text NOT NULL DEFAULT '',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX repo_connections_target_idx ON repo_connections (target_kind, target_id);
