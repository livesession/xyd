import { Edit2, Settings } from 'lucide-react';

export function GeneralSettings() {
  return (
    <div className="relative min-h-full">
      {/* Main Content (Blurred) */}
      <div className="space-y-12 blur-[2px] pointer-events-none select-none opacity-50">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-8">Documentation Settings</h2>

          <div className="space-y-8">
            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-900">Documentation Name</label>
                <p className="text-xs text-gray-500 mt-1">This is the name of your documentation.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  defaultValue="John Doe Documentation"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <button className="px-3 py-1.5 bg-gray-50 text-gray-400 text-sm font-medium rounded-md border border-gray-100" disabled>Save</button>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-900">Documentation Description</label>
                <p className="text-xs text-gray-500 mt-1">This is the description of your documentation.</p>
              </div>
              <div className="space-y-3">
                <textarea
                  rows={3}
                  defaultValue="Welcome to John Doe's documentation. This is your default documentation space where you can organize and manage all your project documentation."
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                />
                <button className="px-3 py-1.5 bg-gray-50 text-gray-400 text-sm font-medium rounded-md border border-gray-100" disabled>Save</button>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-900">Website URL</label>
                <p className="text-xs text-gray-500 mt-1">Your main website URL. We use this to import your theme and improve how search engines see your site.</p>
              </div>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
                <button className="px-3 py-1.5 bg-gray-50 text-gray-400 text-sm font-medium rounded-md border border-gray-100" disabled>Save</button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Brand & Theme</h2>
          <p className="text-sm text-gray-500 mb-8">Customize the visual identity and appearance of your documentation.</p>

          <div className="space-y-8">
            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-900">Documentation Logos</label>
                <p className="text-xs text-gray-500">Upload logos for light and dark themes to customize your documentation branding.</p>

                <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-3 flex gap-2 items-start">
                  <div className="mt-0.5 text-blue-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                  </div>
                  <p className="text-[11px] text-blue-600 leading-relaxed">
                    Stored under logos in documentation.json. Publish documentation to apply changes.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center gap-12">
                  <span className="text-sm font-medium text-gray-500 w-24">Dark Theme</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-[#1f1f1f] rounded-lg flex items-center justify-center border border-gray-200 text-xs text-gray-400">
                      No logo
                    </div>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-sm font-medium text-gray-500 w-24">Light Theme</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-xs text-gray-400">
                      No logo
                    </div>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-sm font-medium text-gray-500 w-24">Favicon</span>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center border border-gray-200 text-xs text-gray-400">
                      No favicon
                    </div>
                    <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-900">Theme Colors</label>
                <p className="text-xs text-gray-500 mt-1">Set brand, heading, and text colors used across both light and dark themes.</p>
              </div>
              <div className="flex gap-20">
                <div className="text-sm font-medium text-gray-900">Light Theme</div>
                <div className="text-sm font-medium text-gray-900">Dark Theme</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
        <div className="bg-white/80 backdrop-blur-md px-10 py-12 rounded-3xl border border-gray-100 shadow-2xl text-center max-w-sm mx-auto transform translate-y-[-20px]">
          <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 -rotate-2 shadow-inner">
            <Settings className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Project Settings</h2>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed">
            Manage your project configuration, theme, and branding directly from the UI. This feature is coming soon to the xyd dashboard.
          </p>
          <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200">
            Coming Soon
          </div>
        </div>
      </div>
    </div>
  );
}
