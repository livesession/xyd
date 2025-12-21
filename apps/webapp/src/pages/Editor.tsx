import { useState, useEffect, useMemo, useRef } from 'react';
import { EditorSidebar } from '../components/editor/EditorSidebar';
import { Globe, PenTool, Code2, FileText, Loader2, ChevronDown, FolderTree, Eye, AlertCircle, Play, Square, Chrome } from 'lucide-react';
import { CodeWorkbench } from '../components/editor/CodeWorkbench';
import { VisualEditor } from '../components/editor/VisualEditor';
import { useProject } from '../contexts/ProjectContext';
import { getFileLanguage } from '../utils/githubTreeUtils';
import { parseFrontmatter } from '../utils/frontmatterUtils';

export function Editor() {
  const { currentRepository, setCurrentRepository, fileTree, fileContents, setFileContent, loadFileContent, loading, syncing, syncProgress, syncRepository } = useProject();
  const [mode, setMode] = useState<'navigation' | 'files'>('files');
  const [viewMode, setViewMode] = useState<'editor' | 'code' | 'preview' | 'site'>('code');
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [connectedRepos, setConnectedRepos] = useState<GitHubRepository[]>([]);
  const [showRepoDropdown, setShowRepoDropdown] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [serverRunning, setServerRunning] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleFileSelect = async (fileName: string) => {
    setCurrentFile(fileName);

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
        handleFileSelect(firstFile.name);
      }
    }
  }, [fileTree]);

  // Handle preview mode - sync status
  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const result = await window.electronAPI.xyd.getServerStatus();
        if (result.success) {
          setServerRunning(result.running);
          if (result.running && result.url) {
            setPreviewUrl(result.url);
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
  }, []);

  const startPreviewServer = async () => {
    if (!currentRepository) {
      setPreviewError('No repository selected');
      return false;
    }

    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Start xyd server with the synced repository
      const result = await window.electronAPI.xyd.startServer(
        currentRepository.owner.login,
        currentRepository.name
      );

      if (result.success && result.url) {
        setPreviewUrl(result.url);
        setPreviewError(null);
        setServerRunning(true);
        return true;
      } else {
        setPreviewError(result.error || 'Failed to start preview server');
        setServerRunning(false);
        return false;
      }
    } catch (error) {
      setPreviewError((error as Error).message);
      setServerRunning(false);
      return false;
    } finally {
      setPreviewLoading(false);
    }
  };

  const stopPreviewServer = async () => {
    try {
      await window.electronAPI.xyd.stopServer();
      setPreviewUrl(null);
      setServerRunning(false);
    } catch (error) {
      console.error('Failed to stop preview server:', error);
    }
  };

  const handleRunToggle = async () => {
    if (serverRunning) {
      stopPreviewServer();
      setViewMode('preview');
    } else {
      // Switch to site view immediately to show status
      setViewMode('site');
      // First, ensure files are synced from GitHub to local path
      await syncRepository();
      await startPreviewServer();
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
            onClick={() => setMode('navigation')}
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
              onClick={() => setShowUpsellModal(true)}
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
              onClick={() => setViewMode('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'preview' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
            >
              <Eye className="w-3 h-3" /> Preview
            </button>
          </div>
          {serverRunning && !previewLoading ? (
            <div className="flex items-center p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('site')}
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
              disabled={previewLoading}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${serverRunning
                ? 'bg-red-50 text-red-600 hover:bg-red-100'
                : 'bg-green-600 text-white hover:bg-green-700'
                }`}
            >
              {previewLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Play className="w-3 h-3 fill-current" />
              )}
              {previewLoading ? (serverRunning ? 'Stopping...' : 'Starting...') : 'Run'}
            </button>
          )}
          <button className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Globe className="w-3 h-3" /> Publish
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <EditorSidebar mode={mode} onFileSelect={handleFileSelect} activeFile={currentFile || undefined} />

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
          ) : viewMode === 'preview' ? (
            <VisualEditor
              content={parsedContent.content}
              fileName={currentFile}
              frontmatter={parsedContent.frontmatter}
              onChange={handleContentChange}
            />
          ) : (
            <div className="h-full w-full border border-gray-200 rounded-lg overflow-hidden bg-white flex flex-col">
              {previewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-sm text-gray-600">Starting xyd preview server...</p>
                  </div>
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-4">
                    <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Preview Error</h3>
                    <p className="text-sm text-gray-600 mb-4">{previewError}</p>
                    <button
                      onClick={startPreviewServer}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              ) : previewUrl ? (
                <iframe
                  ref={iframeRef}
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title="XYD Preview"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md px-4">
                    <Play className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">Server Not Running</h3>
                    <p className="text-sm text-gray-600 mb-4">Click the "Run" button in the top bar to start the xyd server and view the local site.</p>
                    <button
                      onClick={handleRunToggle}
                      disabled={previewLoading}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center gap-2 mx-auto"
                    >
                      {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                      Start Server
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upsell Modal */}
      {showUpsellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-gray-100">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                <PenTool className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">Editor Mode is Coming Soon!</h3>
              <p className="text-gray-600 mb-8">
                We're building an advanced AI-powered editor that will revolutionize how you work with your files.
                Want to be the first to know when it's ready?
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => setShowUpsellModal(false)}
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                >
                  Join the Waitlist
                </button>
                <button
                  onClick={() => setShowUpsellModal(false)}
                  className="w-full py-3 bg-gray-50 text-gray-600 rounded-xl font-medium hover:bg-gray-100 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
