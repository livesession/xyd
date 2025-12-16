import { Github, Gitlab, MessageSquare, Headphones, Trello, BarChart, Check, Zap } from 'lucide-react';

const integrations = [
    {
        name: 'GitHub',
        icon: Github,
        color: 'text-gray-900',
        features: [
            'Publish and manage documentation from repositories',
            'Analyze code changes for automatic updates'
        ]
    },
    {
        name: 'GitLab',
        icon: Gitlab,
        color: 'text-orange-500',
        features: [
            'Publish and manage documentation from repositories',
            'Analyze code changes for automatic updates'
        ]
    },
    {
        name: 'Freshdesk',
        icon: Headphones, // Proxy icon
        color: 'text-emerald-500',
        features: [
            'Sync documentation to enhance AI responses',
            'Analyze tickets to update documentation'
        ]
    },
    {
        name: 'Intercom',
        icon: MessageSquare, // Proxy icon
        color: 'text-blue-500',
        features: [
            'Sync knowledge base to Intercom',
            'Analyze conversations to update documentation'
        ]
    },
    {
        name: 'Zendesk',
        icon: Zap, // Proxy icon
        color: 'text-green-900',
        features: [
            'Sync documentation to power Zendesk AI',
            'Analyze tickets to refine documentation'
        ]
    },
    {
        name: 'Jira',
        icon: Trello, // Proxy icon
        color: 'text-blue-600',
        features: [
            'Analyze product specs and workflows',
            'Automatic documentation updates'
        ]
    },
    {
        name: 'Linear',
        icon: Zap, // Proxy icon
        color: 'text-purple-500',
        features: [
            'Analyze product specs and workflows',
            'Automatic documentation updates'
        ]
    },
    {
        name: 'Google Analytics',
        icon: BarChart, // Proxy icon
        color: 'text-orange-400',
        features: [
            'Track documentation usage',
            'Monitor engagement and user behavior'
        ]
    }
];

export function Integrations() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Integrations</h1>
        <p className="text-sm text-gray-500 mt-1">Automatically keep your help center up to date using changes on external platforms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {integrations.map((integration, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-sm transition-shadow flex flex-col h-full">
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

                  <button className="w-full bg-white border border-gray-200 text-gray-400 text-xs font-medium py-2 rounded-lg cursor-not-allowed hover:bg-gray-50">
                      Coming Soon
                  </button>
              </div>
          ))}
      </div>
    </div>
  );
}
