import { Github } from 'lucide-react';

export function GitHubAppSettings() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Github App</h2>

      <div className="space-y-8">
        <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-900">Github App Connections</label>
            <p className="text-xs text-gray-500 mt-1">This is used to updating your documentation</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Connected Accounts</label>
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#f6f8fa] flex items-center justify-center text-gray-400 border border-gray-200">
                <Github className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-medium text-gray-900">documentation-ai-managed</div>
                <div className="text-xs text-gray-500">access level : <span className="font-semibold text-gray-700">docs-john-doe-documentation-3</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
