// GitHub API service for organization integration

export interface GitHubOrganization {
  id: number;
  login: string;
  name?: string;
  description?: string;
  avatar_url: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  private: boolean;
  default_branch: string;
  html_url: string;
}

export interface GitHubBranch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface GitHubFile {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string; // Base64 encoded content for files
  encoding?: string;
}

export interface GitHubTreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export class GitHubService {
  private static instance: GitHubService;

  private constructor() {}

  static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService();
    }
    return GitHubService.instance;
  }

  /**
   * Get GitHub OAuth URL for organization setup
   */
  getOAuthUrl(): string {
    const clientId = process.env.GITHUB_GIT_APP_CLIENT_ID;
    const redirectUri = `${process.env.BASE_URL || 'http://localhost:5173'}/api/github/callback`;
    
    const params = new URLSearchParams({
      client_id: clientId!,
      redirect_uri: redirectUri,
      scope: 'read:org repo', 
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string): Promise<string> {
    const clientId = process.env.GITHUB_GIT_APP_CLIENT_ID;
    const clientSecret = process.env.GITHUB_GIT_APP_CLIENT_SECRET;

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error_description || data.error);
    }

    return data.access_token;
  }

  /**
   * Get user's GitHub organizations
   */
  async getUserOrganizations(accessToken: string): Promise<GitHubOrganization[]> {
    const response = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub organizations');
    }

    return await response.json();
  }

  /**
   * Get repositories for a GitHub organization
   */
  async getOrganizationRepositories(accessToken: string, orgLogin: string): Promise<GitHubRepository[]> {
    const response = await fetch(`https://api.github.com/orgs/${orgLogin}/repos`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch organization repositories');
    }

    return await response.json();
  }

  /**
   * Get branches for a repository
   */
  async getRepositoryBranches(accessToken: string, owner: string, repo: string): Promise<GitHubBranch[]> {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch repository branches');
    }

    return await response.json();
  }

  /**
   * Get user's GitHub profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub profile');
    }

    return await response.json();
  }

  /**
   * Get repository contents (files and directories)
   */
  async getRepositoryContents(
    accessToken: string, 
    owner: string, 
    repo: string, 
    path: string = '', 
    branch: string = 'main'
  ): Promise<GitHubFile[]> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch repository contents: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get a specific file content
   */
  async getFileContent(
    accessToken: string, 
    owner: string, 
    repo: string, 
    path: string, 
    branch: string = 'main'
  ): Promise<string> {
    const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch file content: ${response.statusText}`);
    }

    const fileData = await response.json();
    
    if (fileData.type !== 'file' || !fileData.content) {
      throw new Error('Path does not point to a file or file has no content');
    }

    // Decode base64 content
    return Buffer.from(fileData.content, 'base64').toString('utf-8');
  }

  /**
   * Get repository tree recursively
   */
  async getRepositoryTree(
    accessToken: string, 
    owner: string, 
    repo: string, 
    branch: string = 'main'
  ): Promise<GitHubTreeItem[]> {
    // First get the branch info to get the tree SHA
    const branchResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!branchResponse.ok) {
      throw new Error(`Failed to fetch branch info: ${branchResponse.statusText}`);
    }

    const branchData = await branchResponse.json();
    const treeSha = branchData.commit.commit.tree.sha;

    // Get the tree recursively
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${treeSha}?recursive=1`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    if (!treeResponse.ok) {
      throw new Error(`Failed to fetch repository tree: ${treeResponse.statusText}`);
    }

    const treeData = await treeResponse.json();
    return treeData.tree;
  }
}

export const githubService = GitHubService.getInstance();
