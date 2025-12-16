import { Github, GitBranch } from 'lucide-react';

export function RepositorySettings() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-8">Repository</h2>

      <div className="space-y-8">
        <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-900">Connect your own repository</label>
            <p className="text-xs text-gray-500 mt-1">Migrate your documentation to your own GitHub repository for full control</p>
          </div>

          <div className="bg-[#FFF6ED] rounded-xl p-6 border border-orange-100/50">
            <div className="flex gap-4 mb-6">
              <GitBranch className="w-5 h-5 text-gray-700 mt-1" />
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Sync with GitHub</h3>
                <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                  Your documentation is currently hosted in our managed repository <span className="font-medium text-gray-900">documentation-ai-managed/docs-john-doe-documentation-3</span>. Migrate it to your own GitHub account to enable direct Git workflows and maintain full control over your content.
                </p>
              </div>
            </div>
            <button className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <Github className="w-4 h-4" />
              Sync with GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
