# Environment Variables

This document lists and explains all environment variables recognized by xyd, including system variables for development/production modes and user-defined variables for configuration.

## Overview

xyd supports two categories of environment variables:

1. **System Environment Variables**: Control xyd's runtime behavior (development mode, port, package manager, etc.)
2. **User Environment Variables**: Store API keys, secrets, and configuration values that are substituted into settings files

All variables are loaded from `.env` files during initialization, and user variables can be referenced in configuration using the `$VAR_NAME` syntax.

## System Environment Variables

| Variable | Type | Default | Purpose | Context |
|----------|------|---------|---------|---------|
| `XYD_DEV_MODE` | boolean | undefined | Enables development mode with local module resolution | Development |
| `XYD_PORT` | number | 5175 | Development server port | Development |
| `XYD_NODE_PM` | string | auto-detect | Package manager to use (pnpm, bun, npm) | Build/Dev |
| `XYD_VERBOSE` | boolean | undefined | Enables verbose logging and debug output | Build/Dev |
| `ENABLE_TIMERS` | boolean | undefined | Enables console timing logs | Development |
| `NODE_ENV` | string | varies | Node environment (development, production) | Build |
| `BUN_VERSION` | string | varies | Bun runtime version (deployment) | Production |

### Development Mode Variables

**XYD_DEV_MODE** — Enables development-specific behaviors: changes module resolution strategy for local packages, optimizes different dependency sets for Vite, enables development logging.

**XYD_PORT** — Overrides the default development server port.

**XYD_NODE_PM** — Explicitly sets the package manager when auto-detection is unreliable.

**XYD_VERBOSE** — Enables detailed logging output.

## User Environment Variables

User-defined variables store sensitive data like API keys and deployment-specific configuration values. These are loaded from `.env` files and substituted into settings using the `$VAR_NAME` syntax.

### Common User Variables

| Variable | Example Value | Usage |
|----------|---------------|-------|
| `SUPADEMO_API_KEY` | sk_demo_abc123xyz | Supademo integration API key |
| `LIVESESSION_TRACK_ID` | track_prod_789 | LiveSession analytics tracking ID |
| `DOCS_BASE_URL` | https://docs.example.com | Base URL for SEO configuration |
| `API_SPEC_URL` | https://api.example.com/spec | OpenAPI specification URL |
| `API_BASE_URL` | https://api.example.com/v1 | API base URL for playground |
| `GITHUB_TOKEN` | ghp_xxxxxxxxxxxx | GitHub API token for edit links |

## .env File Loading

Environment variables are loaded from `.env` files during initialization, before configuration processing.

### File Precedence

| Priority | File | Purpose | Version Control |
|----------|------|---------|-----------------|
| 1 (lowest) | `.env` | Base defaults for all environments | Commit |
| 2 | `.env.local` | Local developer overrides | Ignore |
| 3 | `.env.development` | Development-specific values | Commit |
| 4 (highest) | `.env.production` | Production-specific values | Commit |

Files are processed by `loadEnvFiles()` using the `dotenv` package with `override: true`.

### Example .env Configuration

**.env (Base):**
```
DOCS_BASE_URL=https://docs.example.com
API_BASE_URL=https://api.example.com/v1
```

**.env.local (Local development, gitignored):**
```
API_BASE_URL=http://localhost:3001
GITHUB_TOKEN=ghp_local_dev_token
```

**.env.production:**
```
DOCS_BASE_URL=https://production-docs.com
API_SPEC_URL=https://production-api.com/openapi.json
GITHUB_TOKEN=ghp_production_token
```

## Variable Substitution

After loading `.env` files, the `replaceEnvVars()` function recursively processes configuration files, replacing `$VAR_NAME` references with environment variable values.

### Substitution Syntax

| Syntax | Behavior | Example |
|--------|----------|---------|
| `$VAR_NAME` | Replaced with `process.env.VAR_NAME` | `$API_KEY` → `abc123` |
| `$MISSING_VAR` | Left unchanged if undefined | `$MISSING_VAR` → `$MISSING_VAR` |
| `${VAR_NAME}` | Not supported | Use `$VAR_NAME` instead |

### Example Usage

**docs.json:**
```json
{
  "apiBaseUrl": "$API_BASE_URL",
  "integrations": {
    "analytics": {
      "trackId": "$LIVESESSION_TRACK_ID"
    }
  }
}
```

## Deployment Configuration

### Netlify Deployment

```toml
[build]
command = "xyd build"
publish = ".xyd/build/client"

[context.production.environment]
API_BASE_URL = "https://api.example.com/v1"
GITHUB_TOKEN = "ghp_production_token"
```

### CI/CD Environment Variables

```yaml
env:
  API_BASE_URL: https://api.example.com/v1
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Docker Deployment

```bash
docker run -e API_BASE_URL=https://api.example.com \
           -e GITHUB_TOKEN=ghp_token \
           xyd-docs:latest
```

## Environment Variable Flow

**Build-time processing:**

1. Load `.env` files in precedence order
2. Substitute `$VAR_NAME` references in configuration
3. Pass resolved settings to plugins and build system
4. Include values in virtual modules for runtime access
