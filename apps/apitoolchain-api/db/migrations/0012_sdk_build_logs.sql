-- Build logs: step lines emitted per target generation, accumulated on the
-- build so the Versions tab can show progress (live while building, kept after).
ALTER TABLE sdk_builds ADD COLUMN logs text NOT NULL DEFAULT '';
