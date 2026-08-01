-- The custom sdk.json a target was generated with (the "wizard" flow): a full
-- opensdk config (behavior + per-language emitter options), serialized. Applied
-- over the auto-derived defaults during generation + reused on rebuild. Empty
-- means the target used the auto-derived config.
ALTER TABLE sdk_targets ADD COLUMN sdk_json text NOT NULL DEFAULT '';
