import { LayoutDashboard, FileEdit, BarChart2, Plug, Server, Settings, HelpCircle, MessageSquare } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/' },
  { icon: FileEdit, label: 'Editor', path: '/editor' },
  { icon: BarChart2, label: 'Analytics', path: '/analytics' },
  { icon: Plug, label: 'Integrations', path: '/integrations' },
  { icon: Server, label: 'MCP Server', path: '/mcp' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-100 flex flex-col justify-between py-6 px-4 bg-[#fbfbfb]/50">
        <div>
          <div className="flex items-center gap-3 px-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-sm">John Doe Docum...</div>
              <div className="text-xs text-gray-500">Documentation</div>
            </div>
          </div>

          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="space-y-0.5">
            <Link to="/docs" className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
              <HelpCircle className="w-4 h-4" />
              Documentation
            </Link>
            <button className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg">
              <MessageSquare className="w-4 h-4" />
              Chat with us
            </button>
          </div>

          <div className="pt-4 border-t border-gray-100 px-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-xs">
                J
              </div>
              <div>
                <div className="text-sm font-medium">John Doe</div>
                <div className="text-xs text-gray-400">Johndoe@Gmail.c...</div>
              </div>
            </div>
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
            </svg>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        <div className={location.pathname.startsWith('/editor') ? "h-full" : "max-w-5xl mx-auto px-10 py-8"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
