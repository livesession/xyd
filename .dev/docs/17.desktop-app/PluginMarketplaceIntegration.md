# Plugin Marketplace Integration

OpenVSX Registry integration for plugin discovery in the desktop app.

## Architecture

Renderer → IPC → Main Process HTTPS proxy to open-vsx.org.

## Endpoints

| Endpoint | Purpose |
|----------|---------|
| `/api/-/query` | Search extensions |
| `/api/{ns}/{ext}` | Get metadata |
| `/api/{ns}/{ext}/{ver}/file/{path}` | Download files |

## Features

- Nine categories (AI, Analytics, Automation, etc.)
- Text search with parallel count fetching
- README compilation via MDX pipeline
- Dev mode gating for full marketplace access

## Security

Context isolation, hardcoded hostname, controlled MDX compilation in main process.
