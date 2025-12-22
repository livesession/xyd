declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

interface GitHubTokenAPI {
  save: (token: string) => Promise<{ success: boolean; error?: string }>;
  get: () => Promise<{ success: boolean; token?: string | null; error?: string }>;
  delete: () => Promise<{ success: boolean; error?: string }>;
}

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: {
    login: string;
    avatar_url: string;
  };
  description: string | null;
  private: boolean;
  html_url: string;
  default_branch: string;
}

interface RepositoriesAPI {
  getConnected: () => Promise<{ success: boolean; repositories?: GitHubRepository[]; error?: string }>;
  connect: (repository: GitHubRepository) => Promise<{ success: boolean; repositories?: GitHubRepository[]; error?: string }>;
  disconnect: (repositoryId: number) => Promise<{ success: boolean; repositories?: GitHubRepository[]; error?: string }>;
}

interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

interface GitHubAPI {
  getBranches(owner: string, repo: string): Promise<{ success: boolean; branches?: string[]; error?: string }>;
  getTree: (owner: string, repo: string, branch: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getFile: (owner: string, repo: string, path: string) => Promise<{ success: boolean; content?: string; fromLocal?: boolean; error?: string }>;
  getBaseFile: (owner: string, repo: string, path: string, branch: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  saveFile: (owner: string, repo: string, path: string, content: string) => Promise<{ success: boolean; error?: string }>;
  getSyncedRepoPath: (owner: string, repo: string) => Promise<{ success: boolean; path?: string; error?: string }>;
  syncRepository: (owner: string, repo: string, branch: string) => Promise<{ success: boolean; syncedCount?: number; failedCount?: number; totalFiles?: number; error?: string }>;
  getCommits: (owner: string, repo: string, limit?: number) => Promise<{ success: boolean; commits?: GitHubCommit[]; error?: string }>;
  getModifiedFiles: (owner: string, repo: string, branch: string) => Promise<{ success: boolean; modifiedFiles?: string[]; error?: string }>;
}

interface EditorAPI {
  compileMarkdown: (markdown: string, fileName: string) => Promise<{ success: boolean; compiledContent?: string; error?: string }>;
}

interface XydAPI {
  startServer: (owner: string, repo: string) => Promise<{ success: boolean; port?: number; url?: string; error?: string }>;
  stopServer: () => Promise<{ success: boolean; message?: string; error?: string }>;
  getServerStatus: () => Promise<{ success: boolean; running: boolean; port?: number | null; url?: string | null }>;
}

interface ElectronAPI {
  githubToken: GitHubTokenAPI;
  repositories: RepositoriesAPI;
  github: GitHubAPI;
  editor: EditorAPI;
  xyd: XydAPI;
}

interface Window {
  electronAPI: ElectronAPI;
}
