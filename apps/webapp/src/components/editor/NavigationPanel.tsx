import { useState } from 'react';
import { Book, Code, Clock, Plus, ChevronDown, MoreVertical, FileText, Zap, Settings, Folder } from 'lucide-react';
import { NAVIGATION_TABS } from '../../data/editorData';

const iconMap = {
    Book,
    Code,
    Clock,
    FileText,
    Zap,
    Settings,
    Folder,
};

interface NavigationPanelProps {
    onFileSelect?: (fileName: string) => void;
    activeFile?: string;
}

export function NavigationPanel({ onFileSelect, activeFile }: NavigationPanelProps) {
    const [activeTab, setActiveTab] = useState(NAVIGATION_TABS[0]);
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

    // Get icon component by name
    const getIconComponent = (iconName?: string) => {
        if (!iconName) return FileText;
        return iconMap[iconName as keyof typeof iconMap] || FileText;
    };

    // Get tab icon
    const getTabIcon = (tabId: string) => {
        switch (tabId) {
            case 'docs': return Book;
            case 'api': return Code;
            case 'changelog': return Clock;
            default: return Book;
        }
    };

    const TabIcon = getTabIcon(activeTab.id);

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
                            <TabIcon className="w-4 h-4 text-gray-500" />
                            {activeTab.label}
                        </div>
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500">Tabs</div>
                            {NAVIGATION_TABS.map((tab) => {
                                const Icon = getTabIcon(tab.id);
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => {
                                            setActiveTab(tab);
                                            setIsDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-gray-500" />
                                            <span className={`text-sm ${activeTab.id === tab.id ? 'font-medium text-gray-900' : 'text-gray-600'}`}>
                                                {tab.label}
                                            </span>
                                        </div>
                                        <MoreVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100" />
                                    </button>
                                );
                            })}
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
                {activeTab.groups.length > 0 && (
                    <div className="flex items-center justify-between mb-2 group">
                        <span className="text-xs font-semibold text-gray-500">Groups</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-0.5 hover:bg-gray-100 rounded"><Plus className="w-3 h-3 text-gray-500" /></button>
                            <button className="p-0.5 hover:bg-gray-100 rounded"><MoreVertical className="w-3 h-3 text-gray-500" /></button>
                        </div>
                    </div>
                )}

                {activeTab.groups.map((group) => (
                    <div key={group.id}>
                        <div className="flex items-center justify-between mb-2 group">
                            <span className="text-xs font-bold text-gray-900">{group.name}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-0.5 hover:bg-gray-100 rounded"><Plus className="w-3 h-3 text-gray-500" /></button>
                                <button className="p-0.5 hover:bg-gray-100 rounded"><MoreVertical className="w-3 h-3 text-gray-500" /></button>
                            </div>
                        </div>

                        <div className="space-y-0.5">
                            {group.items.map((item) => {
                                const ItemIcon = getIconComponent(item.icon);
                                // Calculate depth based on path (number of slashes)
                                const depth = (item.name.match(/\//g) || []).length;
                                const paddingLeft = depth > 0 ? `${depth * 12 + 8}px` : '8px';

                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => onFileSelect?.(item.name)}
                                        className={getItemClass(item.name)}
                                        style={{ paddingLeft }}
                                    >
                                        <ItemIcon className={getIconClass(item.name)} />
                                        {item.displayName}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
