-- Scope registered APIs to a project. `project_id` is a SOFT reference to the
-- platform-api `projects` table (no cross-service FK); existing rows backfill to
-- the seeded default project. The platform-api passes the caller's current
-- project on list/register.

ALTER TABLE apis ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';

CREATE INDEX apis_project_id_idx ON apis (project_id);
