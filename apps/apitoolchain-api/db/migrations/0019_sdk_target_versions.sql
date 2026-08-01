-- Immutable per-target build history. Each successful build appends (or, for a
-- retry of the same version, updates) one row here, keyed by (target_id, version),
-- with its OWN version-keyed artifact + the exact sdk.json it was built from — so
-- a rebuild / new version never overwrites a previous version's outputs. The
-- `sdk_targets` row stays as the "latest" pointer (its version/artifact_ref).
CREATE TABLE sdk_target_versions (
  id text PRIMARY KEY,
  target_id text NOT NULL REFERENCES sdk_targets(id) ON DELETE CASCADE,
  version text NOT NULL,
  api_version text NOT NULL DEFAULT '',
  package_name text NOT NULL DEFAULT '',
  -- the exact config this version was built from (immutable snapshot).
  sdk_json text NOT NULL DEFAULT '',
  -- version-keyed object-storage ref for this version's artifact zip.
  artifact_ref text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'ready',
  registry_url text,
  published_at timestamptz,
  project_id text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (target_id, version)
);

CREATE INDEX sdk_target_versions_target_created_idx
  ON sdk_target_versions (target_id, created_at DESC);

-- Backfill: seed one immutable version row per existing built target from its
-- current state, so history isn't empty for targets that predate this table.
-- The old (non-version-keyed) artifact key is preserved as-is — new builds write
-- version-keyed keys and never touch it.
-- The immutable version dimension is the parent SDK's version (what the pipeline
-- keys new builds on), so seed each existing target's row from `sdks.version`,
-- falling back to the target's own package version when the SDK has none.
INSERT INTO sdk_target_versions
  (id, target_id, version, api_version, package_name, sdk_json, artifact_ref,
   status, registry_url, published_at, project_id, created_at)
SELECT
  t.id || ':' || COALESCE(NULLIF(s.version, ''), t.version),
  t.id,
  COALESCE(NULLIF(s.version, ''), t.version),
  t.api_version, t.package_name, t.sdk_json, COALESCE(t.artifact_ref, ''),
  t.status, t.registry_url, t.last_published_at, t.project_id, t.updated_at
FROM sdk_targets t
JOIN sdks s ON t.sdk_id = s.id
WHERE t.version <> '' AND t.artifact_ref IS NOT NULL
ON CONFLICT (target_id, version) DO NOTHING;
