-- SDK-level "our" version, decoupled from the published per-target versions.
-- The SDK registry ref (sdks/<ns>/<id>@<version>) is built from it. This is the
-- platform's own SDK versioning — forward-looking for the upcoming builds
-- section, where an SDK config/build has a version independent of what each
-- language package is published at.
ALTER TABLE sdks ADD COLUMN version text NOT NULL DEFAULT '0.1.0';
