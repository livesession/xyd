import { Eye, EyeOff, Check, X } from 'lucide-react';
import { useState, useEffect } from 'react';

export function GitHubAppSettings() {
  const [token, setToken] = useState('');
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadToken();
  }, []);

  const loadToken = async () => {
    try {
      const result = await window.electronAPI.githubToken.get();
      if (result.success && result.token) {
        setSavedToken(result.token);
      }
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  };

  const handleSave = async () => {
    if (!token.trim()) {
      setMessage({ type: 'error', text: 'Please enter a token' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.githubToken.save(token);
      if (result.success) {
        setSavedToken(token);
        setToken('');
        setMessage({ type: 'success', text: 'Token saved securely' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save token' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const result = await window.electronAPI.githubToken.delete();
      if (result.success) {
        setSavedToken(null);
        setToken('');
        setMessage({ type: 'success', text: 'Token deleted' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to delete token' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete token' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Github App</h2>

      <div className="space-y-8">
        <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-900">GitHub Personal Access Token</label>
            <p className="text-xs text-gray-500 mt-1">Securely stored using your OS keychain</p>
          </div>

          <div className="space-y-4">
            {savedToken && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-green-800">Token is configured</span>
                </div>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="text-xs text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            )}

            <div className="space-y-3">
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={loading || !token.trim()}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Token'}
              </button>

              {message && (
                <div className={`flex items-center gap-2 text-sm ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                  {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  {message.text}
                </div>
              )}

              <p className="text-xs text-gray-500">
                Create a token at{' '}
                <a
                  href="https://github.com/settings/personal-access-tokens"
                  className="text-blue-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  github.com/settings/personal-access-tokens
                </a>
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
