# Desktop Application

Electron-based GUI for editing documentation with GitHub integration.

## Structure

`apps/webapp/` — Electron Forge. Main process, preload, React renderer.

## Editing Modes

| Mode | Description |
|------|-------------|
| Code | Monaco editor |
| Render | BlockNote WYSIWYG |
| Diff | Side-by-side comparison |
| Site | Live preview via xyd dev server |

## GitHub Integration

PAT authentication, file sync, modified file detection, commit and push via REST API.

## Plugin Marketplace

OpenVSX integration for extension discovery.

## Packaging

macOS (.dmg), Linux (.deb/.rpm), Windows (.exe/.msi).
