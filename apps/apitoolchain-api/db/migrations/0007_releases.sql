-- Release pipeline: a rolling, versioned PR per SDK repo_connection. A `release`
-- accumulates a spec-diff → semver bump → PR; on merge it becomes a git tag +
-- a provider Release. This replaces the primitive direct-push for connections in
-- `release_mode = 'release'`; runs reuse the `jobs` table (kind = 'git.release').

CREATE TABLE releases (
  id                         text PRIMARY KEY,
  project_id                 text NOT NULL DEFAULT 'prj_default',
  connection_id              text NOT NULL REFERENCES repo_connections(id) ON DELETE CASCADE,
  state                      text NOT NULL DEFAULT 'preparing',  -- preparing|pr_open|merging|released|failed|superseded
  base_spec_version          text NOT NULL DEFAULT '',           -- API version the diff is measured FROM (last released)
  head_spec_version          text NOT NULL DEFAULT '',           -- API version this release brings IN
  bump_type                  text NOT NULL DEFAULT '',           -- major|minor|patch|none
  from_version               text NOT NULL DEFAULT '',           -- SDK semver before
  to_version                 text NOT NULL DEFAULT '',           -- SDK semver after (computed; overridable)
  version_override           text NOT NULL DEFAULT '',           -- human override (PR title / field)
  changelog                  text NOT NULL DEFAULT '',           -- rendered markdown for this cycle
  change_count               integer NOT NULL DEFAULT 0,
  breaking_count             integer NOT NULL DEFAULT 0,
  head_branch                text NOT NULL DEFAULT '',           -- stable rolling regen branch
  base_branch                text NOT NULL DEFAULT '',           -- PR target
  pr_number                  integer NOT NULL DEFAULT 0,
  pr_url                     text NOT NULL DEFAULT '',
  tag                        text NOT NULL DEFAULT '',
  release_url                text NOT NULL DEFAULT '',
  error                      text NOT NULL DEFAULT '',
  created_at                 timestamptz NOT NULL DEFAULT now(),
  updated_at                 timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX releases_connection_idx ON releases (connection_id, created_at DESC);
CREATE INDEX releases_project_id_idx ON releases (project_id);
-- The rolling PR: at most one active release per connection.
CREATE UNIQUE INDEX releases_one_active_per_conn
  ON releases (connection_id) WHERE state IN ('preparing', 'pr_open', 'merging');

-- repo_connections gains release-mode config + accumulated release state. The
-- existing `branch` column keeps its direct-push meaning for release_mode='push'.
ALTER TABLE repo_connections
  ADD COLUMN release_mode               text    NOT NULL DEFAULT 'push',   -- push (legacy direct) | release (PR-based)
  ADD COLUMN auto_release               boolean NOT NULL DEFAULT false,    -- open/force-update a PR on every new spec version
  ADD COLUMN base_branch                text    NOT NULL DEFAULT '',       -- PR target (empty → repo default)
  ADD COLUMN prerelease                 boolean NOT NULL DEFAULT false,
  ADD COLUMN last_released_version      text    NOT NULL DEFAULT '',       -- SDK semver of the last MERGED release
  ADD COLUMN last_released_spec_version text    NOT NULL DEFAULT '',       -- API version of the last MERGED release (diff base)
  ADD COLUMN webhook_id                 text    NOT NULL DEFAULT '',
  ADD COLUMN webhook_secret             text    NOT NULL DEFAULT '';
