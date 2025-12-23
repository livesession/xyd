import {
  Github,
  ExternalLink,
  GitCommitVertical,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useProject } from "../contexts/ProjectContext";
import { Link } from "react-router-dom";

export function Dashboard() {
  const { currentRepository, setCurrentRepository } = useProject();
  const [hasGitHubToken, setHasGitHubToken] = useState(true);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const result = await window.electronAPI.githubToken.get();
        setHasGitHubToken(result.success && !!result.token);
      } catch (error) {
        console.error("Failed to check GitHub token:", error);
        setHasGitHubToken(false);
      }
    };

    checkToken();
  }, []);

  // Load connected repositories
  useEffect(() => {
    const loadConnectedRepos = async () => {
      try {
        const result = await window.electronAPI.repositories.getConnected();
        if (result.success && result.repositories) {
          setConnectedRepos(result.repositories);
        }
      } catch (error) {
        console.error("Failed to load connected repositories:", error);
      }
    };
    loadConnectedRepos();
  }, []);

  // Load commits when repository changes
  useEffect(() => {
    const loadCommits = async () => {
      if (!currentRepository) return;

      setLoadingCommits(true);
      try {
        const result = await window.electronAPI.github.getCommits(
          currentRepository.owner.login,
          currentRepository.name,
          5
        );
        if (result.success && result.commits) {
          setCommits(result.commits);
        }
      } catch (error) {
        console.error("Failed to load commits:", error);
      } finally {
        setLoadingCommits(false);
      }
    };

    loadCommits();
  }, [currentRepository]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-10">
      {/* Sync Banner - Only show if no GitHub token is configured */}
      {!hasGitHubToken && (
        <div className="bg-[#FFF6ED] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex gap-4">
            <div className="mt-1">
              <GitCommitVertical className="w-5 h-5 text-orange-900" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                Sync with Git App
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                You can sync with your git repo and enable two-way sync and auto
                documentation updates.
              </p>
            </div>
          </div>
          <Link
            to="/settings/github-app"
            className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap"
          >
            <Github className="w-4 h-4" />
            Sync with GitHub
          </Link>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-500 font-light">
          Overview of your documentation project.
        </p>
      </div>

      {/* Repository Information */}
      {currentRepository ? (
        <div className="space-y-6">
          {/* Repository Header with Selector */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-gray-700"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
              </svg>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {currentRepository.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {currentRepository.full_name}
                </p>
              </div>
            </div>

            {/* Repository Selector */}
            {connectedRepos.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                  </svg>
                  <span className="truncate max-w-[120px]">
                    {currentRepository?.name || "Select repo"}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {showRepoDropdown && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowRepoDropdown(false)}
                    />
                    <div className="absolute top-full mt-1 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                      {connectedRepos.map((repo) => (
                        <button
                          key={repo.id}
                          onClick={() => {
                            setCurrentRepository(repo);
                            setShowRepoDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${
                            currentRepository?.id === repo.id
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-700"
                          }`}
                        >
                          <div className="font-medium truncate">
                            {repo.name}
                          </div>
                          <div className="text-gray-500 truncate text-[10px]">
                            {repo.full_name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Repository Details */}
          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
            <div>
              <div className="text-sm text-gray-500 mb-1">Repository URL</div>
              <a
                href={currentRepository.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {currentRepository.html_url}
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {currentRepository.description && (
              <div>
                <div className="text-sm text-gray-500 mb-1">Description</div>
                <p className="text-sm text-gray-900">
                  {currentRepository.description}
                </p>
              </div>
            )}

            <div className="flex items-center gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Default Branch</div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">
                  {currentRepository.default_branch}
                </span>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Visibility</div>
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    currentRepository.private
                      ? "bg-amber-50 text-amber-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {currentRepository.private ? "Private" : "Public"}
                </span>
              </div>
            </div>
          </div>

          {/* Commit History */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Recent Commits
            </h3>
            {loadingCommits ? (
              <div className="flex items-center justify-center p-8 bg-white border border-gray-100 rounded-xl">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : commits.length > 0 ? (
              <div className="space-y-3">
                {commits.map((commit) => (
                  <div
                    key={commit.sha}
                    className="bg-white border border-gray-100 rounded-xl p-4 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                        {commit.author
                          ? getInitials(commit.author.login)
                          : getInitials(commit.commit.author.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {commit.author?.login || commit.commit.author.name}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatDate(commit.commit.author.date)}
                          </span>
                        </div>
                        <div className="flex items-start gap-2 text-sm text-gray-600">
                          <GitCommitVertical className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="break-words">
                            {commit.commit.message.split("\n")[0]}
                          </p>
                        </div>
                        <div className="mt-2 text-xs text-gray-400 font-mono">
                          {commit.sha.substring(0, 7)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 bg-white border border-gray-100 rounded-xl text-gray-500">
                No commits found
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center p-12 bg-white border border-gray-100 rounded-xl">
          <svg
            className="w-16 h-16 text-gray-300 mx-auto mb-4"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Repository Connected
          </h3>
          <p className="text-gray-500 mb-4">
            Connect a GitHub repository to get started with documentation.
          </p>
        </div>
      )}
    </div>
  );
}
