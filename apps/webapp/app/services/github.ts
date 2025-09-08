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
}

export const githubService = GitHubService.getInstance();
