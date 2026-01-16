---
name: dependabot-alerts-update
description: Automatically fetch and fix Dependabot security alerts by querying GitHub REST API for open alerts, identifying vulnerable packages, researching secure versions, and updating package.json files across monorepo workspaces. Use when user mentions Dependabot alerts, security vulnerabilities, or wants to update vulnerable dependencies automatically.
---

# Dependabot Alerts Update

Automatically fetch Dependabot security alerts from GitHub and update vulnerable packages to secure versions.

## Workflow

### 1. Fetch Dependabot Alerts

Use GitHub REST API to fetch open Dependabot alerts:

```bash
# Get repository owner and name from git remote
git remote get-url origin

# Fetch alerts (requires GITHUB_TOKEN)
curl -H "Authorization: token $GITHUB_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/{owner}/{repo}/dependabot/alerts?state=open"
```

Or use the GitHub CLI if available:
```bash
gh api repos/{owner}/{repo}/dependabot/alerts --jq '.[] | select(.state == "open")'
```

**Required environment variable**: `GITHUB_TOKEN` with `security_events` scope.

### 2. Parse and Categorize Alerts

For each alert, extract:
- **Package name** (`dependency.package.name`)
- **Severity** (`security_advisory.severity`: `critical`, `high`, `moderate`, `low`)
- **Vulnerable versions** (`security_vulnerability.vulnerable_version_range`)
- **CVE/GHSA ID** (`security_advisory.ghsa_id` or `security_advisory.cve_id`)
- **Manifest path** (`dependency.manifest_path`)

Group alerts by:
1. **Direct dependencies** (in package.json files)
2. **Transitive dependencies** (will be resolved via direct dependency updates)
3. **Severity** (prioritize critical/high first)

### 3. Research Secure Versions

For each vulnerable package, determine the minimum secure version:

1. **Check alert API response** - The `security_vulnerability.first_patched_version` field often contains the fixed version:
   ```bash
   gh api repos/{owner}/{repo}/dependabot/alerts/{alert_number} | jq '.security_vulnerability.first_patched_version'
   ```

2. **Search for security advisories**:
   - GitHub Security Advisories: `https://github.com/advisories?query={package}`
   - npm security: `npm audit {package}`
   - Snyk: `https://security.snyk.io/package/npm/{package}`

3. **Web search** for CVE details and fixed versions:
   - Search: `{package} {CVE_ID} fixed version`
   - Search: `{package} {GHSA_ID} fixed version`
   - Check package changelog/release notes

4. **Verify compatibility**:
   - Check if secure version is compatible with current version range
   - Consider breaking changes in major version updates
   - For peer dependencies, ensure the providing package is updated

### 4. Update package.json Files

#### Identify All package.json Files

For monorepos, find all package.json files:
```bash
find . -name "package.json" -not -path "*/node_modules/*" -not -path "*/.git/*"
```

#### Update Strategy

1. **Direct dependencies**: Update version in package.json
2. **Transitive dependencies**: Update parent package that brings in the vulnerable dependency
3. **Workspace dependencies**: Update in root or specific workspace package

#### Update Pattern

For each vulnerable package found in package.json:

```json
// Before
"package-name": "^1.2.3"

// After (if 1.5.0 fixes the vulnerability)
"package-name": "^1.5.0"
```

Use `^` prefix to allow patch/minor updates unless major version is required.

#### Monorepo Considerations

- **pnpm workspaces**: Update in the specific workspace package.json
- **npm workspaces**: Same approach
- **Lerna**: Update in individual package.json files
- **Root dependencies**: Update root package.json if used across workspaces

### 5. Handle Special Cases

#### Multiple Versions of Same Package

If the same package appears in multiple package.json files with different versions:
- Update all instances to the same secure version
- Ensure compatibility across workspaces

#### Peer Dependencies

For peer dependencies, update the package that provides the dependency, not the peer dependency declaration itself.

#### Lock Files

After updating package.json:
- **pnpm**: Run `pnpm install` to update `pnpm-lock.yaml`
- **npm**: Run `npm install` to update `package-lock.json`
- **yarn**: Run `yarn install` to update `yarn.lock`

Note: Some example directories may have separate lock files that need individual updates.

### 6. Verification

After updates:

1. **Check remaining alerts**:
   ```bash
   gh api repos/{owner}/{repo}/dependabot/alerts?state=open
   ```

2. **Run audit**:
   ```bash
   pnpm audit  # or npm audit / yarn audit
   ```

3. **Test build**:
   ```bash
   pnpm run build
   ```

## Implementation

### Using the Script

A Node.js script is provided in `scripts/fetch_and_fix_alerts.mjs` that automates the workflow:

```bash
# Set GitHub token
export GITHUB_TOKEN=your_token_here

# Dry run to see what would be updated
node scripts/fetch_and_fix_alerts.mjs --dry-run

# Actually update packages
node scripts/fetch_and_fix_alerts.mjs

# Or specify repo explicitly
node scripts/fetch_and_fix_alerts.mjs --owner OWNER --repo REPO --token TOKEN
```

The script:
1. Auto-detects repository from git remote
2. Fetches all open Dependabot alerts
3. Finds packages in package.json files
4. Updates versions (uses `first_patched_version` from API when available)
5. Preserves version prefixes (^, ~)

**Requirements**: Node.js 18+ (uses native fetch API, no external dependencies)

### Manual Implementation

If implementing manually or the script needs customization:

```python
# Pseudocode workflow
alerts = fetch_dependabot_alerts(owner, repo, token)
vulnerable_packages = parse_alerts(alerts)

for package in vulnerable_packages:
    secure_version = research_secure_version(package, cve_id)
    package_json_files = find_package_json_with_package(package)
    
    for pkg_json in package_json_files:
        update_package_version(pkg_json, package, secure_version)

run_package_manager_install()
verify_alerts_resolved()
```

## Common Vulnerabilities and Fixes

### Critical/High Priority

- **happy-dom**: Update `vitest` to latest (includes happy-dom@20.0.2+)
- **react-router**: Update to 7.5.2+ for security fixes
- **js-yaml**: Update to 4.1.1+ (prototype pollution fix)
- **@modelcontextprotocol/sdk**: Update to 1.25.2+ (ReDoS fix)
- **langchain**: Update to 1.2.3+ (serialization injection fix)
- **storybook**: Update to 8.6.15+ (environment variable exposure fix)

### Transitive Dependencies

Many vulnerabilities (h3, qs, tar-fs, node-forge, glob, jws, ipx, tar, esbuild, http-proxy-middleware, undici, on-headers, tmp, diff) are transitive and will be resolved when direct dependencies are updated.

## Error Handling

- **API rate limits**: Implement exponential backoff for GitHub API calls
- **Missing GITHUB_TOKEN**: Prompt user to set token or use GitHub CLI authentication
- **Package not found**: Skip and log warning
- **Version conflicts**: Report conflicts and suggest manual resolution
- **Build failures**: Rollback changes if build fails after updates

## Output

After processing, provide a summary listing:
- All alerts processed (grouped by severity)
- Packages updated with old → new versions
- Files modified
- Transitive dependencies that should be resolved automatically
- Remaining alerts (if any that couldn't be auto-fixed)
- Next steps:
  1. Run package manager install: `pnpm install` (or `npm install` / `yarn install`)
  2. Verify with audit: `pnpm audit`
  3. Test build: `pnpm run build`
  4. Check remaining alerts in GitHub

## GitHub API Authentication

The script requires a GitHub token with `security_events` scope:

1. **Create a Personal Access Token**:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Generate new token with `security_events` scope
   - Or use Fine-grained token with "Read Dependabot alerts" permission

2. **Set the token**:
   ```bash
   export GITHUB_TOKEN=your_token_here
   ```

3. **Or use GitHub CLI** (alternative):
   ```bash
   gh auth login
   # Then use: gh api repos/{owner}/{repo}/dependabot/alerts
   ```
