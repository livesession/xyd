-- SDKs: a named project tied to one API that groups per-language targets.
-- Multiple SDKs per API are allowed. Targets now belong to an SDK (sdk_id) and
-- keep api_id denormalised so the registry rollups keep working.

CREATE TABLE sdks (
  id          text PRIMARY KEY,
  api_id      text NOT NULL,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  namespace   text NOT NULL DEFAULT 'default',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sdk_targets ADD COLUMN sdk_id text NOT NULL DEFAULT '';
