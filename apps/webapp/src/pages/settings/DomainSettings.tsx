import { Globe, ExternalLink, Loader2 } from 'lucide-react';

export function DomainSettings() {
   return (
      <div>
         <h2 className="text-xl font-semibold text-gray-900 mb-8">Domain Settings</h2>

         <div className="space-y-8">
            <div className="grid grid-cols-[240px_1fr] gap-8 items-center">
               <div>
                  <label className="block text-sm font-medium text-gray-900">Default Domain</label>
                  <p className="text-xs text-gray-500 mt-1">Default domain for your documentation</p>
               </div>
               <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 w-full max-w-lg">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <span className="truncate">https://john-doe-1765814573.documentationai.com</span>
                  <a href="#" className="ml-auto text-gray-400 hover:text-gray-600">
                     <ExternalLink className="w-3.5 h-3.5" />
                  </a>
               </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-[240px_1fr] gap-8 items-center">
               <div>
                  <label className="block text-sm font-medium text-gray-900">Use Subpath</label>
                  <p className="text-xs text-gray-500 mt-1">Serve docs at subpath</p>
               </div>
               <div className="flex items-center gap-3">
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                     <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                  </button>
                  <span className="text-sm text-gray-900">Host on subpath (eg: /docs)</span>
               </div>
            </div>

            <div className="w-full h-px bg-gray-100" />

            <div className="grid grid-cols-[240px_1fr] gap-8 items-start">
               <div>
                  <label className="block text-sm font-medium text-gray-900">Custom Domains</label>
                  <p className="text-xs text-gray-500 mt-1">Add your custom domains here.</p>
               </div>

               <div className="max-w-xl w-full">
                  <div className="flex gap-0 rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-3">
                     <div className="bg-gray-50 px-3 py-2 text-sm text-gray-500 border-r border-gray-200">https://</div>
                     <input type="text" placeholder="example.com" className="flex-1 px-3 py-2 text-sm focus:outline-none" />
                     <div className="px-3 py-2 bg-white flex items-center gap-2 border-l border-gray-200">
                        <Loader2 className="w-3 h-3 text-gray-400 animate-spin" />
                        <span className="text-xs font-medium text-gray-500">DNS required</span>
                     </div>
                  </div>
                  <button className="px-3 py-1.5 bg-gray-50 text-gray-400 text-sm font-medium rounded-md border border-gray-100" disabled>Save</button>
               </div>
            </div>
         </div>
      </div>
   );
}
