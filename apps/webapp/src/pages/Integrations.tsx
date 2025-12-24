import {
    Search,
    Sparkles,
    Grid2x2,
    Bot,
    BarChart3,
    MessageCircle,
    Megaphone,
    CheckSquare,
    FileText,
    Code2,
    Zap,
    ShieldCheck,
    BadgeCheck,
    Flame,
    Leaf,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { pluginManager } from "../services/pluginManager";
import type { UnifiedPlugin } from "../services/pluginSources";

const categories = [
    { id: "all", label: "All", icon: Grid2x2 },
    { id: "ai", label: "AI", icon: Sparkles },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "automation", label: "Automation", icon: Bot },
    { id: "support", label: "Customer Support", icon: MessageCircle },
    { id: "marketing", label: "Marketing", icon: Megaphone },
    { id: "productivity", label: "Productivity", icon: CheckSquare },
    { id: "content", label: "Content", icon: FileText },
    { id: "dev", label: "Development", icon: Code2 },
];

const floatingTiles = [
    { label: "Zapier", accent: "bg-[#ff4f00]", text: "text-white", top: "22%", left: "62%" },
    { label: "Stripe", accent: "bg-[#635bff]", text: "text-white", top: "10%", left: "72%" },
    { label: "HubSpot", accent: "bg-white border border-orange-100 text-orange-500", text: "text-orange-500", top: "48%", left: "70%" },
    { label: "Notion", accent: "bg-[#050505]", text: "text-white", top: "40%", left: "54%" },
    { label: "Linear", accent: "bg-gradient-to-br from-indigo-400 to-blue-600", text: "text-white", top: "18%", left: "50%" },
    { label: "Base", accent: "bg-[#e3f5ff]", text: "text-sky-700", top: "52%", left: "46%" },
];

export function Integrations() {
    // Check if we're in development mode
    const isDev = import.meta.env.DEV;

    const [activeCategory, setActiveCategory] = useState<string>("all");
    const [query, setQuery] = useState<string>("");
    const [plugins, setPlugins] = useState<UnifiedPlugin[]>([]);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Only enable OpenVSX in development mode
    const [enabledSources, setEnabledSources] = useState<('custom' | 'openvsx')[]>(
        isDev ? ['custom', 'openvsx'] : ['custom']
    );

    // Fetch plugins when filters change
    useEffect(() => {
        const fetchPlugins = async () => {
            setIsLoading(true);
            console.log('Fetching plugins with:', { activeCategory, query, enabledSources });

            try {
                const [results, count] = await Promise.all([
                    pluginManager.search({
                        query: query || undefined,
                        category: activeCategory,
                        size: 100,
                        sources: enabledSources,
                    }),
                    pluginManager.getCount({
                        query: query || undefined,
                        category: activeCategory,
                        sources: enabledSources,
                    }),
                ]);

                console.log('Fetched plugins:', results.length, 'Count:', count);
                setPlugins(results);
                setTotalCount(count);
            } catch (error) {
                console.error('Error fetching plugins:', error);
                setPlugins([]);
                setTotalCount(0);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlugins();
    }, [activeCategory, query, enabledSources]);

    const filteredIntegrations = plugins;

    // If not in dev mode, show upsell placeholder for entire integrations page
    if (!isDev) {
        return (
            <div className="min-h-screen bg-white text-gray-900">
                <div className="mx-auto px-22 py-10 space-y-10">
                    <div className="bg-[#f1f4ff] rounded-3xl px-8 md:px-12 py-12 relative overflow-hidden border border-[#e4e8ff]">
                        <div className="max-w-3xl mx-auto text-center space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-sm rounded-full shadow-sm text-indigo-700 border border-indigo-100">
                                <Sparkles className="w-4 h-4" />
                                <span>Integrations Marketplace</span>
                            </div>
                            <div className="w-24 h-24 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                                <Sparkles className="w-12 h-12 text-indigo-600" />
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                                    Integrations Coming Soon
                                </h1>
                                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                    Connect your favorite tools and supercharge your documentation workflow. We're building a powerful marketplace with hundreds of integrations.
                                </p>
                            </div>
                            <div className="pt-4">
                                <button className="px-8 py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition shadow-lg">
                                    Get Early Access
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">Coming Soon</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                            {floatingTiles.map((tile) => (
                                <div
                                    key={tile.label}
                                    className={`flex items-center justify-center px-6 py-4 rounded-2xl font-semibold text-sm shadow-lg ${tile.accent} ${tile.text} opacity-60`}
                                >
                                    {tile.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-gray-900">
            <div className="mx-auto px-22 py-10 space-y-10">
                <div className="bg-[#f1f4ff] rounded-3xl px-8 md:px-12 py-12 relative overflow-hidden border border-[#e4e8ff]">
                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="space-y-6 relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white text-sm rounded-full shadow-sm text-indigo-700 border border-indigo-100">
                                <Sparkles className="w-4 h-4" />
                                <span>Integrations</span>
                            </div>
                            <div className="space-y-3">
                                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
                                    Supercharge your docs with apps
                                </h1>
                                <p className="text-lg text-gray-600">
                                    Connect powerful tools to keep your help center in sync and automate content workflows.
                                </p>
                            </div>

                            <div className="relative">
                                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
                                <input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Search apps by name or use case"
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-300 transition"
                                />
                            </div>
                        </div>

                        <div className="relative h-[260px] md:h-[320px]">
                            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/60 via-white/40 to-indigo-100 blur-2xl" />
                            <div className="relative h-full">
                                {floatingTiles.map((tile, index) => (
                                    <div
                                        key={tile.label}
                                        className={`absolute px-4 py-3 rounded-2xl font-semibold text-sm shadow-lg shadow-indigo-100 ${tile.accent} ${tile.text}`}
                                        style={{
                                            top: tile.top,
                                            left: tile.left,
                                            transform: index % 2 === 0 ? "rotate(-6deg)" : "rotate(4deg)",
                                        }}
                                    >
                                        {tile.label}
                                    </div>
                                ))}
                                <div className="absolute -bottom-8 -right-6 w-44 h-44 bg-indigo-200 rounded-full mix-blend-multiply opacity-60 blur-3xl" />
                                <div className="absolute -top-10 -left-6 w-48 h-48 bg-amber-100 rounded-full mix-blend-multiply opacity-70 blur-3xl" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-8 items-start">
                    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 sticky top-4">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                            Categories
                        </div>
                        <div className="space-y-2">
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => setActiveCategory(category.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                                        activeCategory === category.id
                                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                                            : "text-gray-700 hover:bg-gray-50"
                                    }`}
                                >
                                    <category.icon className="w-4 h-4" />
                                    <span className="flex-1 text-left">{category.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide">
                                    New & Noteworthy
                                </p>
                                <h2 className="text-2xl font-semibold text-gray-900 mt-1">Integrations</h2>
                            </div>
                            <div className="flex items-center gap-4">
                                {isDev && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enabledSources.includes('custom')}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEnabledSources([...enabledSources, 'custom']);
                                                    } else {
                                                        setEnabledSources(enabledSources.filter(s => s !== 'custom'));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700">Custom</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={enabledSources.includes('openvsx')}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setEnabledSources([...enabledSources, 'openvsx']);
                                                    } else {
                                                        setEnabledSources(enabledSources.filter(s => s !== 'openvsx'));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                            <span className="text-gray-700">OpenVSX</span>
                                        </label>
                                    </div>
                                )}
                                <div className="text-sm text-gray-500">
                                    {isLoading ? (
                                        <div className="flex items-center gap-2">
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>Loading...</span>
                                        </div>
                                    ) : (
                                        <>
                                            Showing <span className="font-semibold text-gray-900">{filteredIntegrations.length}</span> apps
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredIntegrations.map((integration) => (
                                <Link
                                    to={`/integrations/${integration.slug}`}
                                    key={integration.id}
                                    className="flex gap-4 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                                >
                                    <div className="w-12 h-12 rounded-xl flex-shrink-0 overflow-hidden shadow-inner">
                                        {integration.iconUrl ? (
                                            <img
                                                src={integration.iconUrl}
                                                alt={`${integration.name} icon`}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback to gradient background with initials if image fails to load
                                                    const target = e.target as HTMLImageElement;
                                                    target.style.display = 'none';
                                                    const parent = target.parentElement;
                                                    if (parent) {
                                                        parent.className = `w-12 h-12 rounded-xl bg-gradient-to-br ${integration.accent} ${integration.text} flex items-center justify-center font-semibold text-base shadow-inner`;
                                                        parent.textContent = integration.initials;
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <div className={`w-full h-full bg-gradient-to-br ${integration.accent} ${integration.text} flex items-center justify-center font-semibold text-base`}>
                                                {integration.initials}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="font-semibold text-gray-900">{integration.name}</p>
                                                    {integration.source === 'openvsx' && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                                            OpenVSX
                                                        </span>
                                                    )}
                                                    {integration.badge === "New" && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                                                            <Sparkles className="w-3 h-3" />
                                                            New
                                                        </span>
                                                    )}
                                                    {integration.badge === "Trending" && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
                                                            <Flame className="w-3 h-3" />
                                                            Trending
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-600">
                                                    {integration.plan && (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
                                                            <ShieldCheck className="w-3 h-3" />
                                                            {integration.plan}
                                                        </span>
                                                    )}
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                                                        <Zap className="w-3 h-3" />
                                                        {integration.installs}
                                                    </span>
                                                </div>
                                            </div>
                                            <ExternalLink className="w-4 h-4 text-gray-400" />
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">{integration.description}</p>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <BadgeCheck className="w-4 h-4 text-gray-400" />
                                            Works with your workspace
                                            <Leaf className="w-4 h-4 text-emerald-500" />
                                            Auto-sync ready
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
