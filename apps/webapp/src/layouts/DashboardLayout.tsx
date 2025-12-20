import { useState } from 'react';
import { LayoutDashboard, FileEdit, BarChart2, Plug, Server, Settings, HelpCircle, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-white font-sans text-gray-900">
      {/* Sidebar */}
      <aside
        className={`border-r border-gray-100 flex flex-col justify-between py-6 bg-[#fbfbfb]/50 relative transition-all duration-300 ${isCollapsed ? 'w-15 px-2' : 'w-64 px-4'
          }`}
      >
        <div>
          {/* Logo/Header */}
          <div className={`flex items-center gap-3 mb-8 ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}>
            {!isCollapsed ? (
              <>
                <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-sm">John Doe Docum...</div>
                  <div className="text-xs text-gray-500">Documentation</div>
                </div>
              </>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 py-2 text-sm font-medium rounded-lg transition-colors ${isCollapsed ? 'justify-center px-0' : 'px-3'
                    } ${isActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4">
          {!isCollapsed ? (
            <>
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
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Link to="/docs" className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg" title="Documentation">
                <HelpCircle className="w-4 h-4" />
              </Link>
              <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-50 rounded-lg" title="Chat with us">
                <MessageSquare className="w-4 h-4" />
              </button>
              <div className="pt-4 border-t border-gray-100 w-full flex justify-center">
                <div className="w-8 h-8 rounded-full bg-teal-500 flex items-center justify-center text-white font-medium text-xs">
                  J
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Button & Indicator Bar */}
        {/* <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 group">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-white border border-gray-200 rounded-full p-1.5 hover:bg-gray-50 transition-colors shadow-sm relative z-10"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3 h-3 text-gray-600" />
            ) : (
              <ChevronLeft className="w-3 h-3 text-gray-600" />
            )}
          </button>
        </div> */}

        {/* Visual Indicator Bar with Hover Effect - Full Height Clickable */}
        <div
          className="group p-1 absolute top-0 right-0 h-full cursor-col-resize flex items-center justify-center"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <div
            className="w-0.5 h-16 bg-gray-300 rounded-full group-hover:bg-blue-500 transition-colors"
          />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-white">
        <div className={location.pathname.startsWith('/editor') ? "h-full" : "h-full mx-auto px-10 py-8"}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
