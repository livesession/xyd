-- Per-target generation log — a target-scoped, reset-each-build stream the
-- dashboard tails live (independent of the SDK-level build's shared log, which
-- only exists for versioned builds). Every generation path (add target, build,
-- new version, connect-publisher regen) appends here.
ALTER TABLE sdk_targets ADD COLUMN build_logs text NOT NULL DEFAULT '';
