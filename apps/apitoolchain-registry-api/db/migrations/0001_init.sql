-- registry-api schema: registered API specs + their versions. Forward-only
-- migrations (the runner in db/migrate.ts applies these in order; sqlc reads
-- this dir as the schema). Timestamps are timestamptz; handlers emit ISO.

CREATE TABLE apis (
  id          text PRIMARY KEY,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  format      text NOT NULL,
  namespace   text NOT NULL,
  source      text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_versions (
  api_id          text NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  version         text NOT NULL,
  spec_object_key text NOT NULL,
  spec_url        text NOT NULL,
  content_type    text NOT NULL,
  spec_sha        text NOT NULL,
  title           text,
  op_count        integer,
  is_current      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (api_id, version)
);
