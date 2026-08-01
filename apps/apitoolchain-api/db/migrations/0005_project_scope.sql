-- Scope the platform-api entities to a project. `project_id` is a SOFT reference
-- to `projects` (no FK — mirrors `api_id`); existing rows backfill to the seeded
-- default project so nothing 404s during the migration.

ALTER TABLE sdks          ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';
ALTER TABLE docs_projects ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';
ALTER TABLE mcp_servers   ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';
ALTER TABLE notifications ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';

CREATE INDEX sdks_project_id_idx          ON sdks (project_id);
CREATE INDEX docs_projects_project_id_idx ON docs_projects (project_id);
CREATE INDEX mcp_servers_project_id_idx   ON mcp_servers (project_id);
CREATE INDEX notifications_project_id_idx ON notifications (project_id);
