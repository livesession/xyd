import { MessageSquare, BarChart, Check, Plug, Search, MessageCircle, Signal, Rocket, Monitor } from 'lucide-react';

const integrations = [
    {
        name: 'LiveSession',
        icon: Monitor,
        color: 'text-indigo-600',
        features: ['Session replay integration', 'Track user friction in docs']
    },
    {
        name: 'Orama',
        icon: Search,
        color: 'text-orange-500',
        features: ['Next-gen semantic search', 'Instant indexing of docs']
    },
    {
        name: 'Algolia',
        icon: Search,
        color: 'text-blue-600',
        features: ['Pro-grade search engine', 'Advanced filtering and facets']
    },
    {
        name: 'Chatwoot',
        icon: MessageCircle,
        color: 'text-teal-500',
        features: ['Open-source customer support', 'Live chat integration']
    },
    {
        name: 'LiveChat',
        icon: MessageSquare,
        color: 'text-yellow-500',
        features: ['Premium messaging support', 'Real-time visitor monitoring']
    },
    {
        name: 'Intercom',
        icon: MessageSquare,
        color: 'text-blue-500',
        features: ['AI-powered customer service', 'Help center synchronization']
    },
    {
        name: 'GrowthBook',
        icon: BarChart,
        color: 'text-pink-600',
        features: ['Feature flagging for docs', 'A/B testing documentation']
    },
    {
        name: 'LaunchDarkly',
        icon: Rocket,
        color: 'text-gray-900',
        features: ['Enterprise feature management', 'Gradual rollout systems']
    },
    {
        name: 'SupaDemo',
        icon: Signal,
        color: 'text-orange-600',
        features: ['Interactive product demos', 'Embed auto-playing guides']
    }
];

export function Integrations() {
    return (
        <div className="relative min-h-full">
            {/* Main Content (Blurred) */}
            <div className="space-y-8 blur-[4px] pointer-events-none select-none opacity-40">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
                    <p className="text-sm text-gray-500 mt-1">Automatically keep your help center up to date using changes on external platforms.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {integrations.map((integration, idx) => (
                        <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-6">
                                <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center ${integration.color} border border-gray-100`}>
                                    <integration.icon className="w-5 h-5" />
                                </div>
                                <div className="font-semibold text-gray-900 text-sm">{integration.name}</div>
                            </div>

                            <ul className="space-y-3 flex-1 mb-6">
                                {integration.features.map((feature, i) => (
                                    <li key={i} className="flex gap-2 items-start text-xs text-gray-600 leading-relaxed">
                                        <Check className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span>{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="w-full bg-gray-50 border border-gray-100 text-gray-400 text-xs font-medium py-2 rounded-lg text-center">
                                Coming Soon
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-md px-10 py-12 rounded-3xl border border-gray-100 shadow-2xl text-center max-w-sm mx-auto transform translate-y-[-20px]">
                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 rotate-3 shadow-inner">
                        <Plug className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Integrations</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Connect your favorite tools to automate your documentation workflow. We're currently building our integration ecosystem.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200">
                        Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
}
