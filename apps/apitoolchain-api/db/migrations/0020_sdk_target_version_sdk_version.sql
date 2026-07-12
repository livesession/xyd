-- Decouple a target's PACKAGE version (what ships to the registry for end users —
-- the immutable `version`) from the SDK-level version it was built under. Store
-- the SDK version per build so the target page can show the picked version's own
-- SDK version instead of the SDK's current one.
ALTER TABLE sdk_target_versions ADD COLUMN sdk_version text NOT NULL DEFAULT '';

-- Backfill: existing rows were keyed by the SDK version, so their `version` IS the
-- SDK version — seed sdk_version from it where empty.
UPDATE sdk_target_versions SET sdk_version = version WHERE sdk_version = '';
