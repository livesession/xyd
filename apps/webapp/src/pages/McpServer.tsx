import { Server, Copy, ExternalLink, Wrench, Search } from 'lucide-react';

export function McpServer() {
    return (
        <div className="max-w-5xl mx-auto space-y-8">
            <div>
                <h1 className="text-xl font-semibold text-gray-900">MCP Server</h1>
                <p className="text-sm text-gray-500 mt-1">Connect AI assistants to your documentation using the Model Context Protocol.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-12 items-start">
                <div className="space-y-8">
                    <div className="space-y-3">
                        <h2 className="text-base font-semibold text-gray-900">What is MCP?</h2>
                        <p className="text-sm text-gray-600 leading-relaxed text-justify">
                            The Model Context Protocol (MCP) is an open standard that enables AI assistants like Claude, ChatGPT, and other LLMs to securely access your documentation content. It provides a standardized way for AI models to interact with external data sources.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-base font-semibold text-gray-900">How to use</h2>
                        <div className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">1</div>
                                <p className="text-sm text-gray-600 pt-0.5">Copy the MCP server URL from the right panel</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">2</div>
                                <p className="text-sm text-gray-600 pt-0.5">Add the URL to your MCP client configuration (e.g., Claude Desktop, Cursor, or any MCP-compatible application).</p>
                            </div>
                            <div className="flex gap-3">
                                <div className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600 flex-shrink-0">3</div>
                                <p className="text-sm text-gray-600 pt-0.5">Start asking questions about your documentation directly in your AI assistant.</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <a href="#" className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors">
                            Learn more about MCP
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 border border-gray-100">
                                    <Server className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">MCP Endpoint</div>
                                    <div className="text-xs text-gray-500">Server-Sent Events (SSE)</div>
                                </div>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                                Available
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-medium text-gray-500">Server URL</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 truncate">
                                    https://john-doe-1765814573.documentationai.com/_mcp
                                </div>
                                <button className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500">
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                            <span className="text-xs text-gray-400">Publish your documentation to enable the MCP server.</span>
                            <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                                Open <ExternalLink className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500">
                                    <Wrench className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-gray-900">Available Tools</div>
                                    <div className="text-xs text-gray-500">Tools exposed by this MCP server</div>
                                </div>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-50">
                            <div className="p-4 flex gap-4">
                                <div className="mt-1 flex-shrink-0 w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between">
                                        <div className="font-mono text-xs font-medium text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded">search_documentation</div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                        Search through the documentation using hybrid search (semantic + keyword).
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
