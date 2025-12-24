import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { type FileNode } from '../data/editorData';
import { transformGitHubTreeToFileNodes } from '../utils/githubTreeUtils';

interface ProjectContextType {
  currentRepository: GitHubRepository | null;
  setCurrentRepository: (repo: GitHubRepository | null) => void;
  branches: string[];
  currentBranch: string | null;
  setCurrentBranch: (branch: string) => void;
  fileTree: FileNode[];
  fileContents: Record<string, string>;
  originalContents: Record<string, string>;
  modifiedFiles: string[];
  setFileContent: (path: string, content: string) => void;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncProgress: string | null;
  refreshRepository: () => Promise<void>;
  syncRepository: () => Promise<void>;
  loadFileContent: (path: string) => Promise<string | null>;
  isPublishing: boolean;
  publishChanges: (message: string) => Promise<{ success: boolean; error?: string }>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentRepository, setCurrentRepository] = useState<GitHubRepository | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [originalContents, setOriginalContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);
  const [remoteModifiedFiles, setRemoteModifiedFiles] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const modifiedFiles = useMemo(() => {
    const allModifiedPaths = new Set<string>(remoteModifiedFiles);

    // If we have loaded the file, the session comparison is the ultimate source of truth
    Object.keys(fileContents).forEach(path => {
      const current = fileContents[path]?.replace(/\r\n/g, '\n') || '';
      const original = originalContents[path]?.replace(/\r\n/g, '\n');

      if (original !== undefined) {
        if (current !== original) {
          allModifiedPaths.add(path);
        } else {
          // If they are equal, it might be because:
          // 1. It was never modified (but get-modified-files said it was? unlikely unless cache is stale)
          // 2. The user reverted changes to match the base version.
          // 3. We only have the placeholder "original" (which matches current).

          // To be safe, if get-modified-files thought it was modified, 
          // we only remove it if we are sure we have a "real" diff comparison.
          // For now, let's trust the session if it's specifically loaded.
          allModifiedPaths.delete(path);
        }
      }
    });

    return Array.from(allModifiedPaths);
  }, [fileContents, originalContents, remoteModifiedFiles]);

  const fetchBranches = async () => {
    if (!currentRepository) return;
    const result = await window.electronAPI.github.getBranches(
      currentRepository.owner.login,
      currentRepository.name
    );
    if (result.success && result.branches) {
      setBranches(result.branches);
    }
  };

  const refreshRepository = async () => {
    if (!currentRepository || !currentBranch) return;

    setLoading(true);
    setError(null);

    try {
      // Then load the tree
      const result = await window.electronAPI.github.getTree(
        currentRepository.owner.login,
        currentRepository.name,
        currentBranch
      );

      if (result.success && result.data) {
        const tree = transformGitHubTreeToFileNodes(result.data.tree);
        setFileTree(tree);

        // Scan for modified files on load/refresh
        const modifiedResult = await window.electronAPI.github.getModifiedFiles(
          currentRepository.owner.login,
          currentRepository.name,
          currentBranch
        );
        if (modifiedResult.success && modifiedResult.modifiedFiles) {
          console.log('[ProjectContext] Detected remote modified files:', modifiedResult.modifiedFiles);
          setRemoteModifiedFiles(modifiedResult.modifiedFiles);

          // Pre-load content for all modified files so diffs are ready immediately
          modifiedResult.modifiedFiles.forEach(path => {
            console.log(`[ProjectContext] Pre-loading modified file: ${path}`);
            loadFileContent(path).catch(err => {
              console.error(`[ProjectContext] Failed to pre-load ${path}:`, err);
            });
          });
        } else if (!modifiedResult.success) {
          console.error('[ProjectContext] Failed to get modified files:', modifiedResult.error);
        }
      } else {
        setError(result.error || 'Failed to load repository');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const syncRepository = async () => {
    if (!currentRepository || !currentBranch) return;

    try {
      setSyncing(true);
      setSyncProgress('Syncing repository files...');

      const syncResult = await window.electronAPI.github.syncRepository(
        currentRepository.owner.login,
        currentRepository.name,
        currentBranch
      );

      if (syncResult.success) {
        setSyncProgress(`Synced ${syncResult.syncedCount}/${syncResult.totalFiles} files`);
        // Reset original index to force a re-scan against the new base, 
        // but KEEP fileContents to preserve unsaved editor state.
        setOriginalContents({});
        setRemoteModifiedFiles([]);
        await refreshRepository();
      } else {
        console.error('Failed to sync repository:', syncResult.error);
        setError(syncResult.error || 'Failed to sync repository');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSyncing(false);
      setSyncProgress(null);
    }
  };

  const loadFileContent = async (path: string): Promise<string | null> => {
    if (!currentRepository) return null;

    // Check if already loaded
    if (fileContents[path]) {
      return fileContents[path];
    }

    try {
      const result = await window.electronAPI.github.getFile(
        currentRepository.owner.login,
        currentRepository.name,
        path
      );

      // Fetch base content for diffing (persistent git diff)
      if (originalContents[path] === undefined) {
        window.electronAPI.github.getBaseFile(
          currentRepository.owner.login,
          currentRepository.name,
          path,
          currentBranch || currentRepository.default_branch
        ).then(baseResult => {
          if (baseResult.success && baseResult.content !== undefined) {
            setOriginalContents(prev => ({ ...prev, [path]: baseResult.content! }));
          } else {
            // If getBaseFile fails, it's likely a NEW file.
            // We should treat its original content as empty so it shows as an addition.
            setOriginalContents(prev => ({ ...prev, [path]: '' }));
          }
        });
      }

      if (result.success && result.content !== undefined) {
        setFileContents(prev => ({ ...prev, [path]: result.content! }));

        return result.content;
      } else {
        console.error('Failed to load file:', result.error);
        return null;
      }
    } catch (err) {
      console.error('Failed to load file:', err);
      return null;
    }
  };

  const setFileContent = (path: string, content: string) => {
    setFileContents(prev => ({ ...prev, [path]: content }));

    // Save to local synced storage
    if (currentRepository) {
      window.electronAPI.github.saveFile(
        currentRepository.owner.login,
        currentRepository.name,
        path,
        content
      ).catch(err => {
        console.error('Failed to save file to local storage:', err);
      });
    }
  };

  const publishChanges = async (message: string) => {
    if (!currentRepository || !currentBranch) return { success: false, error: 'No repository selected' };

    setIsPublishing(true);
    try {
      const result = await window.electronAPI.github.publishChanges(
        currentRepository.owner.login,
        currentRepository.name,
        currentBranch,
        message
      );

      if (result.success) {
        // Sync to update base files and clear modified state
        await syncRepository();
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (err) {
      return { success: false, error: (err as Error).message };
    } finally {
      setIsPublishing(false);
    }
  };

  useEffect(() => {
    if (currentRepository) {
      // Reset caches when switching repositories to avoid showing stale files/settings
      setFileTree([]);
      setFileContents({});
      setOriginalContents({});
      setRemoteModifiedFiles([]);
      setBranches([]);
      setCurrentBranch(currentRepository.default_branch);
      fetchBranches();
    } else {
      setFileTree([]);
      setFileContents({});
      setOriginalContents({});
      setBranches([]);
      setCurrentBranch(null);
    }
  }, [currentRepository]);

  useEffect(() => {
    if (currentRepository && currentBranch) {
      refreshRepository();
    }
  }, [currentBranch, currentRepository]);

  // Load first connected repository by default
  useEffect(() => {
    const loadDefaultRepository = async () => {
      try {
        const result = await window.electronAPI.repositories.getConnected();
        if (result.success && result.repositories && result.repositories.length > 0) {
          setCurrentRepository(result.repositories[0]);
        }
      } catch (err) {
        console.error('Failed to load connected repositories:', err);
      }
    };

    loadDefaultRepository();
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        currentRepository,
        setCurrentRepository,
        branches,
        currentBranch,
        setCurrentBranch,
        fileTree,
        fileContents,
        originalContents,
        modifiedFiles,
        setFileContent,
        loading,
        error,
        syncing,
        syncProgress,
        refreshRepository,
        syncRepository,
        loadFileContent,
        isPublishing,
        publishChanges,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
