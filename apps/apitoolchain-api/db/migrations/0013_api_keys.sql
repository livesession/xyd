-- Workspace API keys for programmatic access. Only a SHA-256 hash of the secret
-- is stored — the plaintext is returned ONCE, at creation, and never again.
-- `prefix` is the public start of the key, shown in the list to tell keys apart.
CREATE TABLE api_keys (
  id           text PRIMARY KEY,
  project_id   text NOT NULL DEFAULT 'prj_default',
  name         text NOT NULL,
  key_hash     text NOT NULL,
  prefix       text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);
CREATE INDEX api_keys_key_hash_idx ON api_keys (key_hash);
CREATE INDEX api_keys_project_idx ON api_keys (project_id);
