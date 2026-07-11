-- Per-connection publish log — the PUBLISHER's own step/output stream (prepare →
-- extract → apply name → push → result), reset at the start of each publish and
-- appended live so the dashboard can tail a publish. Distinct from the target's
-- generation log (sdk_targets.build_logs), which is the generated-client build.
ALTER TABLE registry_connections ADD COLUMN publish_logs text NOT NULL DEFAULT '';
