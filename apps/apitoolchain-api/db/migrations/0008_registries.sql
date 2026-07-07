-- package registries + registry connections. A package_registry is a connected
-- package registry account (npm/PyPI/Maven/…); its token is server-side only,
-- never returned to the browser. A registry_connection links ONE SDK target
-- (a language) to a registry; publishing it generates the SDK and pushes the
-- package there via the reused opensdk `publishTarget()` (shells out on the
-- gateway host). Publish runs reuse the `jobs` table (kind = 'sdk.publish').
--
-- Mirrors git_providers + repo_connections (0003_git.sql) — the same two-level
-- "account + per-target connection" shape.

CREATE TABLE package_registries (
  id           text PRIMARY KEY,
  kind         text NOT NULL,            -- npm | pypi | gems | maven | nuget | goproxy
  name         text NOT NULL,
  url          text NOT NULL,           -- registry URL, or a local file-feed path
  token        text NOT NULL DEFAULT '',-- auth token (dev: plaintext; never returned)
  connected_as text NOT NULL DEFAULT '',
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE registry_connections (
  id                     text PRIMARY KEY,
  registry_id            text NOT NULL REFERENCES package_registries(id) ON DELETE CASCADE,
  target_id              text NOT NULL,        -- sdk_target id
  language               text NOT NULL,        -- the target's language (node|python|…)
  package_name           text NOT NULL DEFAULT '',
  auto_publish           boolean NOT NULL DEFAULT true,
  last_published_version text NOT NULL DEFAULT '',
  last_published_at      timestamptz,
  last_publish_status    text NOT NULL DEFAULT '',  -- '' | building | ready | error
  last_publish_error     text NOT NULL DEFAULT '',
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX registry_connections_target_idx ON registry_connections (target_id);
