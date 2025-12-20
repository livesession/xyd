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
  getTree: (owner: string, repo: string, branch: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  getFile: (owner: string, repo: string, path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
  getCommits: (owner: string, repo: string, limit?: number) => Promise<{ success: boolean; commits?: GitHubCommit[]; error?: string }>;
}

interface EditorAPI {
  compileMarkdown: (markdown: string, fileName: string) => Promise<{ success: boolean; compiledContent?: string; error?: string }>;
}

interface ElectronAPI {
  githubToken: GitHubTokenAPI;
  repositories: RepositoriesAPI;
  github: GitHubAPI;
  editor: EditorAPI;
}

interface Window {
  electronAPI: ElectronAPI;
}
