import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, RotateCw, Globe, Loader2, AlertCircle, Play, Eye } from 'lucide-react';

interface BrowserPreviewProps {
    renderUrl: string | null;
    renderLoading: boolean;
    renderError: string | null;
    onStartServer: () => void;
    onRefresh: () => void;
    iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function BrowserPreview({
    renderUrl,
    renderLoading,
    renderError,
    onStartServer,
    onRefresh,
    iframeRef
}: BrowserPreviewProps) {
    const [urlInput, setUrlInput] = useState(renderUrl || '');

    // Sync input with prop when it changes (e.g. server starts)
    useEffect(() => {
        if (renderUrl) {
            setUrlInput(renderUrl);
        }
    }, [renderUrl]);

    const handleNavigate = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && iframeRef.current) {
            let targetUrl = urlInput;
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                // If no protocol, assume it's relative to the render server if we have one
                if (renderUrl) {
                    const base = new URL(renderUrl).origin;
                    targetUrl = new URL(targetUrl, base).href;
                }
            }
            iframeRef.current.src = targetUrl;
        }
    };

    return (
        <div className="h-full flex flex-col bg-gray-100 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Browser Chrome Toolbar */}
            <div className="px-4 py-2.5 bg-gray-50/80 backdrop-blur-sm border-b border-gray-200 flex items-center gap-3">
                {/* Navigation buttons */}
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => window.history.back()}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-all"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => window.history.forward()}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-all"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={onRefresh}
                        className={`p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-all ${renderLoading ? 'animate-spin' : ''}`}
                    >
                        <RotateCw className="w-4 h-4" />
                    </button>
                </div>

                {/* URL Bar */}
                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                    <div className="flex items-center gap-2 text-gray-400">
                        {renderLoading ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                        ) : (
                            <Globe className="w-3.5 h-3.5" />
                        )}
                    </div>
                    <input
                        type="text"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyDown={handleNavigate}
                        placeholder="Enter URL or path..."
                        className="flex-1 text-sm text-gray-600 font-mono bg-transparent border-none outline-none focus:ring-0 p-0 h-auto"
                    />
                    <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-blue-50 text-[10px] font-bold text-blue-600 rounded uppercase tracking-wider">
                        {renderUrl ? 'Live' : 'Standby'}
                    </div>
                </div>

                {/* Action Button */}
                {!renderUrl && (
                    <button
                        onClick={onStartServer}
                        disabled={renderLoading}
                        className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm shadow-blue-100"
                    >
                        {renderLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
                        Run Server
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white relative">
                {renderLoading ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-white/80 backdrop-blur-sm z-10">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 animate-pulse">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Starting Render Server</h3>
                        <p className="text-sm text-gray-500">Preparing your documentation for preview...</p>
                    </div>
                ) : renderError ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                        <div className="w-20 h-20 bg-red-50 rounded-[2.5rem] flex items-center justify-center mb-8 text-red-500 shadow-sm">
                            <AlertCircle className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">Sync/Render Error</h3>
                        <p className="text-sm text-gray-600 mb-8 max-w-sm mx-auto leading-relaxed">
                            {renderError}
                        </p>
                        <button
                            onClick={onStartServer}
                            className="px-8 py-3 bg-white border border-gray-200 rounded-xl font-semibold text-gray-900 hover:bg-gray-50 transition-all shadow-lg flex items-center gap-2"
                        >
                            <RotateCw className="w-4 h-4" /> Retry Connection
                        </button>
                    </div>
                ) : renderUrl ? (
                    <iframe
                        ref={iframeRef}
                        src={renderUrl}
                        className="w-full h-full border-0"
                        title="XYD Render"
                    />
                ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center bg-gray-50">
                        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-8 text-gray-300 rotate-6 shadow-xl shadow-gray-200/50 scale-110">
                            <Eye className="w-12 h-12" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Preview Standby</h3>
                        <p className="text-sm text-gray-500 mb-10 max-w-xs mx-auto leading-relaxed">
                            Launch the render server to see a pixel-perfect, live view of your site.
                        </p>
                        <button
                            onClick={onStartServer}
                            disabled={renderLoading}
                            className="group px-10 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 flex items-center gap-3 active:scale-95"
                        >
                            <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                <Play className="w-4 h-4 fill-current" />
                            </div>
                            Launch Preview Server
                        </button>
                    </div>
                )}
            </div>

            {/* Browser Footer / Status Bar */}
            <div className="px-4 py-1.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${renderUrl ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                        {renderUrl ? 'Server Online' : 'Server Offline'}
                    </div>
                    {renderUrl && (
                        <div className="flex items-center gap-1.5">
                            <Chrome className="w-3 h-3" />
                            Rendered via XYD Core
                        </div>
                    )}
                </div>
                <div className="opacity-60">
                    v1.0.4 - Localhost Sync
                </div>
            </div>
        </div>
    );
}

// Simple Chrome icon since Lucide doesn't have a perfect brand icon
function Chrome(props: any) {
    return (
        <svg
            {...props}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4" />
            <line x1="21.17" y1="8" x2="12" y2="8" />
            <line x1="3.95" y1="6.06" x2="8.54" y2="14" />
            <line x1="10.88" y1="21.94" x2="15.46" y2="14" />
        </svg>
    );
}
