-- A human display name (title) for each SDK target, stored at creation ("<API
-- title> <language>", e.g. "LiveSession OpenAPI Python"). OUR name — decoupled
-- from the URL slug (`id`) and from the published package name (per publisher).
-- Not derived at render time; the title is fixed when the target is created.
ALTER TABLE sdk_targets ADD COLUMN name text NOT NULL DEFAULT '';
