

export function BillingSettings() {
    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-8">Billing & Subscription</h2>

            <div className="space-y-12">
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900">Billing plan</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-6">View and manage your billing plan</p>

                    <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                        <div className="space-y-1">
                            <div className="font-semibold text-gray-900 text-sm">Starter</div>
                            <div className="text-xs text-gray-500">Everything you need to get started with AI-powered docs.</div>
                        </div>
                        <button className="bg-[#1f1f1f] hover:bg-black text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                            Upgrade to Standard
                        </button>
                    </div>
                </div>

                <div>
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-medium text-gray-900">Plans</h3>
                            <p className="text-xs text-gray-500 mt-1">Upgrade or change your plan</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-gray-900">Save 20% yearly</span>
                            <button className="relative inline-flex h-5 w-9 items-center rounded-full bg-gray-200">
                                <span className="translate-x-0.5 inline-block h-4 w-4 transform rounded-full bg-white transition" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Starter */}
                        <div className="border border-gray-200 rounded-xl p-6 flex flex-col">
                            <h4 className="font-semibold text-gray-900 mb-4">Starter</h4>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold tracking-tight text-gray-900">$0</span>
                                <span className="text-sm text-gray-500">/ forever</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Everything you need to get started with AI-powered docs.</p>
                            <button className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 rounded-lg py-2 text-sm font-medium transition-colors mb-8">
                                Get Started
                            </button>
                            <div className="space-y-3 flex-1">
                                {['1 editor seat', '50 AI credits per month', 'Visual web editor & live Markdown render', 'Global search & advanced analytics', 'API Playground', 'Custom domain', 'MCP Server', 'SEO & LLM optimizations'].map((feature, i) => (
                                    <div key={i} className="flex gap-2 items-start text-xs text-gray-600">
                                        <span className="text-gray-400 mt-0.5">+</span> {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Standard */}
                        <div className="border border-gray-200 rounded-xl p-6 flex flex-col relative overflow-hidden">
                            <h4 className="font-semibold text-gray-900 mb-4">Standard</h4>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold tracking-tight text-gray-900">$39</span>
                                <span className="text-sm text-gray-500">/ monthly</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Great for solo builders and small teams shipping fast.</p>
                            <button className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-900 rounded-lg py-2 text-sm font-medium transition-colors mb-8">
                                Upgrade
                            </button>
                            <div className="space-y-3 flex-1">
                                {['Everything in Starter', '2 editor seats', '200 AI credits per month'].map((feature, i) => (
                                    <div key={i} className="flex gap-2 items-start text-xs text-gray-600">
                                        <span className="text-gray-400 mt-0.5">+</span> {feature}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Professional */}
                        <div className="border border-gray-200 rounded-xl p-6 flex flex-col">
                            <h4 className="font-semibold text-gray-900 mb-4">Professional</h4>
                            <div className="flex items-baseline gap-1 mb-2">
                                <span className="text-3xl font-bold tracking-tight text-gray-900">$99</span>
                                <span className="text-sm text-gray-500">/ monthly</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-6 leading-relaxed">Everything you need to run docs as a product.</p>
                            <button className="w-full bg-[#1f1f1f] hover:bg-black text-white rounded-lg py-2 text-sm font-medium transition-colors mb-8">
                                Upgrade
                            </button>
                            <div className="space-y-3 flex-1">
                                {['Everything in Standard', '5 editor seats', '500 AI credits per month', 'Render deployments for safe reviews', 'Role-based permissions', 'Private, password-protected docs', 'Dedicated CSM channel'].map((feature, i) => (
                                    <div key={i} className="flex gap-2 items-start text-xs text-gray-600">
                                        <span className="text-gray-400 mt-0.5">+</span> {feature}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                    <div className="space-y-1">
                        <div className="font-semibold text-gray-900 text-sm">Enterprise</div>
                        <div className="text-xs text-gray-500">Compliance, scale, and bespoke workflows.</div>
                        <div className="pt-2">
                            <div className="flex gap-2 items-center text-xs text-gray-600">
                                <span className="text-gray-400">+</span> Unlimited editor seats
                            </div>
                        </div>
                    </div>
                    <button className="bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Contact Sales
                    </button>
                </div>
            </div>
        </div>
    );
}
