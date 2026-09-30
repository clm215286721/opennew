import React, { useState, useMemo } from 'react';
import { 
  IntelReport, TargetEntity, ThreatLevel, ClassificationLevel 
} from '../types/intelligence';
import { 
  Network, Clock, ArrowRight, Shield, AlertTriangle, 
  Layers, ExternalLink, Calendar, Filter, Sparkles, 
  CheckCircle2, ChevronRight, GitBranch, Share2, 
  Search, RefreshCw, Eye, ArrowUpDown, Tag, Info
} from 'lucide-react';

export interface EntityRelevanceTimelineProps {
  currentReport: IntelReport;
  allReports: IntelReport[];
  entities: TargetEntity[];
  onSelectReportToAnalyze: (report: IntelReport) => void;
  onSelectIntelReportById?: (reportId: string) => void;
}

export interface CorrelatedReportItem {
  report: IntelReport;
  relevanceScore: number; // 0 - 100
  relevanceLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  directMatches: string[];
  indirectLinks: {
    fromEntity: string;
    toEntity: string;
    relation: string;
    via?: string;
  }[];
  sharedTags: string[];
  locationProximity: boolean;
  categoryMatch: boolean;
  timeDiffHours: number;
}

// Strip extraneous symbols or English brackets for normalized entity matching
const normalizeEntityName = (name: string): string => {
  return name.split('(')[0].split('（')[0].trim().toLowerCase();
};

export const EntityRelevanceTimeline: React.FC<EntityRelevanceTimelineProps> = ({
  currentReport,
  allReports,
  entities,
  onSelectReportToAnalyze,
  onSelectIntelReportById,
}) => {
  const [minScoreFilter, setMinScoreFilter] = useState<number>(30);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // desc = newest first
  const [selectedCorrelatedId, setSelectedCorrelatedId] = useState<string | null>(null);

  // Parse report date into timestamp number for chronological ordering
  const parseReportTime = (timeStr: string): number => {
    // E.g. "2026-09-30 06:14 UTC" or "2026-09-29 18:40 UTC"
    const match = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, h, min] = match;
      return Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min));
    }
    return Date.now();
  };

  const currentTimeMs = useMemo(() => parseReportTime(currentReport.timestamp), [currentReport.timestamp]);

  // Compute entity correlation and relevance scores
  const correlatedReports = useMemo(() => {
    const currentNormEntities = currentReport.entities.map(normalizeEntityName);
    const results: CorrelatedReportItem[] = [];

    // Map all TargetEntity entries for graph lookup
    const entityByName = new Map<string, TargetEntity>();
    entities.forEach((ent) => {
      entityByName.set(normalizeEntityName(ent.name), ent);
      if (ent.codeName) {
        entityByName.set(normalizeEntityName(ent.codeName), ent);
      }
    });

    allReports.forEach((other) => {
      if (other.id === currentReport.id) return;

      const otherNormEntities = other.entities.map(normalizeEntityName);
      let score = 0;
      const directMatches: string[] = [];
      const indirectLinks: CorrelatedReportItem['indirectLinks'] = [];

      // 1. Direct Entity Overlap (1-hop exact / substring matches)
      currentReport.entities.forEach((cEnt) => {
        const cNorm = normalizeEntityName(cEnt);
        other.entities.forEach((oEnt) => {
          const oNorm = normalizeEntityName(oEnt);
          if (cNorm === oNorm || cNorm.includes(oNorm) || oNorm.includes(cNorm)) {
            if (!directMatches.includes(oEnt)) {
              directMatches.push(oEnt);
              score += 42; // Strong direct weight
            }
          }
        });
      });

      // 2. Transitive / Graph Entity Relationships (2-hop via TargetEntity link graph)
      currentNormEntities.forEach((cNorm) => {
        // Find corresponding TargetEntity in knowledge graph
        let matchedTarget: TargetEntity | undefined;
        for (const [key, ent] of entityByName.entries()) {
          if (key === cNorm || key.includes(cNorm) || cNorm.includes(key)) {
            matchedTarget = ent;
            break;
          }
        }

        if (matchedTarget && matchedTarget.linkedEntityIds) {
          matchedTarget.linkedEntityIds.forEach((link) => {
            const linkedTarget = entities.find((e) => e.id === link.targetId);
            if (!linkedTarget) return;

            const linkedNorm = normalizeEntityName(linkedTarget.name);

            // Check if other report contains this linked entity
            const matchInOther = other.entities.find((oEnt) => {
              const oNorm = normalizeEntityName(oEnt);
              return oNorm === linkedNorm || oNorm.includes(linkedNorm) || linkedNorm.includes(oNorm);
            });

            if (matchInOther) {
              indirectLinks.push({
                fromEntity: matchedTarget!.name,
                toEntity: linkedTarget.name,
                relation: link.relation,
              });
              score += 32; // Strong relational graph edge
            } else {
              // 3-hop check: does linkedTarget connect to any entity in other report?
              if (linkedTarget.linkedEntityIds) {
                linkedTarget.linkedEntityIds.forEach((secondLink) => {
                  const secondTarget = entities.find((e) => e.id === secondLink.targetId);
                  if (!secondTarget) return;
                  const secondNorm = normalizeEntityName(secondTarget.name);

                  const matchInOther2 = other.entities.find((oEnt) => {
                    const oNorm = normalizeEntityName(oEnt);
                    return oNorm === secondNorm || oNorm.includes(secondNorm) || secondNorm.includes(oNorm);
                  });

                  if (matchInOther2) {
                    indirectLinks.push({
                      fromEntity: matchedTarget!.name,
                      toEntity: secondTarget.name,
                      relation: `${link.relation} → ${secondLink.relation}`,
                      via: linkedTarget.name,
                    });
                    score += 20;
                  }
                });
              }
            }
          });
        }
      });

      // 3. Shared Tags correlation
      const sharedTags = currentReport.tags.filter((t) => other.tags.includes(t));
      score += sharedTags.length * 8;

      // 4. Category & Location Proximity
      const categoryMatch = currentReport.category === other.category;
      if (categoryMatch) score += 10;

      // Coordinates distance approx
      const dLat = Math.abs(currentReport.coordinates.lat - other.coordinates.lat);
      const dLng = Math.abs(currentReport.coordinates.lng - other.coordinates.lng);
      const locationProximity = dLat < 8 && dLng < 15;
      if (locationProximity) score += 14;

      // Only include if there is any entity match, graph link, or high contextual correlation
      if (directMatches.length > 0 || indirectLinks.length > 0 || score >= 20) {
        // Calculate normalized percentage (cap at 98%, floor at 15%)
        const finalScore = Math.min(98, Math.max(18, score));

        let relevanceLevel: CorrelatedReportItem['relevanceLevel'] = 'LOW';
        if (finalScore >= 80) relevanceLevel = 'CRITICAL';
        else if (finalScore >= 60) relevanceLevel = 'HIGH';
        else if (finalScore >= 40) relevanceLevel = 'MODERATE';

        const otherTimeMs = parseReportTime(other.timestamp);
        const timeDiffHours = Math.round((currentTimeMs - otherTimeMs) / (1000 * 60 * 60));

        results.push({
          report: other,
          relevanceScore: finalScore,
          relevanceLevel,
          directMatches,
          indirectLinks,
          sharedTags,
          locationProximity,
          categoryMatch,
          timeDiffHours,
        });
      }
    });

    // Sort by timeline
    results.sort((a, b) => {
      const timeA = parseReportTime(a.report.timestamp);
      const timeB = parseReportTime(b.report.timestamp);
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return results;
  }, [currentReport, allReports, entities, sortOrder, currentTimeMs]);

  // Filtered by min score threshold
  const filteredTimeline = useMemo(() => {
    return correlatedReports.filter((item) => item.relevanceScore >= minScoreFilter);
  }, [correlatedReports, minScoreFilter]);

  const activeCorrelatedItem = useMemo(() => {
    if (!selectedCorrelatedId) return filteredTimeline[0] || null;
    return filteredTimeline.find((i) => i.report.id === selectedCorrelatedId) || filteredTimeline[0] || null;
  }, [filteredTimeline, selectedCorrelatedId]);

  const getRelevanceBadge = (score: number, level: CorrelatedReportItem['relevanceLevel']) => {
    switch (level) {
      case 'CRITICAL':
        return {
          label: '直接涉案同源 (CRITICAL)',
          bg: 'bg-rose-950/80 border-rose-700/80 text-rose-300',
          ring: 'ring-rose-500/50',
          dot: 'bg-rose-500',
        };
      case 'HIGH':
        return {
          label: '拓扑穿透关联 (HIGH)',
          bg: 'bg-amber-950/80 border-amber-700/80 text-amber-300',
          ring: 'ring-amber-500/50',
          dot: 'bg-amber-500',
        };
      case 'MODERATE':
        return {
          label: '网络协同关联 (MODERATE)',
          bg: 'bg-sky-950/80 border-sky-700/80 text-sky-300',
          ring: 'ring-sky-500/50',
          dot: 'bg-sky-400',
        };
      default:
        return {
          label: '共性线索关联 (LOW)',
          bg: 'bg-slate-900 border-slate-700 text-slate-400',
          ring: 'ring-slate-600',
          dot: 'bg-slate-400',
        };
    }
  };

  const getThreatColor = (lvl: ThreatLevel) => {
    switch (lvl) {
      case 'CRITICAL': return 'text-rose-400 bg-rose-950/60 border-rose-800';
      case 'HIGH': return 'text-orange-400 bg-orange-950/60 border-orange-800';
      case 'ELEVATED': return 'text-sky-400 bg-sky-950/60 border-sky-800';
      case 'GUARDED': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      default: return 'text-slate-400 bg-slate-900 border-slate-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#070b13] border border-slate-800/90 rounded-xl overflow-hidden shadow-2xl">
      {/* Top Tactical Banner */}
      <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-800 bg-[#0a0f1c] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100 font-display">
                基于实体关联的情报相关度时序演化
              </h3>
              <span className="px-1.5 py-0.2 bg-amber-400/15 border border-amber-400/30 text-amber-400 text-[10px] font-mono rounded font-semibold">
                ENTITIES RELEVANCE GRAPH
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              依据涉案目标实体一阶重合度与多跳关系图谱，自动溯源历史电报链条
            </p>
          </div>
        </div>

        {/* Filter & Sorting Controls */}
        <div className="flex items-center gap-2">
          {/* Min Score Filter Chips */}
          <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-1 rounded">
            <Filter className="w-3 h-3 text-slate-500 mr-0.5" />
            <span>门槛:</span>
            {[
              { label: '全部', value: 0 },
              { label: '≥40%', value: 40 },
              { label: '≥60% 高关', value: 60 },
              { label: '≥80% 极强', value: 80 },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setMinScoreFilter(f.value)}
                className={`px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                  minScoreFilter === f.value
                    ? 'bg-amber-400 text-slate-950 font-bold'
                    : 'hover:text-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Sort Order Toggle */}
          <button
            onClick={() => setSortOrder((o) => (o === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded transition-colors cursor-pointer"
            title="切换时间排序"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{sortOrder === 'desc' ? '倒序时序 (最新在前)' : '正序时序 (历史沿革)'}</span>
          </button>
        </div>
      </div>

      {/* Currently Analyzed Report Summary Bar */}
      <div className="p-3 bg-[#0d1322] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-slate-500 uppercase shrink-0">当前研判基准电报:</span>
          <span className="text-amber-400 font-bold truncate max-w-[200px]">
            {currentReport.codeName}
          </span>
          <span className="text-slate-400 hidden md:inline truncate max-w-[340px]">
            · {currentReport.title}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500">实体探针:</span>
          <div className="flex items-center gap-1 overflow-x-auto max-w-[280px]">
            {currentReport.entities.map((ent) => (
              <span
                key={ent}
                className="px-1.5 py-0.2 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 text-[10px] truncate"
              >
                {ent.split('(')[0]}
              </span>
            ))}
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-semibold">
            匹配到 {filteredTimeline.length} 份关联情报
          </span>
        </div>
      </div>

      {/* Main Split Content: Left Timeline List, Right Association Bridge Detail */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-[460px]">
        {/* Left Column: Vertical Chronological Timeline (lg:col-span-7) */}
        <div className="lg:col-span-7 border-r border-slate-800 bg-[#090d16] flex flex-col h-full overflow-y-auto p-4">
          <div className="relative border-l-2 border-slate-800/80 ml-3 sm:ml-5 space-y-6 pb-6">
            {filteredTimeline.map((item, idx) => {
              const isSelected = activeCorrelatedItem?.report.id === item.report.id;
              const badge = getRelevanceBadge(item.relevanceScore, item.relevanceLevel);
              const threatBadge = getThreatColor(item.report.threatLevel);

              return (
                <div
                  key={item.report.id}
                  onClick={() => setSelectedCorrelatedId(item.report.id)}
                  className={`relative pl-6 sm:pl-7 transition-all cursor-pointer group ${
                    isSelected ? 'opacity-100' : 'opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* Timeline Dot on the spine */}
                  <div
                    className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 bg-[#090d16] flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-amber-400 ring-4 ring-amber-400/20 scale-110'
                        : 'border-slate-600 group-hover:border-amber-400/80'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  </div>

                  {/* Timeline Event Card */}
                  <div
                    className={`p-3.5 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-slate-850/80 border-amber-400/60 shadow-lg shadow-amber-400/10'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    {/* Header: Timestamp, Codename, Relevance Pill */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs font-mono">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {item.report.timestamp}
                        </span>
                        {item.timeDiffHours !== 0 && (
                          <span className="text-[10px] text-slate-500">
                            ({item.timeDiffHours > 0 ? `${item.timeDiffHours}小时前` : '后续事件'})
                          </span>
                        )}
                      </div>

                      {/* Glowing Relevance Score Tag */}
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border flex items-center gap-1.5 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot} animate-pulse`} />
                          <span>相关度: {item.relevanceScore}%</span>
                        </span>
                      </div>
                    </div>

                    {/* Report Codename & Title */}
                    <div className="mb-2">
                      <div className="flex items-center gap-2 text-xs font-mono">
                        <span className="font-bold text-amber-400">
                          {item.report.codeName}
                        </span>
                        <span className="text-slate-500">{item.report.id}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${threatBadge}`}>
                          {item.report.threatLevel}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-semibold text-slate-100 mt-1 leading-snug">
                        {item.report.title}
                      </h4>
                    </div>

                    {/* Entity Bridge Callout Box */}
                    {(item.directMatches.length > 0 || item.indirectLinks.length > 0) && (
                      <div className="p-2.5 rounded bg-slate-950/70 border border-slate-800 text-xs font-mono space-y-1.5 mb-2">
                        {item.directMatches.length > 0 && (
                          <div className="flex items-start gap-1.5 text-amber-300">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold shrink-0 mt-0.5">
                              直接同源
                            </span>
                            <span className="text-slate-200">
                              共同涉及实体: {item.directMatches.join(' · ')}
                            </span>
                          </div>
                        )}

                        {item.indirectLinks.length > 0 && (
                          <div className="flex flex-col gap-1 text-sky-300 text-[11px]">
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold self-start">
                              多跳图谱穿透
                            </span>
                            {item.indirectLinks.slice(0, 2).map((link, lIdx) => (
                              <div key={lIdx} className="flex items-center gap-1.5 text-slate-300 font-mono">
                                <span className="text-slate-200 font-semibold">{link.fromEntity}</span>
                                <span className="text-sky-400 font-bold">──[{link.relation}]──&gt;</span>
                                <span className="text-slate-200 font-semibold">{link.toEntity}</span>
                                {link.via && <span className="text-slate-500 text-[10px]">(经由: {link.via})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Summary Snippet */}
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2">
                      {item.report.summary}
                    </p>

                    {/* Action buttons on card */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px] font-mono">
                      <span className="text-slate-500 truncate max-w-[200px]">
                        战区: {item.report.locationName.split('(')[0]}
                      </span>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectReportToAnalyze(item.report)}
                          className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-semibold text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                          title="将此份历史电报加载为分析对象进行回溯推演"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>切换研判</span>
                        </button>

                        {onSelectIntelReportById && (
                          <button
                            onClick={() => onSelectIntelReportById(item.report.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-slate-100 rounded border border-slate-700 text-[11px] transition-colors flex items-center gap-1 cursor-pointer"
                            title="在情报简报中查阅原始案卷"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>查看简报</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredTimeline.length === 0 && (
              <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
                <Network className="w-8 h-8 text-slate-700 stroke-[1.5]" />
                <p className="text-xs font-mono text-slate-400">
                  当前门槛 (≥{minScoreFilter}%) 下未检测到强相关历史电报
                </p>
                <button
                  onClick={() => setMinScoreFilter(0)}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded font-mono cursor-pointer"
                >
                  降低过滤门槛显示全部
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Relational Bridge & Evidence Chain Inspector (lg:col-span-5) */}
        <div className="lg:col-span-5 bg-[#070b13] flex flex-col h-full overflow-y-auto p-4 sm:p-5">
          {activeCorrelatedItem ? (
            <div className="flex flex-col gap-4">
              {/* Tactical Inspector Title */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
                  <Share2 className="w-3.5 h-3.5" />
                  <span>实体关联链溯源推演 (EVIDENCE CHAIN)</span>
                </div>
                <span className="text-slate-500 font-mono">
                  {activeCorrelatedItem.report.codeName}
                </span>
              </div>

              {/* Relevance Score Detailed Breakdown */}
              <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-lg flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400 uppercase">综合情报关联度指数</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-amber-400 tabular-nums">
                      {activeCorrelatedItem.relevanceScore}%
                    </span>
                    <span className="text-[10px] text-slate-400">MATCH</span>
                  </div>
                </div>

                {/* Score Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-rose-500 transition-all duration-500 rounded-full"
                    style={{ width: `${activeCorrelatedItem.relevanceScore}%` }}
                  />
                </div>

                {/* Breakdown criteria pills */}
                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block">直接实体重合</span>
                    <span className="text-slate-200 font-bold">
                      {activeCorrelatedItem.directMatches.length} 处匹配
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block">图谱多跳关联</span>
                    <span className="text-sky-400 font-bold">
                      {activeCorrelatedItem.indirectLinks.length} 条关系弧
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block">共同作战标签</span>
                    <span className="text-slate-200 font-bold">
                      {activeCorrelatedItem.sharedTags.length} 个重合
                    </span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800/80">
                    <span className="text-slate-500 block">战区邻近度</span>
                    <span className={activeCorrelatedItem.locationProximity ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {activeCorrelatedItem.locationProximity ? '同战区协同' : '跨战区关联'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Visual Entity Graph Bridge */}
              <div className="p-3.5 bg-[#0b101c] border border-slate-800 rounded-lg flex flex-col gap-2">
                <span className="text-xs font-mono text-amber-400 font-semibold flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>实体网络推演逻辑链路:</span>
                </span>

                {activeCorrelatedItem.directMatches.length > 0 && (
                  <div className="p-2.5 rounded bg-slate-950 border border-amber-500/20 text-xs font-mono">
                    <span className="text-amber-400 font-semibold block mb-1">
                      [核心同源] 共同直接涉案实体:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCorrelatedItem.directMatches.map((m) => (
                        <span
                          key={m}
                          className="px-2 py-0.5 rounded bg-amber-400/10 text-amber-300 border border-amber-400/30 font-bold"
                        >
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {activeCorrelatedItem.indirectLinks.length > 0 && (
                  <div className="space-y-2 mt-1">
                    <span className="text-xs font-mono text-slate-400 block">
                      [图谱穿透] 经由组织/资产拓扑关联路径:
                    </span>
                    {activeCorrelatedItem.indirectLinks.map((link, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded bg-slate-950 border border-sky-500/30 text-xs font-mono flex flex-col gap-1.5"
                      >
                        <div className="flex items-center gap-1.5 text-slate-200">
                          <span className="text-amber-300 font-semibold">{link.fromEntity}</span>
                          <span className="text-slate-500">→</span>
                          <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-800 text-[10px]">
                            {link.relation}
                          </span>
                          <span className="text-slate-500">→</span>
                          <span className="text-emerald-300 font-semibold">{link.toEntity}</span>
                        </div>
                        {link.via && (
                          <div className="text-[11px] text-slate-500">
                            穿透中继实体: <span className="text-slate-300">{link.via}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Historical Report Dossier Preview */}
              <div className="p-3.5 bg-slate-900/40 border border-slate-800 rounded-lg flex flex-col gap-2">
                <span className="text-xs font-mono text-slate-400 uppercase font-semibold">
                  关联情报核心事实要点 (KEY FINDINGS)
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 font-sans">
                  {activeCorrelatedItem.report.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                      <span className="text-amber-400 font-mono text-[11px] mt-0.5">[{idx + 1}]</span>
                      <span className="leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom CTA to switch analysis or view briefing */}
              <div className="mt-auto pt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onSelectReportToAnalyze(activeCorrelatedItem.report)}
                  className="px-3 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>切换为当前研判对象</span>
                </button>

                {onSelectIntelReportById && (
                  <button
                    onClick={() => onSelectIntelReportById(activeCorrelatedItem.report.id)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                    <span>打开完整案卷简报</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-xs p-6">
              <Network className="w-10 h-10 text-slate-700 mb-2 stroke-[1.5]" />
              <p>在左侧时序链中点击任一节点以展示详细关联穿透链条</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
