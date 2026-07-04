-- platform-api schema: the generated outputs (SDK/docs/MCP), notifications,
-- org/project context, and the generation `jobs` seam. `api_id` is a SOFT
-- reference to the registry service (no cross-service FK).

CREATE TABLE orgs (
  id   text PRIMARY KEY,
  name text NOT NULL,
  plan text NOT NULL DEFAULT 'Free plan'
);

CREATE TABLE projects (
  id     text PRIMARY KEY,
  org_id text NOT NULL REFERENCES orgs(id),
  name   text NOT NULL
);

CREATE TABLE settings (
  id         integer PRIMARY KEY DEFAULT 1,
  org_id     text NOT NULL,
  project_id text NOT NULL
);

CREATE TABLE sdk_targets (
  id                text PRIMARY KEY,
  api_id            text NOT NULL,
  api_version       text NOT NULL DEFAULT '',
  language          text NOT NULL,
  package_name      text NOT NULL DEFAULT '',
  output            text NOT NULL DEFAULT '',
  version           text NOT NULL DEFAULT '',
  status            text NOT NULL DEFAULT 'building',
  artifact_ref      text,
  error_message     text,
  last_published_at timestamptz,
  registry_url      text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE docs_projects (
  id            text PRIMARY KEY,
  api_id        text NOT NULL,
  name          text NOT NULL,
  theme         text NOT NULL DEFAULT 'poetry',
  source_spec   text NOT NULL DEFAULT '',
  url           text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'building',
  artifact_ref  text,
  error_message text,
  last_built_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE mcp_servers (
  id            text PRIMARY KEY,
  api_id        text NOT NULL,
  name          text NOT NULL,
  source_spec   text NOT NULL DEFAULT '',
  tools_count   integer NOT NULL DEFAULT 0,
  transport     text NOT NULL DEFAULT 'http',
  status        text NOT NULL DEFAULT 'building',
  url           text,
  error_message text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id         text PRIMARY KEY,
  severity   text NOT NULL,
  title      text NOT NULL,
  body       text NOT NULL DEFAULT '',
  source     text NOT NULL,
  api_id     text,
  read       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE jobs (
  id         text PRIMARY KEY,
  kind       text NOT NULL,
  target_ref text NOT NULL,
  status     text NOT NULL DEFAULT 'queued',
  payload    jsonb NOT NULL DEFAULT '{}',
  attempts   integer NOT NULL DEFAULT 0,
  error      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
