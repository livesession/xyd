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
    getTree: (owner: string, repo: string, branch: string) =>
      ipcRenderer.invoke('github:get-tree', owner, repo, branch),
    getFile: (owner: string, repo: string, path: string) =>
      ipcRenderer.invoke('github:get-file', owner, repo, path),
    getCommits: (owner: string, repo: string, limit?: number) =>
      ipcRenderer.invoke('github:get-commits', owner, repo, limit),
  },
  editor: {
    compileMarkdown: (markdown: string, fileName: string) =>
      ipcRenderer.invoke('editor:compile-markdown', markdown, fileName),
  },
});
