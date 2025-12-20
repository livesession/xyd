import { Github, Search, Loader2, AlertCircle, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function RepositorySettings() {
  const [token, setToken] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepository[]>([]);
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTokenAndConnectedRepos();
  }, []);

  const loadTokenAndConnectedRepos = async () => {
    try {
      const tokenResult = await window.electronAPI.githubToken.get();
      if (tokenResult.success && tokenResult.token) {
        setToken(tokenResult.token);
      }

      const reposResult = await window.electronAPI.repositories.getConnected();
      if (reposResult.success && reposResult.repositories) {
        setConnectedRepos(reposResult.repositories);
      }
    } catch (error) {
      console.error('Failed to load token and connected repos:', error);
    }
  };

  const fetchRepositories = async () => {
    if (!token) {
      setError('Please configure your GitHub token first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      setRepositories(data);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
      setError((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repo: GitHubRepository) => {
    try {
      const result = await window.electronAPI.repositories.connect(repo);
      if (result.success && result.repositories) {
        setConnectedRepos(result.repositories);
      }
    } catch (error) {
      console.error('Failed to connect repository:', error);
    }
  };

  const handleDisconnect = async (repoId: number) => {
    try {
      const result = await window.electronAPI.repositories.disconnect(repoId);
      if (result.success && result.repositories) {
        setConnectedRepos(result.repositories);
      }
    } catch (error) {
      console.error('Failed to disconnect repository:', error);
    }
  };

  const isConnected = (repoId: number) => {
    return connectedRepos.some(r => r.id === repoId);
  };

  const filteredRepositories = repositories.filter(repo =>
    repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Repository</h2>

      <div className="space-y-8">
        {/* Connected Repositories Section */}
        {connectedRepos.length > 0 && (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900">Connected Repositories</label>
              <p className="text-xs text-gray-500 mt-1">Repositories managed by this app</p>
            </div>

            <div className="space-y-2">
              {connectedRepos.map(repo => (
                <div key={repo.id} className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-10 h-10 rounded flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{repo.full_name}</div>
                      {repo.description && (
                        <div className="text-xs text-gray-500 truncate mt-0.5">{repo.description}</div>
                      )}
                    </div>
                    <button
                      onClick={() => handleDisconnect(repo.id)}
                      className="flex-shrink-0 text-xs text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connect Repository Section */}
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900">Connect Repository</label>
            <p className="text-xs text-gray-500 mt-1">Connect your GitHub repositories to this app</p>
          </div>

          <div className="space-y-4">
            {!token ? (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-yellow-800 font-medium">GitHub Token Required</p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please configure your GitHub Personal Access Token in the GitHub App settings first.
                  </p>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={fetchRepositories}
                  disabled={loading}
                  className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading Repositories...
                    </>
                  ) : (
                    <>
                      <Github className="w-4 h-4" />
                      Load Repositories from GitHub
                    </>
                  )}
                </button>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
                    <X className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 min-w-0">{error}</span>
                  </div>
                )}

                {repositories.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search repositories..."
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="max-h-96 overflow-y-auto">
                        {filteredRepositories.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-8">No repositories found</p>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filteredRepositories.map(repo => {
                              const connected = isConnected(repo.id);
                              return (
                                <div
                                  key={repo.id}
                                  className={`p-3 transition-colors ${
                                    connected
                                      ? 'bg-green-50'
                                      : 'bg-white hover:bg-gray-50'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <img
                                      src={repo.owner.avatar_url}
                                      alt={repo.owner.login}
                                      className="w-10 h-10 rounded flex-shrink-0"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-gray-900 truncate">{repo.full_name}</div>
                                      {repo.description && (
                                        <div className="text-xs text-gray-500 truncate mt-0.5">{repo.description}</div>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => connected ? handleDisconnect(repo.id) : handleConnect(repo)}
                                      className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap ${
                                        connected
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                          : 'bg-blue-600 text-white hover:bg-blue-700'
                                      }`}
                                    >
                                      {connected ? (
                                        <span className="flex items-center gap-1">
                                          <Check className="w-3 h-3" />
                                          Connected
                                        </span>
                                      ) : (
                                        'Connect'
                                      )}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
