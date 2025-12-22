import { BarChart2, Users, Eye, Clock, ArrowUpRight, ArrowDownRight, Globe, MousePointer2 } from 'lucide-react';

export function Analytics() {
    return (
        <div className="relative min-h-full">
            {/* Main Content (Blurred Dashboard) */}
            <div className="max-w-6xl mx-auto space-y-8 blur-[4px] pointer-events-none select-none opacity-40">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold text-gray-900">Analytics</h1>
                        <p className="text-sm text-gray-500 mt-1">Real-time insights into your documentation performance.</p>
                    </div>
                    <div className="flex gap-2">
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">Last 30 Days</div>
                        <div className="px-3 py-1.5 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">Export</div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Views', value: '45.2k', change: '+12.5%', icon: Eye, trend: 'up' },
                        { label: 'Unique Visitors', value: '12.8k', change: '+8.2%', icon: Users, trend: 'up' },
                        { label: 'Avg. Session', value: '4m 32s', change: '-2.4%', icon: Clock, trend: 'down' },
                        { label: 'Bounce Rate', value: '32.4%', change: '-4.1%', icon: MousePointer2, trend: 'down' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <div className="p-2 bg-gray-50 rounded-lg text-gray-500">
                                    <stat.icon className="w-4 h-4" />
                                </div>
                                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                                    {stat.change}
                                    {stat.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                            <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                        </div>
                    ))}
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col">
                        <div className="text-sm font-semibold mb-6 flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-gray-400" />
                            Traffic Overview
                        </div>
                        <div className="flex-1 flex items-end gap-2 px-2">
                            {[40, 70, 45, 90, 65, 80, 50, 60, 85, 40, 75, 55].map((h, i) => (
                                <div key={i} className="flex-1 bg-blue-100 rounded-t-sm" style={{ height: `${h}%` }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm min-h-[300px] flex flex-col">
                        <div className="text-sm font-semibold mb-6 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-gray-400" />
                            Top Locations
                        </div>
                        <div className="space-y-4">
                            {[
                                { country: 'United States', visits: '12,450', percent: '42%' },
                                { country: 'United Kingdom', visits: '4,120', percent: '14%' },
                                { country: 'Germany', visits: '3,840', percent: '12%' },
                                { country: 'India', visits: '2,100', percent: '7%' },
                            ].map((loc, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                        <span className="text-sm text-gray-600">{loc.country}</span>
                                    </div>
                                    <span className="text-sm font-medium text-gray-900">{loc.visits}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-auto">
                <div className="bg-white/80 backdrop-blur-md px-10 py-12 rounded-3xl border border-gray-100 shadow-2xl text-center max-w-sm mx-auto transform translate-y-[-20px]">
                    <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600 -rotate-3 shadow-inner">
                        <BarChart2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">Analytics</h2>
                    <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                        Get deep insights into how users interact with your docs. We're refining our tracking engine for maximum precision.
                    </p>
                    <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-200">
                        Coming Soon
                    </div>
                </div>
            </div>
        </div>
    );
}
