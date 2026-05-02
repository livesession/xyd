# Electron Architecture

## Three-Process Architecture

**Main Process**: 26 IPC handlers for GitHub, file management, server control. Token encryption via platform keychain or AES-256-GCM fallback.

**Preload Script**: contextBridge exposing githubToken, repositories, github, editor, xyd, openvsx APIs.

**Renderer Process**: React app with ProjectContext, Editor component, all communication via window.electronAPI.

## File System

- Working copy: `userData/synced-repos/{owner}/{repo}/`
- Remote baseline: `userData/synced-repos-base/{owner}/{repo}/{branch}/`

## Security

Context isolation enforced. Two-tier token encryption. ASAR unpacking for xyd CLI.

## Build

Electron Forge: macOS ZIP, Windows Squirrel, Linux DEB/RPM.
