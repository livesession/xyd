# GitHub Integration

Bidirectional sync between GitHub repos and local storage.

## Token Management

Encrypted via safeStorage API or AES-256-GCM fallback. Never cached in memory.

## Repository Connection

Stored in `userData/connected-repositories.json`. ProjectContext manages selection.

## File Sync

1. Fetch repo tree from GitHub Git Data API
2. Filter using .gitignore patterns
3. Download contents
4. Write to working copy and base directories

## Modification Tracking

Compares working directory against base directory. Binary files excluded.

## Publishing

1. Scan changes recursively
2. Get latest commit SHA
3. Create blobs for modified files
4. Build new tree
5. Create commit
6. Update branch reference
