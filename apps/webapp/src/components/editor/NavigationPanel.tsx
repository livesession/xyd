import { useState } from 'react';
import { Book, Code, Clock, Plus, ChevronDown, MoreVertical, FileText, Zap, Settings, Folder } from 'lucide-react';

const tabs = [
  { id: 'docs', label: 'Documentation', icon: Book },
  { id: 'api', label: 'API Reference', icon: Code },
  { id: 'changelog', label: 'Changelog', icon: Clock },
];

interface NavigationPanelProps {
  onFileSelect?: (fileName: string) => void;
  activeFile?: string;
}

export function NavigationPanel({ onFileSelect, activeFile }: NavigationPanelProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Helper for item classes
  const getItemClass = (fileName: string) => {
      const isActive = activeFile === fileName;
      return isActive 
        ? "flex items-center gap-2 px-2 py-1.5 bg-gray-100 rounded-md text-sm font-medium text-gray-900 cursor-pointer"
        : "flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded-md text-sm text-gray-600 cursor-pointer transition-colors";
  };
    
  // Helper for icon colors
  const getIconClass = (fileName: string) => {
      return activeFile === fileName ? "w-4 h-4 text-gray-500" : "w-4 h-4 text-gray-400";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Tab Selector */}
      <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <button 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium text-gray-900 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <activeTab.icon className="w-4 h-4 text-gray-500" />
                    {activeTab.label}
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500">Tabs</div>
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab);
                                setIsDropdownOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                        >
                            <div className="flex items-center gap-2">
                                <tab.icon className="w-4 h-4 text-gray-500" />
                                <span className={`text-sm ${activeTab.id === tab.id ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                    {tab.label}
                                </span>
                            </div>
                            <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                        </button>
                    ))}
                    <div className="px-2 pt-1 mt-1 border-t border-gray-100">
                         <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-md">
                             <Plus className="w-4 h-4" />
                             New Tab
                         </button>
                    </div>
                </div>
            )}
          </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Getting Started Group */}
          <div>
              <div className="flex items-center justify-between mb-2 group">
                  <span className="text-xs font-semibold text-gray-500">Groups</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-0.5 hover:bg-gray-100 rounded"><Plus className="w-3 h-3 text-gray-500" /></button>
                      <button className="p-0.5 hover:bg-gray-100 rounded"><MoreVertical className="w-3 h-3 text-gray-500" /></button>
                  </div>
              </div>
               <div className="flex items-center justify-between mb-2 group">
                  <span className="text-xs font-bold text-gray-900">Getting Started</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-0.5 hover:bg-gray-100 rounded"><Plus className="w-3 h-3 text-gray-500" /></button>
                      <button className="p-0.5 hover:bg-gray-100 rounded"><MoreVertical className="w-3 h-3 text-gray-500" /></button>
                  </div>
              </div>

              <div className="space-y-0.5">
                  <div 
                    onClick={() => onFileSelect?.('introduction')}
                    className={getItemClass('introduction')}
                  >
                      <FileText className={getIconClass('introduction')} />
                      Introduction
                  </div>
                   <div 
                    onClick={() => onFileSelect?.('quickstart')}
                    className={getItemClass('quickstart')}
                   >
                      <Zap className={getIconClass('quickstart')} />
                      Quickstart
                  </div>
              </div>
          </div>

           {/* Guides Group */}
          <div>
               <div className="flex items-center justify-between mb-2 group">
                  <span className="text-xs font-bold text-gray-900">Guides</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-0.5 hover:bg-gray-100 rounded"><Plus className="w-3 h-3 text-gray-500" /></button>
                      <button className="p-0.5 hover:bg-gray-100 rounded"><MoreVertical className="w-3 h-3 text-gray-500" /></button>
                  </div>
              </div>

              <div className="space-y-0.5">
                  <div 
                    onClick={() => onFileSelect?.('organizing-documentation')}
                    className={getItemClass('organizing-documentation')}
                  >
                      <Folder className={getIconClass('organizing-documentation')} />
                      Organizing Documentation
                  </div>
                   <div 
                    onClick={() => onFileSelect?.('configuration')}
                    className={getItemClass('configuration')}
                   >
                      <Settings className={getIconClass('configuration')} />
                      Configuration
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
