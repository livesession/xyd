# Development Server

Vite-based dev server with HMR, file watching, and live preview.

## Starting

`xyd dev` or `xyd`. Port configurable via `XYD_PORT` (default 5175).

## File Watching

- Markdown/MDX → HMR
- Configuration → Page reload
- API specs → Regenerate API docs
- Icon files → Update references

## Features

- Hot Module Replacement
- Live Preview
- Error Recovery
- Virtual Modules access

## Custom Vite Configuration

The dev server's Vite config can be customized via `advanced.vite` in `docs.json` or `docs.ts`. The user config is merged on top of xyd's internal config using Vite's `mergeConfig`.

```json
{
  "advanced": {
    "vite": {
      "server": {
        "allowedHosts": ["my-remote-env.example.com"],
        "port": 4000
      }
    }
  }
}
```

Common use cases:
- `server.allowedHosts` — allow access from remote dev environments (e.g., code-server)
- `server.port` — override the default port
- `resolve.alias` — add custom import aliases
- `define` — inject compile-time constants
