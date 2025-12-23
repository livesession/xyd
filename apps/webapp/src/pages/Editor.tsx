import { useState, useEffect, useMemo, useRef } from 'react';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { Globe, PenTool, Code2, FileText, Loader2, ChevronDown, FolderTree, Square, Navigation, Eye, Play, Chrome } from 'lucide-react';
import { CodeWorkbench } from '../components/editor/CodeWorkbench';
import { VisualEditor } from '../components/editor/VisualEditor';
import { DiffView } from '../components/editor/DiffView';
import { BrowserPreview } from '../components/editor/BrowserPreview';
import { useProject } from '../contexts/ProjectContext';
import { getFileLanguage } from '../utils/githubTreeUtils';
import { parseFrontmatter } from '../utils/frontmatterUtils';

export function Editor() {
  const { currentRepository, setCurrentRepository, fileTree, fileContents, setFileContent, loadFileContent, loading, syncing, syncProgress, syncRepository, modifiedFiles, isPublishing, publishChanges } = useProject();
  const [mode, setMode] = useState<'navigation' | 'files'>('files');
  const [viewMode, setViewMode] = useState<'editor' | 'code' | 'render' | 'site' | 'diff'>('code');
  const [upsellType, setUpsellType] = useState<'editor' | 'navigation' | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [renderLoading, setRenderLoading] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [commitMessage, setCommitMessage] = useState("Update content via XYD Editor");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-select first modified file when entering diff mode
  useEffect(() => {
    if (viewMode === 'diff' && modifiedFiles.length > 0) {
      // If no file selected or current file is not modified, pick first modified
      if (!currentFile || !modifiedFiles.includes(currentFile)) {
        handleFileSelect(modifiedFiles[0], true);
      }
    }
  }, [viewMode, modifiedFiles]);

  const isMarkdown = useMemo(() => {
    if (!currentFile) return false;
    return currentFile.endsWith('.md') || currentFile.endsWith('.mdx');
  }, [currentFile]);

  const handleFileSelect = async (fileName: string, isAutoSelect: boolean = false) => {
    setCurrentFile(fileName);
    const isMd = fileName.endsWith('.md') || fileName.endsWith('.mdx');

    if (!isAutoSelect) {
      // Explicit user selection should take them out of Site view
      if (viewMode === 'site' || (viewMode === 'render' && !isMd)) {
        setViewMode('code');
      }
    } else {
      // Background auto-selection should NOT interrupt Site view
      if (viewMode === 'render' && !isMd) {
        setViewMode('code');
      }
    }

    // Load file content if not already loaded
    if (!fileContents[fileName]) {
      setFileLoading(true);
      await loadFileContent(fileName);
      setFileLoading(false);
    }
  };

  const handleContentChange = (val: string | undefined) => {
    if (val !== undefined && currentFile) {
      setFileContent(currentFile, val);
    }
  };

  // Parse frontmatter from current file content
  const parsedContent = useMemo(() => {
    if (!currentFile || !fileContents[currentFile]) {
      return { frontmatter: '', content: '', hasFrontmatter: false };
    }
    return parseFrontmatter(fileContents[currentFile]);
  }, [currentFile, fileContents]);

  // Load connected repositories
  useEffect(() => {
    const loadConnectedRepos = async () => {
      try {
        const result = await window.electronAPI.repositories.getConnected();
        if (result.success && result.repositories) {
          setConnectedRepos(result.repositories);
        }
      } catch (error) {
        console.error('Failed to load connected repositories:', error);
      }
    };
    loadConnectedRepos();
  }, []);

  // Auto-select first file when tree loads
  useEffect(() => {
    if (fileTree.length > 0 && !currentFile) {
      const firstFile = findFirstFile(fileTree);
      if (firstFile) {
        handleFileSelect(firstFile.name, true);
      }
    }
  }, [fileTree]);

  // Handle render mode - sync status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
      const result = await window.electronAPI.xyd.getServerStatus();
      if (result.success) {
        const matchesCurrent =
          result.owner &&
          result.repo &&
          currentRepository &&
          result.owner === currentRepository.owner.login &&
          result.repo === currentRepository.name;
        const runningForCurrent = result.running && matchesCurrent;
        setServerRunning(runningForCurrent);
        if (runningForCurrent && result.url) {
          setRenderUrl(result.url);
        } else if (!runningForCurrent) {
          setRenderUrl(null);
        }
      }
    } catch (error) {
      console.error('Failed to check server status:', error);
    }
  };
  checkServerStatus();

    // Poll status occasionally? Or just trust the toggle.
    const interval = setInterval(checkServerStatus, 5000);
    return () => clearInterval(interval);
  }, [currentRepository]);

  const startRenderServer = async () => {
    if (!currentRepository) {
      setRenderError('No repository selected');
      return false;
    }

    setRenderLoading(true);
    setRenderError(null);

    try {
      // Start xyd server with the synced repository
      const result = await window.electronAPI.xyd.startServer(
        currentRepository.owner.login,
        currentRepository.name
      );

      if (result.success && result.url) {
        setRenderUrl(result.url);
        setRenderError(null);
        setServerRunning(true);
        return true;
      } else {
        setRenderError(result.error || 'Failed to start render server');
        setServerRunning(false);
        return false;
      }
    } catch (error) {
      setRenderError((error as Error).message);
      setServerRunning(false);
      return false;
    } finally {
      setRenderLoading(false);
    }
  };

  const stopRenderServer = async () => {
    try {
      await window.electronAPI.xyd.stopServer();
      setRenderUrl(null);
      setServerRunning(false);
    } catch (error) {
      console.error('Failed to stop render server:', error);
    }
  };

  const handleRunToggle = async () => {
    if (serverRunning) {
      stopRenderServer();
      setViewMode('render');
    } else {
      // Switch to site view immediately to show status
      setCurrentFile(null);
      setViewMode('site');
      // First, ensure files are synced from GitHub to local path
      await syncRepository();
      await startRenderServer();
    }
  };

  const handlePublishClick = () => {
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!commitMessage.trim()) return;

    // Close modal immediately to show loading state on button
    setShowPublishModal(false);

    const result = await publishChanges(commitMessage);
    if (result.success) {
      // Optional: Toast logic here? For now, we rely on the button state returning to normal
      // or we can add a temporary success banner.
      console.log("Published successfully");
    } else {
      alert(`Failed to publish: ${result.error}`);
    }
  };

  function findFirstFile(nodes: any[]): any {
    for (const node of nodes) {
      if (node.type === 'file') return node;
      if (node.children) {
        const found = findFirstFile(node.children);
        if (found) return found;
      }
    }
    return null;
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Top Bar - Local to Editor */}
      <div className="h-14 border-b border-gray-200 flex items-center justify-between px-4 bg-white flex-shrink-0 z-10">
        <div className="flex items-center p-1 bg-gray-100 rounded-lg">
          <button
            onClick={() => setUpsellType('navigation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'navigation' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <span className="w-4 h-4 flex items-center justify-center border border-current rounded-[4px]">
              <span className="w-1.5 h-2.5 border-l border-current"></span>
            </span>
            Navigation
          </button>
          <button
            onClick={() => setMode('files')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'files' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FolderTree className="w-4 h-4" />
            Files/URL Paths
          </button>
        </div>

        <div className="flex items-center gap-2">
          {currentRepository && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-200 text-xs text-gray-600">
              <span className="font-semibold">{currentRepository.name}</span>
              {currentFile && (
                <>
                  <span>/</span>
                  <span>{currentFile}</span>
                  <button><FileText className="w-3 h-3" /></button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Repository Selector */}
          {connectedRepos.length > 0 && (
            <div className="relative">
              <button
                onClick={() => setShowRepoDropdown(!showRepoDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                </svg>
                <span className="truncate max-w-[120px]">
                  {currentRepository?.name || 'Select repo'}
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
                    {connectedRepos.map(repo => (
                      <button
                        key={repo.id}
                        onClick={() => {
                          setCurrentRepository(repo);
                          setCurrentFile(null);
                          setShowRepoDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors ${currentRepository?.id === repo.id ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                          }`}
                      >
                        <div className="font-medium truncate">{repo.name}</div>
                        <div className="text-gray-500 truncate text-[10px]">{repo.full_name}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex items-center p-1 bg-gray-100 rounded-lg">
            <button
              onClick={() => setUpsellType('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'editor' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <PenTool className="w-3 h-3" /> Editor
            </button>
            <button
              onClick={() => setViewMode('code')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'code' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Code2 className="w-3 h-3" /> Code
            </button>
            <button
              onClick={() => setViewMode('render')}
              disabled={!isMarkdown}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'render'
                ? 'bg-white text-gray-900 shadow-sm'
                : isMarkdown
                  ? 'text-gray-500 hover:text-gray-900'
                  : 'text-gray-300 cursor-not-allowed'
                }`}
              title={!isMarkdown ? "Render mode is only available for Markdown (.md, .mdx) files" : ""}
            >
              <Eye className="w-3 h-3" /> Render
            </button>
          </div>
          {serverRunning && !renderLoading && !syncing ? (
            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => {
                  setCurrentFile(null);
                  setViewMode('site');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'site' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
              >
                <Chrome className="w-3 h-3" /> Preview
              </button>
              <button
                onClick={handleRunToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all text-red-500 hover:text-red-600 hover:bg-red-50"
              >
                <Square className="w-3 h-3 fill-current" /> Stop
              </button>
            </div>
          ) : (
            <button
              onClick={handleRunToggle}
              disabled={renderLoading || syncing}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${serverRunning
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : (renderLoading || syncing) ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {(renderLoading || syncing) ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              {syncing ? 'Syncing...' : (renderLoading ? (serverRunning ? 'Running...' : 'Starting...') : 'Run')}
            </button>
          )}
          <button
            onClick={handlePublishClick}
            disabled={isPublishing || modifiedFiles.length === 0}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isPublishing || modifiedFiles.length === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-black hover:bg-gray-800 text-white'
              }`}
          >
            {isPublishing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Globe className="w-3 h-3" />}
            {isPublishing ? 'Publishing...' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar
          mode={mode}
          onFileSelect={handleFileSelect}
          activeFile={currentFile || undefined}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        <div className="flex-1 bg-[#FAFAFA] relative p-4">
          {!currentRepository ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>No repository connected. Please connect a repository in settings.</p>
            </div>
          ) : syncing ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-green-600" />
                <p className="text-sm font-medium text-gray-900 mb-1">Syncing Files</p>
                <p className="text-xs text-gray-600">{syncProgress || 'Preparing local environment...'}</p>
              </div>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : viewMode === 'site' ? (
            <BrowserPreview
              renderUrl={renderUrl}
              renderLoading={renderLoading}
              renderError={renderError}
              onStartServer={handleRunToggle}
              onRefresh={() => {
                if (iframeRef.current) {
                  iframeRef.current.src = iframeRef.current.src;
                }
              }}
              iframeRef={iframeRef}
            />
          ) : !currentFile ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <p>Select a file to start editing</p>
            </div>
          ) : fileLoading ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : viewMode === 'code' ? (
            <CodeWorkbench
              code={fileContents[currentFile] || ''}
              onChange={handleContentChange}
              language={getFileLanguage(currentFile)}
            />
          ) : viewMode === 'render' ? (
            <VisualEditor
              content={parsedContent.content}
              fileName={currentFile}
              frontmatter={parsedContent.frontmatter}
              onChange={handleContentChange}
            />
          ) : viewMode === 'diff' ? (
            <DiffView fileName={currentFile} />
          ) : (
            null
          )}
        </div>
      </div>

      {/* Upsell Modal */}
      {upsellType && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setUpsellType(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                {upsellType === 'editor' ? <PenTool className="w-8 h-8" /> : <Navigation className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Feature Coming Soon!</h3>
              <p className="text-gray-600 mb-8">
                {upsellType === 'editor'
                  ? "We're building an advanced AI-powered editor that will revolutionize how you work with your files."
                  : "We're working on a visual navigation builder to help you organize your documentation structure with ease."}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setUpsellType(null)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Publish Modal */}
      {showPublishModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setShowPublishModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5" /> Publish to GitHub
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commit Message
              </label>
              <textarea
                value={commitMessage}
                onChange={(e) => setCommitMessage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[80px] text-sm"
                placeholder="Describe your changes..."
                autoFocus
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                disabled={!commitMessage.trim()}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Publish Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
