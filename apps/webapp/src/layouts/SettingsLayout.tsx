import { Component, GitBranch, Github } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const settingsNav = [
  {
    category: 'Account Settings',
    items: [
      // { icon: Building2, label: 'Organization', path: '/settings/organization' },
      // { icon: Users, label: 'Members', path: '/settings/members' },
      // { icon: CreditCard, label: 'Billing', path: '/settings/billing' },
      { icon: Github, label: 'GitHub App', path: '/settings/github-app' },
    ],
  },
  {
    category: 'Git Settings',
    items: [
      { icon: GitBranch, label: 'Repositories', path: '/settings/repository' },
    ],
  },
  {
    category: 'Documentation Settings',
    items: [
      { icon: Component, label: 'General', path: '/settings/general' },
      // { icon: Globe, label: 'Domain Settings', path: '/settings/domains' },
    ],
  },

  // {
  //   category: 'My Organizations Settings',
  //   items: [
  //     { icon: Building2, label: 'Manage Organizations', path: '/settings/manage-organizations' },
  //   ]
  // },
  // {
  //   category: 'Account Settings',
  //   items: [
  //     { icon: Users, label: 'My Account', path: '/settings/account' },
  //   ]
  // }
];

export function SettingsLayout() {
  return (
    <div className="flex h-full">
      {/* Secondary Sidebar */}
      <aside className="w-64 flex-shrink-0 py-8 px-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">Settings</h2>
        <nav className="space-y-8">
          {settingsNav.map((section, idx) => (
            <div key={idx}>
              <h3 className="text-xs font-medium text-gray-500 mb-2 px-2 uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-0.5">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors ${isActive
                        ? 'bg-gray-100 text-gray-900 font-medium'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </aside>

      {/* Settings Content */}
      <div className="flex-1 py-10 px-12 overflow-auto">
        <div className="max-w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
