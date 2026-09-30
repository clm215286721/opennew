import React, { useState } from 'react';
import { 
  FileText, Sparkles, Shield, AlertTriangle, Download, 
  Printer, RefreshCw, X, Check, Compass, Radio, 
  Layers, ExternalLink, Globe, Crosshair, ChevronRight 
} from 'lucide-react';
import { IntelReport } from '../types/intelligence';

export interface DailyIntelBriefData {
  briefSerial: string;
  period: string;
  executiveSummary: string;
  overallDefcon: string;
  overallThreatLevel: string;
  strategicHighlights: {
    title: string;
    theater: string;
    assessment: string;
    severity: 'CRITICAL' | 'HIGH' | 'ELEVATED';
    primaryActor: string;
  }[];
  crossDomainAnalysis: {
    maritimeUndersea: string;
    cyberInfrastructure: string;
    aerospaceElectromagnetic: string;
  };
  keyEntityWatchlist: {
    name: string;
    status: string;
    activity24h: string;
    threatScore: number;
  }[];
  recommendedDirectives: string[];
  metrics: {
    totalReportsProcessed: number;
    criticalAlertsCount: number;
    activeTheatersCount: number;
    admiraltyReliabilityAvg: string;
  };
}

interface DailyIntelBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  reports24h: IntelReport[];
  briefData: DailyIntelBriefData | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onSendToAIAnalyst?: () => void;
}

export const DailyIntelBriefModal: React.FC<DailyIntelBriefModalProps> = ({
  isOpen,
  onClose,
  reports24h,
  briefData,
  isLoading,
  onRegenerate,
  onSendToAIAnalyst,
}) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ALL' | 'HIGHLIGHTS' | 'CROSS_DOMAIN' | 'DIRECTIVES'>('ALL');

  if (!isOpen) return null;

  const handleExportText = () => {
    if (!briefData) return;
    const content = `========================================================================
天玑战略情报研判系统 - 24小时综合防务情报日报 (DAILY INTELLIGENCE BRIEF)
密级: TOP SECRET // SI-TK // APEX COMMAND
简报编号: ${briefData.briefSerial}
监测周期: ${briefData.period}
战备等级: ${briefData.overallDefcon} | 威胁定级: ${briefData.overallThreatLevel}
生成时间: ${new Date().toISOString()}
========================================================================

【一、核心战略战术综述 (BLUF)】
${briefData.executiveSummary}

【二、综合态势指标】
- 处理电报批次: ${briefData.metrics.totalReportsProcessed} 份
- 严重预警事件: ${briefData.metrics.criticalAlertsCount} 起
- 涉及战略战区: ${briefData.metrics.activeTheatersCount} 个
- 北约信度均值: ${briefData.metrics.admiraltyReliabilityAvg}

【三、24小时战略要情综览】
${briefData.strategicHighlights
  .map(
    (h, i) =>
      `[${i + 1}] 【${h.theater}】 ${h.title} (${h.severity})
     - 关联实体: ${h.primaryActor}
     - 深度研判: ${h.assessment}`
  )
  .join('\n\n')}

【四、多域联动作战态势评估】
1. 海洋水下与咽喉航道:
   ${briefData.crossDomainAnalysis.maritimeUndersea}

2. 关键基础设施与工控网络:
   ${briefData.crossDomainAnalysis.cyberInfrastructure}

3. 空天轨道与电子电磁侦搜:
   ${briefData.crossDomainAnalysis.aerospaceElectromagnetic}

【五、24小时重点监控实体动态】
${briefData.keyEntityWatchlist
  .map((e, i) => `${i + 1}. ${e.name} (评分: ${e.threatScore}分 · 状态: ${e.status}) - ${e.activity24h}`)
  .join('\n')}

【六、指挥部联合战备指令】
${briefData.recommendedDirectives.map((d, i) => `${i + 1}. ${d}`).join('\n')}

========================================================================
天玑战略防务情报分析中枢 · 联合参谋部情报局 (J-2)
========================================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DAILY_INTEL_BRIEF_${briefData.briefSerial}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    if (!briefData) return;
    navigator.clipboard.writeText(briefData.executiveSummary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#090d16] border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-5xl my-4 flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Tactical Banner */}
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-500 h-1.5 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1424] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-amber-400/15 border border-amber-400/30 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold tracking-wider">
                  TOP SECRET // NOFORN
                </span>
                <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider">
                  {briefData?.briefSerial || 'JIC-DAILY-PROCESSING'}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide mt-0.5 font-display">
                全域24小时综合防务情报日报 (DAILY INTELLIGENCE BRIEF)
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRegenerate}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded transition-colors cursor-pointer disabled:opacity-50"
              title="使用大模型重新汇总提炼最近24小时多源电报"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? '研判生成中...' : '重新生成'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="关闭 (ESC)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="p-12 sm:p-16 flex flex-col items-center justify-center text-center gap-4 bg-[#080c15]">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-amber-400 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-md">
              <h3 className="text-sm font-semibold text-slate-200 font-mono">
                GEMINI 3.8 FLASH 正在调度多源电报生成日报...
              </h3>
              <p className="text-xs text-slate-400 font-mono leading-relaxed">
                正在汇聚过去24小时内截获的 {reports24h.length} 份战略电报，交叉核验水下光缆、工控SCADA、雷达遥测及暗网资金流...
              </p>
            </div>
          </div>
        ) : briefData ? (
          <div className="flex-1 overflow-y-auto max-h-[75vh] p-4 sm:p-6 space-y-5 bg-[#080c15]">
            {/* Top Period & Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono">
              <div className="p-3 bg-[#0d1322] border border-slate-800/90 rounded-lg flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase">监测全域窗口</span>
                <span className="text-slate-200 font-semibold truncate text-[11px]">
                  {briefData.period}
                </span>
              </div>
              <div className="p-3 bg-[#0d1322] border border-slate-800/90 rounded-lg flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase">综合战备防御级</span>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-amber-400 font-bold text-sm">
                    {briefData.overallDefcon}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-[#0d1322] border border-slate-800/90 rounded-lg flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase">24H入库电报</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-slate-100 tabular-nums">
                    {briefData.metrics.totalReportsProcessed}
                  </span>
                  <span className="text-[10px] text-slate-500">份 (严重: {briefData.metrics.criticalAlertsCount})</span>
                </div>
              </div>
              <div className="p-3 bg-[#0d1322] border border-slate-800/90 rounded-lg flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-500 uppercase">北约平均信度</span>
                <span className="text-emerald-400 font-bold text-sm">
                  {briefData.metrics.admiraltyReliabilityAvg} (高度可靠)
                </span>
              </div>
            </div>

            {/* Section 1: Executive Summary (BLUF) */}
            <div className="p-4 sm:p-5 bg-slate-900/60 border border-slate-800/90 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-amber-400">
                    一、核心战略战术综述 (BLUF - BOTTOM LINE UP FRONT)
                  </span>
                </div>
                <button
                  onClick={handleCopySummary}
                  className="text-[11px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  <span>{copied ? '已复制综述' : '复制综述'}</span>
                </button>
              </div>
              <p className="text-sm leading-relaxed text-slate-200 font-sans border-l-2 border-amber-400/80 pl-3 py-1 bg-slate-950/40 rounded-r">
                {briefData.executiveSummary}
              </p>
            </div>

            {/* Section 2: Strategic Highlights */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  二、24小时重点战区战略要情 (STRATEGIC HIGHLIGHTS)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefData.strategicHighlights.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col gap-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-sky-950/80 text-sky-300 border border-sky-800/60 font-medium">
                        {item.theater}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                          item.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-orange-950 text-orange-300 border-orange-800'
                        }`}
                      >
                        {item.severity}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-semibold text-slate-100 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-2 rounded border border-slate-850">
                      {item.assessment}
                    </p>

                    <div className="mt-auto text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-500">涉事实体:</span>
                      <span className="text-amber-300 font-medium">{item.primaryActor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 3: Cross-Domain Multi-Source Assessment */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  三、多域联动作战态势评估 (CROSS-DOMAIN TELEMETRY)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                {/* Undersea */}
                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-mono font-semibold">
                    <Radio className="w-3.5 h-3.5" />
                    <span>水下与海峡咽喉航道</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {briefData.crossDomainAnalysis.maritimeUndersea}
                  </p>
                </div>

                {/* Cyber */}
                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-amber-400 font-mono font-semibold">
                    <Shield className="w-3.5 h-3.5" />
                    <span>工控网络与关键基础设施</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {briefData.crossDomainAnalysis.cyberInfrastructure}
                  </p>
                </div>

                {/* Aerospace */}
                <div className="p-3.5 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 text-purple-400 font-mono font-semibold">
                    <Globe className="w-3.5 h-3.5" />
                    <span>空天轨道与高频电磁对抗</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed font-mono text-[11px]">
                    {briefData.crossDomainAnalysis.aerospaceElectromagnetic}
                  </p>
                </div>
              </div>
            </div>

            {/* Section 4: Key Entity Watchlist */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Crosshair className="w-4 h-4 text-rose-400" />
                <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-200">
                  四、24小时高危监控实体名录 (ENTITY WATCHLIST)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {briefData.keyEntityWatchlist.map((ent, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-900/40 border border-slate-800/80 rounded-lg flex flex-col gap-1 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100">{ent.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {ent.threatScore}分
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400">状态: {ent.status}</span>
                    <p className="text-slate-400 text-[11px] leading-relaxed mt-0.5">
                      {ent.activity24h}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 5: Recommended Tactical Directives */}
            <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-mono font-semibold text-xs uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4" />
                <span>五、联合参谋部战备与协同指令 (COMMAND DIRECTIVES)</span>
              </div>
              <ul className="space-y-1.5">
                {briefData.recommendedDirectives.map((directive, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-xs font-mono text-amber-100/90 leading-relaxed bg-slate-900/40 p-2 rounded border border-amber-500/20"
                  >
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">
                      [{idx + 1}]
                    </span>
                    <span>{directive}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <FileText className="w-10 h-10 text-slate-700" />
            <p className="text-xs font-mono">暂无生成的24小时日报数据，点击右上角“重新生成”开始。</p>
          </div>
        )}

        {/* Modal Footer Actions */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-[#0e1424] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportText}
              disabled={!briefData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>导出正式防务日报 (TXT)</span>
            </button>

            <button
              onClick={handlePrint}
              disabled={!briefData}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded transition-colors cursor-pointer disabled:opacity-50 hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>打印归档副本</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSendToAIAnalyst && (
              <button
                onClick={() => {
                  onSendToAIAnalyst();
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold rounded transition-colors cursor-pointer shadow-md shadow-amber-400/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>同步至 AI 研判推演席位</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              返回简报中心
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
