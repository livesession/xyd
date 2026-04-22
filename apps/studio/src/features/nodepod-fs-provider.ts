import {
  FileType,
  FileChangeType,
  FileSystemProviderCapabilities,
  FileSystemProviderError,
  FileSystemProviderErrorCode,
  type IFileSystemProviderWithFileReadWriteCapability,
  type IStat,
  type IWatchOptions,
  type IFileWriteOptions,
  type IFileDeleteOptions,
  type IFileOverwriteOptions,
  type IFileChange,
  registerFileSystemOverlay,
} from '@codingame/monaco-vscode-files-service-override'
import { Emitter, Event } from '@codingame/monaco-vscode-api/vscode/vs/base/common/event'
import { Disposable } from '@codingame/monaco-vscode-api/vscode/vs/base/common/lifecycle'
import { URI } from '@codingame/monaco-vscode-api/vscode/vs/base/common/uri'
import type { Nodepod } from '@scelar/nodepod'

type NodepodInstance = Awaited<ReturnType<typeof Nodepod.boot>>

/**
 * A filesystem provider that delegates to Nodepod's in-memory filesystem.
 * This ensures VS Code's file explorer and Nodepod's terminal share the same files.
 */
export class NodepodFileSystemProvider
  extends Disposable
  implements IFileSystemProviderWithFileReadWriteCapability
{
  private pod: NodepodInstance
  private pollInterval: ReturnType<typeof setInterval> | null = null
  private lastSnapshot = new Map<string, { size: number; mtime: number }>()

  readonly onDidChangeCapabilities = Event.None
  private _onDidChangeFile = new Emitter<readonly IFileChange[]>()
  readonly onDidChangeFile = this._onDidChangeFile.event

  capabilities =
    FileSystemProviderCapabilities.FileReadWrite |
    FileSystemProviderCapabilities.PathCaseSensitive

  constructor(pod: NodepodInstance) {
    super()
    this.pod = pod
    this.startWatching()
  }

  // Poll Nodepod's filesystem for changes and fire events to VS Code
  private startWatching() {
    this.pollInterval = setInterval(async () => {
      try {
        const changes = await this.detectChanges('/')
        if (changes.length > 0) {
          this._onDidChangeFile.fire(changes)
        }
      } catch {
        // ignore polling errors
      }
    }, 1000)
  }

  private async detectChanges(dir: string): Promise<IFileChange[]> {
    const changes: IFileChange[] = []
    const currentPaths = new Set<string>()

    await this.walkDir(dir, currentPaths, changes)

    // Detect deletions
    for (const [path] of this.lastSnapshot) {
      if (!currentPaths.has(path)) {
        changes.push({
          type: FileChangeType.DELETED,
          resource: URI.file(path),
        })
        this.lastSnapshot.delete(path)
      }
    }

    return changes
  }

  private async walkDir(
    dir: string,
    currentPaths: Set<string>,
    changes: IFileChange[]
  ): Promise<void> {
    try {
      const entries = await this.pod.fs.readdir(dir)
      for (const entry of entries) {
        const fullPath = dir === '/' ? `/${entry}` : `${dir}/${entry}`

        // Skip node_modules and hidden dirs
        if (entry === 'node_modules' || entry === '.git') continue

        currentPaths.add(fullPath)

        try {
          const stat = await this.pod.fs.stat(fullPath)

          if (stat.isDirectory) {
            await this.walkDir(fullPath, currentPaths, changes)
          } else {
            const prev = this.lastSnapshot.get(fullPath)
            if (!prev) {
              changes.push({
                type: FileChangeType.ADDED,
                resource: URI.file(fullPath),
              })
            } else if (prev.mtime !== stat.mtime || prev.size !== stat.size) {
              changes.push({
                type: FileChangeType.UPDATED,
                resource: URI.file(fullPath),
              })
            }
            this.lastSnapshot.set(fullPath, {
              size: stat.size,
              mtime: stat.mtime,
            })
          }
        } catch {
          // skip entries we can't stat
        }
      }
    } catch {
      // dir doesn't exist or can't be read
    }
  }

  async stat(resource: URI): Promise<IStat> {
    const path = resource.path
    try {
      const s = await this.pod.fs.stat(path)
      return {
        type: s.isDirectory ? FileType.Directory : FileType.File,
        ctime: s.mtime ?? Date.now(),
        mtime: s.mtime ?? Date.now(),
        size: s.size ?? 0,
      }
    } catch {
      throw FileSystemProviderError.create(
        `File not found: ${path}`,
        FileSystemProviderErrorCode.FileNotFound
      )
    }
  }

  async readFile(resource: URI): Promise<Uint8Array> {
    const content = await this.pod.fs.readFile(resource.path, 'utf8')
    return new TextEncoder().encode(content as string)
  }

  async writeFile(
    resource: URI,
    content: Uint8Array,
    _opts: IFileWriteOptions
  ): Promise<void> {
    const path = resource.path
    const dir = path.substring(0, path.lastIndexOf('/'))
    if (dir && dir !== '/') {
      try {
        await this.pod.fs.mkdir(dir, { recursive: true })
      } catch {
        // dir might already exist
      }
    }
    await this.pod.fs.writeFile(path, new TextDecoder().decode(content))
    this._onDidChangeFile.fire([
      { type: FileChangeType.UPDATED, resource },
    ])
  }

  async readdir(resource: URI): Promise<[string, FileType][]> {
    const entries = await this.pod.fs.readdir(resource.path)
    const result: [string, FileType][] = []
    for (const entry of entries) {
      const fullPath =
        resource.path === '/' ? `/${entry}` : `${resource.path}/${entry}`
      try {
        const s = await this.pod.fs.stat(fullPath)
        result.push([
          entry as string,
          s.isDirectory ? FileType.Directory : FileType.File,
        ])
      } catch {
        result.push([entry as string, FileType.File])
      }
    }
    return result
  }

  async mkdir(resource: URI): Promise<void> {
    await this.pod.fs.mkdir(resource.path, { recursive: true })
    this._onDidChangeFile.fire([
      { type: FileChangeType.ADDED, resource },
    ])
  }

  async delete(resource: URI, _opts: IFileDeleteOptions): Promise<void> {
    await this.pod.fs.rm(resource.path)
    this._onDidChangeFile.fire([
      { type: FileChangeType.DELETED, resource },
    ])
    this.lastSnapshot.delete(resource.path)
  }

  async rename(
    from: URI,
    to: URI,
    _opts: IFileOverwriteOptions
  ): Promise<void> {
    const content = await this.pod.fs.readFile(from.path, 'utf8')
    await this.pod.fs.writeFile(to.path, content as string)
    await this.pod.fs.rm(from.path)
    this._onDidChangeFile.fire([
      { type: FileChangeType.DELETED, resource: from },
      { type: FileChangeType.ADDED, resource: to },
    ])
  }

  watch(): { dispose(): void } {
    // Polling handles watching
    return { dispose() {} }
  }

  override dispose() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval)
      this.pollInterval = null
    }
    this._onDidChangeFile.dispose()
    super.dispose()
  }
}

export function registerNodepodFileSystem(pod: NodepodInstance) {
  const provider = new NodepodFileSystemProvider(pod)
  return registerFileSystemOverlay(1, provider)
}
