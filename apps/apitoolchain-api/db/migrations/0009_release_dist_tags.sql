-- Which dist-tags a release connection reacts to. Comma-separated
-- (e.g. 'latest' or 'latest,canary'); '*' means all tags. Default 'latest'
-- preserves the prior behaviour: only a version published under `latest`
-- triggers this connection's rolling release PR.
ALTER TABLE repo_connections
  ADD COLUMN dist_tags text NOT NULL DEFAULT 'latest';
