-- dist-tags: named, movable pointers to a version (npm-style). `latest` is
-- auto-managed on register; others (`canary`, `beta`, …) are set by hand.
-- Version resolution accepts a tag name OR a concrete version anywhere.

CREATE TABLE dist_tags (
  api_id     text NOT NULL REFERENCES apis(id) ON DELETE CASCADE,
  tag        text NOT NULL,
  version    text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (api_id, tag)
);
