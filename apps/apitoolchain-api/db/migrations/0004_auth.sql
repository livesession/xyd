-- Auth + multi-tenant: real users, opaque sessions, org memberships, and a
-- per-user current-context row (supersedes the singleton `settings.id=1`).
-- Current org/project are plain text (soft refs, matching `settings`) so a
-- deleted project can't wedge a user's session.

CREATE TABLE users (
  id            text PRIMARY KEY,
  email         text NOT NULL UNIQUE,
  name          text NOT NULL DEFAULT '',
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sessions (
  token      text PRIMARY KEY,
  user_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);

CREATE TABLE memberships (
  org_id  text NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role    text NOT NULL DEFAULT 'member',
  PRIMARY KEY (org_id, user_id)
);

CREATE TABLE user_settings (
  user_id            text PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_org_id     text NOT NULL,
  current_project_id text NOT NULL
);
