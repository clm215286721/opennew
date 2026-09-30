import React, { useState, useEffect } from 'react';
import { Shield, Plus, Clock, Search } from 'lucide-react';

interface TopBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewIntel: () => void;
  onOpenGlobalSearch: () => void;
  unreadAlertCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewIntel,
  onOpenGlobalSearch,
  unreadAlertCount,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, '0');
      const minutes = String(now.getUTCMinutes()).padStart(2, '0');
      const seconds = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'situation', label: '态势感知' },
    { id: 'briefing', label: '情报简报' },
    { id: 'entity-graph', label: '实体图谱' },
    { id: 'ai-analyst', label: 'AI研判室' },
    { id: 'threat-matrix', label: '威胁矩阵' },
  ];

  return (
    <header className="h-14 border-b border-slate-800 bg-[#070a10]/90 backdrop-blur-md px-4 lg:px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5 text-amber-400 shrink-0" />
        <span className="font-semibold tracking-wider text-base lg:text-lg text-slate-100 uppercase select-none" style={{ fontFamily: 'var(--font-display)' }}>
          天玑战略情报研判平台
        </span>
      </div>

      {/* Zone 2: 4-6 clean text navigation links */}
      <nav className="flex items-center gap-1 md:gap-4 lg:gap-6 text-sm font-medium text-slate-400">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative py-1 px-2.5 transition-colors whitespace-nowrap text-xs lg:text-sm font-medium flex items-center gap-1.5 ${
                isActive
                  ? 'text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
              {item.id === 'threat-matrix' && unreadAlertCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Search + primary actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          onClick={onOpenGlobalSearch}
          className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-amber-400/50 text-slate-300 hover:text-slate-100 rounded text-xs transition-all font-mono group cursor-pointer shadow-sm"
          title="全局多源情报检索 (快捷键: ⌘K 或 /)"
        >
          <Search className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline text-slate-300">全局检索</span>
          <div className="hidden sm:flex items-center gap-0.5 text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/80 font-mono">
            <span>⌘K</span>
          </div>
        </button>

        <div className="hidden lg:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-400 border border-slate-800 bg-slate-900/60 px-2.5 py-1 rounded">
          <Clock className="w-3.5 h-3.5 text-slate-500" />
          <span>{utcTime || '00:00:00 UTC'}</span>
        </div>

        <button
          onClick={onOpenNewIntel}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors whitespace-nowrap active:scale-95 cursor-pointer shadow-sm shadow-amber-500/20"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>录入线索</span>
        </button>
      </div>
    </header>
  );
};
