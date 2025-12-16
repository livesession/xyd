import { Github, Globe, RefreshCw, ExternalLink, GitCommitVertical } from 'lucide-react';

export function Dashboard() {
    return (
        <div className="space-y-10">
            {/* Sync Banner */}
            <div className="bg-[#FFF6ED] rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex gap-4">
                    <div className="mt-1">
                        <GitCommitVertical className="w-5 h-5 text-orange-900" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-sm">Sync with Git App</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            You can sync with your git repo and enable two-way sync and auto documentation updates.
                        </p>
                    </div>
                </div>
                <button className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors whitespace-nowrap">
                    <Github className="w-4 h-4" />
                    Sync with GitHub
                </button>
            </div>

            <div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">Good evening, John</h1>
                <p className="text-gray-500 font-light">Welcome back to John Doe Documentation.</p>
            </div>

            {/* Project Card */}
            <div className="bg-white  rounded-2xl flex flex-col md:flex-row gap-8 items-start">
                {/* Preview Image Placeholder or Actual Image */}
                <div className="w-full md:w-[480px] bg-gray-50 rounded-xl border border-gray-100 overflow-hidden aspect-video relative group cursor-pointer shadow-sm hover:shadow-md transition-all">
                    {/* Using a placeholder div that mimics the screenshot structure if no image available, but using the screenshot structure from design */}
                    <div className="absolute inset-0 p-4 opacity-80">
                        <div className="w-full h-full bg-white rounded-lg shadow-sm border border-gray-100 p-4 space-y-3">
                            <div className="flex gap-4">
                                <div className="w-1/4 h-2 bg-gray-100 rounded"></div>
                            </div>
                            <div className="flex gap-8">
                                <div className="w-1/4 space-y-2">
                                    <div className="h-2 bg-gray-100 rounded"></div>
                                    <div className="h-2 bg-gray-100 rounded"></div>
                                </div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-6 w-3/4 bg-gray-100 rounded mb-4"></div>
                                    <div className="h-3 bg-gray-50 rounded"></div>
                                    <div className="h-3 bg-gray-50 rounded"></div>
                                    <div className="h-3 bg-gray-50 rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/5">
                        <button className="bg-white shadow-lg text-gray-900 px-4 py-2 rounded-lg text-sm font-medium">Open Editor</button>
                    </div>
                </div>

                <div className="flex-1 w-full space-y-8 py-2">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-gray-500 mb-1">Status</div>
                                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                    Live
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
                                    <span className="text-lg leading-none">+</span> Custom domain
                                </button>
                                <button className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-50">
                                    <RefreshCw className="w-4 h-4" />
                                </button>
                                <button className="px-3 py-1.5 rounded-lg bg-[#1f1f1f] text-white text-sm font-medium hover:bg-black flex items-center gap-2 shadow-sm">
                                    <Globe className="w-4 h-4" />
                                    View Site
                                </button>
                            </div>
                        </div>

                        <div>
                            <div className="text-sm text-gray-500 mb-1">Domain</div>
                            <a href="#" className="flex items-center gap-1 text-sm text-gray-900 underline decoration-gray-300 underline-offset-4 hover:decoration-gray-900 transition-all">
                                https://john-doe-1765814573.documentationai.com
                                <ExternalLink className="w-3 h-3" />
                            </a>
                        </div>

                        <div className="text-xs text-gray-500">
                            Published at <span className="font-medium text-gray-900">15 Dec, 05:04 PM</span> by <span className="inline-flex items-center gap-1 font-medium text-gray-900"><div className="w-4 h-4 rounded-full bg-teal-500 flex items-center justify-center text-[8px] text-white">J</div> John Doe</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Deployments */}
            <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Deployments</h3>
                <div className="bg-white border border-gray-100 rounded-xl p-4 flex items-center justify-between hover:border-gray-200 transition-colors shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                            J
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">John Doe</span>
                                <span className="text-xs text-gray-400">05:04 PM, 15 Dec</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
                                <GitCommitVertical className="w-4 h-4 text-gray-400" />
                                Add AI-Generated Documentation For John Doe Documentation
                            </div>
                            <div className="mt-1 text-xs text-gray-400 pl-6">
                                7 Changes
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                            Ready
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transform rotate-90">
                                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
