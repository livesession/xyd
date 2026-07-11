-- Scope SDK targets to a project too (set from the parent SDK's project on
-- create), so the flat targets list + overview counts are project-scoped.
ALTER TABLE sdk_targets ADD COLUMN project_id text NOT NULL DEFAULT 'prj_default';
CREATE INDEX sdk_targets_project_id_idx ON sdk_targets (project_id);
