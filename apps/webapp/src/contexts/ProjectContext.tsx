import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { type FileNode } from '../data/editorData';
import { transformGitHubTreeToFileNodes } from '../utils/githubTreeUtils';

interface ProjectContextType {
  currentRepository: GitHubRepository | null;
  setCurrentRepository: (repo: GitHubRepository | null) => void;
  fileTree: FileNode[];
  fileContents: Record<string, string>;
  setFileContent: (path: string, content: string) => void;
  loading: boolean;
  error: string | null;
  syncing: boolean;
  syncProgress: string | null;
  refreshRepository: () => Promise<void>;
  syncRepository: () => Promise<void>;
  loadFileContent: (path: string) => Promise<string | null>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [currentRepository, setCurrentRepository] = useState<GitHubRepository | null>(null);
  const [fileTree, setFileTree] = useState<FileNode[]>([]);
  const [fileContents, setFileContents] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<string | null>(null);

  const refreshRepository = async () => {
    if (!currentRepository) return;

    setLoading(true);
    setError(null);

    try {
      // Then load the tree
      const result = await window.electronAPI.github.getTree(
        currentRepository.owner.login,
        currentRepository.name,
        currentRepository.default_branch
      );

      if (result.success && result.data) {
        const tree = transformGitHubTreeToFileNodes(result.data.tree);
        setFileTree(tree);
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
    if (!currentRepository) return;

    try {
      setSyncing(true);
      setSyncProgress('Syncing repository files...');

      const syncResult = await window.electronAPI.github.syncRepository(
        currentRepository.owner.login,
        currentRepository.name,
        currentRepository.default_branch
      );

      if (syncResult.success) {
        setSyncProgress(`Synced ${syncResult.syncedCount}/${syncResult.totalFiles} files`);
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

      if (result.success && result.content) {
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

  useEffect(() => {
    if (currentRepository) {
      refreshRepository();
    } else {
      setFileTree([]);
      setFileContents({});
    }
  }, [currentRepository]);

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
        fileTree,
        fileContents,
        setFileContent,
        loading,
        error,
        syncing,
        syncProgress,
        refreshRepository,
        syncRepository,
        loadFileContent,
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
