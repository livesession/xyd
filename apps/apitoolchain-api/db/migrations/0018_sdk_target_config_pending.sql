-- Whether the target's saved sdk.json config has UNBUILT changes: set true when
-- the config is edited (the wizard "Save"), cleared when a build applies it. Lets
-- the UI show a persistent "pending changes — waiting for a build" status that
-- survives a refresh and shows across the target's tabs (not just right after a
-- save). Existing rows default to false — their current config IS what they were
-- last built with.
ALTER TABLE sdk_targets ADD COLUMN config_pending boolean NOT NULL DEFAULT false;
