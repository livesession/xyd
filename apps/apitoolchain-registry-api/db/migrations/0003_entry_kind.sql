-- Registry entries are now one of two kinds: `api` (OpenAPI/GraphQL/AsyncAPI)
-- or `schema` (a standalone JSON Schema document). Same lifecycle — versions,
-- dist-tags, resolvable URLs — just a different content kind, split in the UI.

ALTER TABLE apis ADD COLUMN kind text NOT NULL DEFAULT 'api';
