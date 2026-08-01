-- SDK builds = the platform's own SDK versioning. Each build produces a new SDK
-- version by regenerating every target from one API spec version, and is kept as
-- history (the Versions tab). Decoupled from each target's published package
-- version and from the API spec version it was built from. `targets` is a
-- point-in-time snapshot of the language targets that went into the build.
CREATE TABLE sdk_builds (
  id          text PRIMARY KEY,
  sdk_id      text NOT NULL,
  version     text NOT NULL,
  api_version text NOT NULL,
  status      text NOT NULL DEFAULT 'building',
  targets     jsonb NOT NULL DEFAULT '[]'::jsonb,
  project_id  text NOT NULL DEFAULT '',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX sdk_builds_sdk_id_idx ON sdk_builds (sdk_id, created_at DESC);
