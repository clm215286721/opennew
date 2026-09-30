import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, X, MapPin, Tag, Shield, AlertTriangle, Radio, 
  FileText, ArrowRight, CornerDownLeft, Sparkles, Compass, 
  Filter, Clock, Eye, ExternalLink, Hash, Check, Globe,
  Crosshair, ChevronRight, Layers, History, Trash2
} from 'lucide-react';
import { IntelReport, IntelCategory, ThreatLevel, ClassificationLevel } from '../types/intelligence';

interface GlobalSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  reports: IntelReport[];
  onNavigateToReport: (report: IntelReport, targetView: 'briefing' | 'situation' | 'ai-analyst') => void;
}

const POPULAR_SUGGESTIONS = [
  { label: '霍尔木兹海峡', type: 'location' },
  { label: '海底光缆', type: 'tag' },
  { label: 'APT-44', type: 'entity' },
  { label: 'SIGINT', type: 'category' },
  { label: 'GPS欺骗', type: 'tag' },
  { label: '高超音速', type: 'keyword' },
  { label: '斯瓦尔巴', type: 'location' },
  { label: '量子通信', type: 'keyword' },
];

export const GlobalSearchOverlay: React.FC<GlobalSearchOverlayProps> = ({
  isOpen,
  onClose,
  reports,
  onNavigateToReport,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedThreat, setSelectedThreat] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<string>('ALL');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('apex_intel_recent_searches');
      return saved ? JSON.parse(saved) : ['霍尔木兹', 'SCADA', 'SIGINT'];
    } catch {
      return ['霍尔木兹', 'SCADA', 'SIGINT'];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsListRef = useRef<HTMLDivElement>(null);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [isOpen]);

  // Extract unique locations from reports for the quick location filter
  const availableLocations = useMemo(() => {
    const locSet = new Set<string>();
    reports.forEach((r) => {
      // Extract main city/sea name from locationName (before parentheses)
      const base = r.locationName.split('(')[0].trim();
      if (base) locSet.add(base);
    });
    return Array.from(locSet);
  }, [reports]);

  // Save recent search
  const saveRecentSearch = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setRecentSearches((prev) => {
      const next = [trimmed, ...prev.filter((item) => item !== trimmed)].slice(0, 8);
      try {
        localStorage.setItem('apex_intel_recent_searches', JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('apex_intel_recent_searches');
    } catch {}
  };

  // Perform multi-dimensional search & filtering
  const filteredReports = useMemo(() => {
    const q = query.trim().toLowerCase();

    return reports.filter((report) => {
      // 1. Category filter
      if (selectedCategory !== 'ALL' && report.category !== selectedCategory) {
        return false;
      }

      // 2. Threat Level filter
      if (selectedThreat !== 'ALL' && report.threatLevel !== selectedThreat) {
        return false;
      }

      // 3. Classification filter
      if (selectedClassification !== 'ALL' && report.classification !== selectedClassification) {
        return false;
      }

      // 4. Status filter
      if (selectedStatus !== 'ALL' && report.status !== selectedStatus) {
        return false;
      }

      // 5. Location filter
      if (selectedLocation !== 'ALL' && !report.locationName.includes(selectedLocation)) {
        return false;
      }

      // 6. Text query search (matches keywords, location names, categories, entities, tags, codeName, id)
      if (!q) return true;

      const titleMatch = report.title.toLowerCase().includes(q);
      const summaryMatch = report.summary.toLowerCase().includes(q);
      const contentMatch = report.content.toLowerCase().includes(q);
      const codeNameMatch = report.codeName.toLowerCase().includes(q);
      const idMatch = report.id.toLowerCase().includes(q);
      const locationMatch = report.locationName.toLowerCase().includes(q);
      const categoryMatch = report.category.toLowerCase().includes(q);
      const findingsMatch = report.keyFindings.some((k) => k.toLowerCase().includes(q));
      const entitiesMatch = report.entities.some((e) => e.toLowerCase().includes(q));
      const tagsMatch = report.tags.some((t) => t.toLowerCase().includes(q));

      // Coordinate search: e.g. "26.56" or "56.25"
      const coordMatch =
        report.coordinates.lat.toString().includes(q) ||
        report.coordinates.lng.toString().includes(q);

      return (
        titleMatch ||
        summaryMatch ||
        contentMatch ||
        codeNameMatch ||
        idMatch ||
        locationMatch ||
        categoryMatch ||
        findingsMatch ||
        entitiesMatch ||
        tagsMatch ||
        coordMatch
      );
    });
  }, [
    reports,
    query,
    selectedCategory,
    selectedThreat,
    selectedClassification,
    selectedStatus,
    selectedLocation,
  ]);

  // Keep active index in bounds
  useEffect(() => {
    if (activeIndex >= filteredReports.length) {
      setActiveIndex(Math.max(0, filteredReports.length - 1));
    }
  }, [filteredReports.length, activeIndex]);

  // Handle Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < filteredReports.length - 1 ? prev + 1 : prev));
      scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
      scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredReports[activeIndex]) {
        saveRecentSearch(query || filteredReports[activeIndex].codeName);
        if (e.shiftKey) {
          onNavigateToReport(filteredReports[activeIndex], 'situation');
        } else {
          onNavigateToReport(filteredReports[activeIndex], 'briefing');
        }
        onClose();
      }
    }
  };

  const scrollActiveIntoView = () => {
    setTimeout(() => {
      const activeEl = resultsListRef.current?.querySelector('[data-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  };

  const handleSelectReportAction = (
    report: IntelReport,
    targetView: 'briefing' | 'situation' | 'ai-analyst'
  ) => {
    saveRecentSearch(query || report.codeName);
    onNavigateToReport(report, targetView);
    onClose();
  };

  const handleApplyQuickSearch = (keyword: string) => {
    setQuery(keyword);
    inputRef.current?.focus();
  };

  const clearFilters = () => {
    setSelectedCategory('ALL');
    setSelectedThreat('ALL');
    setSelectedClassification('ALL');
    setSelectedStatus('ALL');
    setSelectedLocation('ALL');
    setQuery('');
  };

  const hasActiveFilters =
    query.trim() !== '' ||
    selectedCategory !== 'ALL' ||
    selectedThreat !== 'ALL' ||
    selectedClassification !== 'ALL' ||
    selectedStatus !== 'ALL' ||
    selectedLocation !== 'ALL';

  if (!isOpen) return null;

  const activeReport = filteredReports[activeIndex] || null;

  const getThreatBadge = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL':
        return { label: 'CRITICAL', bg: 'bg-rose-950/80 border-rose-800 text-rose-400', dot: 'bg-rose-500' };
      case 'HIGH':
        return { label: 'HIGH', bg: 'bg-orange-950/80 border-orange-800 text-orange-400', dot: 'bg-orange-500' };
      case 'ELEVATED':
        return { label: 'ELEVATED', bg: 'bg-sky-950/80 border-sky-800 text-sky-400', dot: 'bg-sky-400' };
      case 'GUARDED':
        return { label: 'GUARDED', bg: 'bg-emerald-950/80 border-emerald-800 text-emerald-400', dot: 'bg-emerald-400' };
      default:
        return { label: 'LOW', bg: 'bg-slate-900 border-slate-700 text-slate-400', dot: 'bg-slate-400' };
    }
  };

  const getClassificationBadge = (lvl: ClassificationLevel): { label: string; bg: string; border: string } => {
    switch (lvl) {
      case 'TOP_SECRET':
        return { label: 'TOP SECRET', bg: 'bg-rose-500/10 text-rose-400', border: 'border-rose-500/30' };
      case 'SECRET':
        return { label: 'SECRET', bg: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/30' };
      case 'CONFIDENTIAL':
        return { label: 'CONFIDENTIAL', bg: 'bg-sky-500/10 text-sky-400', border: 'border-sky-500/30' };
      case 'RESTRICTED':
      default:
        return { label: 'RESTRICTED', bg: 'bg-slate-800 text-slate-400', border: 'border-slate-700' };
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-start justify-center pt-4 sm:pt-10 p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-[#090d16] border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden text-slate-100 font-sans relative"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Tactical Scanline & Top Accent */}
        <div className="h-1 bg-gradient-to-r from-amber-500 via-rose-500 to-cyan-500 w-full shrink-0" />

        {/* Search Header Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1422] flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-amber-400/90 font-semibold tracking-wider">
                APEX INTEL QUERY ENGINE // 全局多源情报深度检索
              </span>
              <span className="hidden md:inline text-slate-600">|</span>
              <span className="hidden md:inline text-slate-500">
                支持关键字、坐标、涉及战区及情报源智能穿透
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                库内情报: <span className="text-amber-400 font-semibold">{reports.length}</span> 份
              </span>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors cursor-pointer"
                title="关闭搜索 (ESC)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Input Box */}
          <div className="relative flex items-center">
            <div className="absolute left-3.5 flex items-center pointer-events-none text-amber-400">
              <Search className="w-5 h-5 stroke-[2.2]" />
            </div>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              placeholder="输入关键词、地理战区 (如: 霍尔木兹、法兰克福)、来源类别 (SIGINT、CYBER) 或代号..."
              className="w-full pl-11 pr-24 py-3 sm:py-3.5 bg-slate-950/80 border border-slate-700/80 rounded-lg text-slate-100 placeholder:text-slate-500 text-sm sm:text-base focus:outline-none focus:border-amber-400/80 focus:ring-1 focus:ring-amber-400/30 transition-all font-mono shadow-inner"
            />

            <div className="absolute right-3 flex items-center gap-2">
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveIndex(0);
                    inputRef.current?.focus();
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors text-xs font-mono"
                  title="清除输入"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-800/90 border border-slate-700 text-[10px] font-mono text-slate-400">
                <span>ESC</span>
              </div>
            </div>
          </div>

          {/* Dimension Filter Bar: Categories, Threat, Classification, Location */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-0.5">
              <span className="text-slate-500 text-[11px] font-mono shrink-0 mr-1">来源:</span>
              {[
                { id: 'ALL', label: '全部' },
                { id: 'GEOINT', label: 'GEOINT 卫星' },
                { id: 'SIGINT', label: 'SIGINT 信号' },
                { id: 'HUMINT', label: 'HUMINT 人力' },
                { id: 'OSINT', label: 'OSINT 开源' },
                { id: 'CYBER', label: 'CYBER 网络' },
                { id: 'MASINT', label: 'MASINT 特征' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    setActiveIndex(0);
                  }}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm shadow-amber-400/30'
                      : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Quick dropdown filters: Threat, Location, Classification */}
            <div className="flex items-center gap-2">
              {/* Threat Level */}
              <select
                value={selectedThreat}
                onChange={(e) => {
                  setSelectedThreat(e.target.value);
                  setActiveIndex(0);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-400 font-mono cursor-pointer"
                title="按威胁等级过滤"
              >
                <option value="ALL">全部威胁</option>
                <option value="CRITICAL">严重 (CRITICAL)</option>
                <option value="HIGH">高危 (HIGH)</option>
                <option value="ELEVATED">关注 (ELEVATED)</option>
                <option value="GUARDED">警戒 (GUARDED)</option>
              </select>

              {/* Location Theater */}
              <select
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setActiveIndex(0);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-400 font-mono cursor-pointer max-w-[130px] truncate"
                title="按事发战区地理位置过滤"
              >
                <option value="ALL">全部战区</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>

              {/* Classification */}
              <select
                value={selectedClassification}
                onChange={(e) => {
                  setSelectedClassification(e.target.value);
                  setActiveIndex(0);
                }}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-300 text-xs focus:outline-none focus:border-amber-400 font-mono cursor-pointer hidden md:block"
                title="按情报密级过滤"
              >
                <option value="ALL">全部密级</option>
                <option value="TOP_SECRET">绝密 TOP SECRET</option>
                <option value="SECRET">机密 SECRET</option>
                <option value="CONFIDENTIAL">秘密 CONFIDENTIAL</option>
              </select>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-amber-400 hover:text-amber-300 text-xs font-mono underline hover:no-underline ml-1 cursor-pointer whitespace-nowrap"
                >
                  重置筛选
                </button>
              )}
            </div>
          </div>

          {/* Quick Popular Keywords & Recent Searches row when query is empty */}
          {!query && (
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/80 text-[11px] font-mono text-slate-400">
              <span className="text-slate-500 flex items-center gap-1 shrink-0">
                <History className="w-3 h-3 text-slate-500" />
                近期关注:
              </span>
              {recentSearches.slice(0, 5).map((item) => (
                <button
                  key={item}
                  onClick={() => handleApplyQuickSearch(item)}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <span>{item}</span>
                </button>
              ))}

              <span className="text-slate-600 mx-1 hidden sm:inline">|</span>

              <span className="text-slate-500 hidden sm:flex items-center gap-1 shrink-0">
                <Crosshair className="w-3 h-3 text-amber-500/80" />
                热点战区/标签:
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto">
                {POPULAR_SUGGESTIONS.slice(0, 5).map((sug) => (
                  <button
                    key={sug.label}
                    onClick={() => handleApplyQuickSearch(sug.label)}
                    className="px-2 py-0.5 rounded bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800/80 transition-colors cursor-pointer text-[11px]"
                  >
                    #{sug.label}
                  </button>
                ))}
              </div>

              {recentSearches.length > 0 && (
                <button
                  onClick={clearRecentSearches}
                  className="ml-auto text-[10px] text-slate-500 hover:text-slate-400 flex items-center gap-1 cursor-pointer"
                  title="清空搜索历史"
                >
                  <Trash2 className="w-2.5 h-2.5" />
                  <span>清空历史</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results & Inspection Split View */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[380px] max-h-[58vh]">
          {/* Left Column: Results List (lg:col-span-7) */}
          <div
            ref={resultsListRef}
            className="lg:col-span-7 border-r border-slate-800 bg-[#090d16] flex flex-col h-full overflow-y-auto"
          >
            {/* List Status Header */}
            <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
              <div className="flex items-center gap-2">
                <span>检索结果</span>
                <span className="px-1.5 py-0.2 bg-amber-400/10 text-amber-400 rounded text-[11px] font-semibold border border-amber-400/20">
                  {filteredReports.length} 件相关情报
                </span>
              </div>
              <div className="text-[11px] text-slate-500 flex items-center gap-2">
                <span>↑↓ 键导航</span>
                <span>·</span>
                <span>回车直达研判简报</span>
              </div>
            </div>

            {/* List Content */}
            <div className="divide-y divide-slate-800/60 flex-1">
              {filteredReports.map((report, idx) => {
                const isActive = idx === activeIndex;
                const threat = getThreatBadge(report.threatLevel);
                const classBadge = getClassificationBadge(report.classification);

                return (
                  <div
                    key={report.id}
                    data-active={isActive ? 'true' : 'false'}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={() => handleSelectReportAction(report, 'briefing')}
                    className={`p-3.5 transition-all cursor-pointer text-left flex flex-col gap-2 relative ${
                      isActive
                        ? 'bg-slate-800/75 border-l-4 border-amber-400 pl-3'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Header Row: Codename, Classification, Threat */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-amber-400 font-semibold text-xs tracking-wide truncate">
                          {report.codeName}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500">
                          {report.id}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${classBadge.bg} ${classBadge.border}`}
                        >
                          {classBadge.label}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded border flex items-center gap-1 ${threat.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${threat.dot}`} />
                          <span>{threat.label}</span>
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-xs sm:text-sm font-semibold text-slate-100 line-clamp-2 leading-relaxed">
                      {report.title}
                    </h4>

                    {/* Location & Metadata Row */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-mono text-slate-400">
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate max-w-[220px]">{report.locationName}</span>
                      </div>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-300 font-semibold">{report.category}</span>
                      <span className="text-slate-600">·</span>
                      <span>信度 {report.sourceReliability}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-500">{report.timestamp}</span>
                    </div>

                    {/* Summary Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 font-sans leading-relaxed">
                      {report.summary}
                    </p>

                    {/* Direct Action Link Buttons */}
                    <div 
                      className="flex items-center justify-between pt-1 text-[11px] font-mono"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Tags / Entities preview */}
                      <div className="flex items-center gap-1 overflow-hidden max-w-[50%]">
                        {report.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="bg-slate-900 text-slate-400 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] truncate"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Direct jump buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleSelectReportAction(report, 'situation')}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 hover:border-amber-400/40 rounded transition-colors flex items-center gap-1 cursor-pointer"
                          title="在态势感知地图中定格此情报位置"
                        >
                          <Globe className="w-3 h-3 text-sky-400" />
                          <span className="hidden sm:inline">态势定位</span>
                        </button>

                        <button
                          onClick={() => handleSelectReportAction(report, 'briefing')}
                          className="px-2 py-1 bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded transition-colors flex items-center gap-1 cursor-pointer font-semibold"
                          title="在情报简报中心深入查阅与批阅"
                        >
                          <FileText className="w-3 h-3" />
                          <span>简报研判</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {filteredReports.length === 0 && (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="font-mono text-sm text-slate-300">
                    未检索到符合条件的防务情报
                  </div>
                  <p className="text-xs text-slate-500 max-w-sm">
                    请尝试更换查询关键词、地点名称（如：霍尔木兹、马六甲、法兰克福）或点击上方“重置筛选”恢复全局视野。
                  </p>
                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded text-xs font-mono transition-colors cursor-pointer"
                    >
                      清空检索与筛选条件
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Intel Detail Inspector Preview (lg:col-span-5) */}
          <div className="lg:col-span-5 bg-[#070b13] flex flex-col h-full overflow-y-auto border-t lg:border-t-0 border-slate-800 p-4 sm:p-5">
            {activeReport ? (
              <div className="flex flex-col gap-4">
                {/* Tactical Inspector Title Bar */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-2">
                    <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-amber-400 font-semibold">情报即时速览与穿透</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{activeReport.codeName}</span>
                </div>

                {/* Report Header Card */}
                <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg p-3.5 flex flex-col gap-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-mono font-bold text-sm">
                      {activeReport.codeName}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        getClassificationBadge(activeReport.classification).bg
                      } ${getClassificationBadge(activeReport.classification).border}`}
                    >
                      {activeReport.classification}
                    </span>
                  </div>

                  <h3 className="text-sm font-semibold text-slate-100 leading-snug">
                    {activeReport.title}
                  </h3>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono">
                    <div>
                      <span className="text-slate-500 block">战区位置</span>
                      <span className="text-slate-200 font-medium truncate block">
                        {activeReport.locationName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">大地坐标</span>
                      <span className="text-amber-300/90 font-medium block">
                        {activeReport.coordinates.lat}°N, {activeReport.coordinates.lng}°E
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">北约信度等级</span>
                      <span className="text-slate-200 font-medium block">
                        Admiralty {activeReport.sourceReliability}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">当前研判处置状态</span>
                      <span className="text-amber-400 font-semibold block">
                        {activeReport.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Key Findings Checklist */}
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-amber-400" />
                    <span>核心事实要点 (KEY FINDINGS):</span>
                  </div>
                  <div className="space-y-1.5">
                    {activeReport.keyFindings.map((finding, i) => (
                      <div
                        key={i}
                        className="bg-slate-900/40 border border-slate-800/60 rounded p-2 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-amber-400 font-mono text-[11px] shrink-0 mt-0.5">
                          0{i + 1}.
                        </span>
                        <span className="leading-relaxed">{finding}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Involved Target Entities */}
                <div>
                  <div className="text-xs font-mono text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-sky-400" />
                    <span>关联目标实体 (ENTITIES):</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReport.entities.map((entity) => (
                      <span
                        key={entity}
                        className="px-2 py-0.5 rounded bg-sky-950/60 text-sky-300 border border-sky-800/60 text-xs font-mono"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Priority Command Action */}
                {activeReport.priorityAction && (
                  <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-lg text-xs">
                    <span className="text-amber-400 font-mono font-semibold block mb-1">
                      ⚡ 指挥部优先应对建议:
                    </span>
                    <p className="text-slate-300 leading-relaxed">
                      {activeReport.priorityAction}
                    </p>
                  </div>
                )}

                {/* Action Buttons for Direct Navigation */}
                <div className="mt-auto pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSelectReportAction(activeReport, 'briefing')}
                      className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
                    >
                      <FileText className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>查看完整情报简报</span>
                    </button>

                    <button
                      onClick={() => handleSelectReportAction(activeReport, 'situation')}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                    >
                      <Globe className="w-3.5 h-3.5 text-sky-400" />
                      <span>在态势大屏定格</span>
                    </button>
                  </div>

                  <button
                    onClick={() => handleSelectReportAction(activeReport, 'ai-analyst')}
                    className="w-full px-3 py-2 bg-purple-950/60 hover:bg-purple-900/60 text-purple-200 border border-purple-800/60 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    <span>提交至 AI 研判推演室深度分析</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6">
                <Crosshair className="w-8 h-8 text-slate-700 mb-2 stroke-[1.5]" />
                <p>在左侧列表中移动选择情报以展开即时速览</p>
              </div>
            )}
          </div>
        </div>

        {/* Tactical Footer Shortcuts Bar */}
        <div className="px-4 py-2.5 bg-[#070a12] border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] font-mono text-slate-500 shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ↓
              </kbd>
              <span>选择项</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ↵ 回车
              </kbd>
              <span>简报研判</span>
            </span>

            <span className="flex items-center gap-1 hidden sm:inline-flex">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                Shift + ↵
              </kbd>
              <span>态势大屏定位</span>
            </span>

            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 text-[10px]">
                ESC
              </kbd>
              <span>退出检索</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>APEX TACTICAL SEARCH ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};
