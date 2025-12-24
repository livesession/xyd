// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from 'electron';

// Expose GitHub token and repository APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  githubToken: {
    save: (token: string) => ipcRenderer.invoke('github-token:save', token),
    get: () => ipcRenderer.invoke('github-token:get'),
    delete: () => ipcRenderer.invoke('github-token:delete'),
  },
  repositories: {
    getConnected: () => ipcRenderer.invoke('repositories:get-connected'),
    connect: (repository: any) => ipcRenderer.invoke('repositories:connect', repository),
    disconnect: (repositoryId: number) => ipcRenderer.invoke('repositories:disconnect', repositoryId),
  },
  github: {
    getBranches: (owner: string, repo: string) =>
      ipcRenderer.invoke('github:get-branches', owner, repo),
    getTree: (owner: string, repo: string, branch: string) =>
      ipcRenderer.invoke('github:get-tree', owner, repo, branch),
    getFile: (owner: string, repo: string, path: string) =>
      ipcRenderer.invoke('github:get-file', owner, repo, path),
    getBaseFile: (owner: string, repo: string, path: string, branch: string) =>
      ipcRenderer.invoke('github:get-base-file', owner, repo, path, branch),
    saveFile: (owner: string, repo: string, path: string, content: string) =>
      ipcRenderer.invoke('github:save-file', owner, repo, path, content),
    getSyncedRepoPath: (owner: string, repo: string) =>
      ipcRenderer.invoke('github:get-synced-repo-path', owner, repo),
    syncRepository: (owner: string, repo: string, branch: string) =>
      ipcRenderer.invoke('github:sync-repository', owner, repo, branch),
    getCommits: (owner: string, repo: string, limit?: number) =>
      ipcRenderer.invoke('github:get-commits', owner, repo, limit),
    getModifiedFiles: (owner: string, repo: string, branch: string) =>
      ipcRenderer.invoke('github:get-modified-files', owner, repo, branch),
    publishChanges: (owner: string, repo: string, branch: string, message: string) =>
      ipcRenderer.invoke('github:publish-changes', owner, repo, branch, message),
  },
  editor: {
    compileMarkdown: (markdown: string, fileName: string) =>
      ipcRenderer.invoke('editor:compile-markdown', markdown, fileName),
  },
  xyd: {
    startServer: (owner: string, repo: string) =>
      ipcRenderer.invoke('xyd:start-server', owner, repo),
    stopServer: () =>
      ipcRenderer.invoke('xyd:stop-server'),
    getServerStatus: () =>
      ipcRenderer.invoke('xyd:get-server-status'),
  },
  openvsx: {
    fetch: (url: string) =>
      ipcRenderer.invoke('openvsx:fetch', url),
    fetchAndCompileReadme: (namespace: string, extensionName: string, version: string) =>
      ipcRenderer.invoke('openvsx:fetch-and-compile-readme', namespace, extensionName, version),
  },
});
