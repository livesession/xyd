# delete all local tags
git tag -l | xargs -n 1 git tag -d

# fetch all remote tags fresh
git fetch origin --tags --force --prune --prune-tags

# verify
git tag