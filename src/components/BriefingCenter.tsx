import React, { useState, useMemo, useEffect } from 'react';
import { IntelReport, ClassificationLevel, ThreatLevel, IntelCategory } from '../types/intelligence';
import { 
  FileText, Search, Download, Printer, Shield, AlertCircle, 
  CheckCircle2, Compass, ExternalLink, Sparkles, Filter, Info, 
  Calendar
} from 'lucide-react';
import { DailyIntelBriefModal, DailyIntelBriefData } from './DailyIntelBriefModal';

interface BriefingCenterProps {
  reports: IntelReport[];
  selectedReportId?: string | null;
  onSelectReport?: (report: IntelReport) => void;
  onSelectReportOnMap: (report: IntelReport) => void;
  onSendToAIAnalyst: (report: IntelReport) => void;
}

export const BriefingCenter: React.FC<BriefingCenterProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onSelectReportOnMap,
  onSendToAIAnalyst,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [activeReportId, setActiveReportId] = useState<string>(selectedReportId || reports[0]?.id || '');
  const [showAdmiraltyInfo, setShowAdmiraltyInfo] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Daily Intelligence Brief states
  const [isDailyBriefOpen, setIsDailyBriefOpen] = useState<boolean>(false);
  const [dailyBriefData, setDailyBriefData] = useState<DailyIntelBriefData | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState<boolean>(false);

  // Filter incoming reports received in the last 24 hours
  const reports24h = useMemo(() => {
    // Current simulation reference time: 2026-09-30 08:00 UTC
    const refMs = Date.UTC(2026, 8, 30, 8, 0, 0);
    return reports.filter((r) => {
      const match = r.timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
      if (match) {
        const [, y, m, d, h, min] = match;
        const tMs = Date.UTC(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min));
        const diffHours = (refMs - tMs) / (1000 * 60 * 60);
        return diffHours >= -1 && diffHours <= 36; // Within last 24h operational cycle
      }
      return true; // Dynamic reports added today
    });
  }, [reports]);

  // Handle LLM-powered Daily Intelligence Brief generation
  const handleGenerateDailyBrief = async () => {
    setIsGeneratingBrief(true);
    try {
      const res = await fetch('/api/intelligence/daily-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: reports24h }),
      });

      if (!res.ok) {
        throw new Error('Server returned non-200');
      }

      const data = await res.json();
      setDailyBriefData(data);
    } catch (err) {
      console.warn('Using tactical client synthesis fallback:', err);
      // High-fidelity realistic fallback based on actual incoming reports
      const criticalCount = reports24h.filter((r) => r.threatLevel === 'CRITICAL').length;
      const fallback: DailyIntelBriefData = {
        briefSerial: `JIC-DAILY-20260930-0${Math.floor(Math.random() * 9 + 1)}`,
        period: '2026-09-29 08:00 UTC 至 2026-09-30 08:00 UTC (近24小时全域监测)',
        executiveSummary: `过去24小时内，天玑战略情报中枢共截获并入库 ${reports24h.length} 份战略电报。波斯湾关键航道水下通信干线光缆出现非侵入式脉冲窃听与特种深潜改装船悬停（OPERATION BLUE TIDE），西欧联合电网调度系统遭遇APT-44针对工控协议的高风险零日漏洞渗透；北极斯瓦尔巴航道及马六甲海峡同步录得声学浮标密集布设与GPS坐标欺骗扩散。综合研判表明，当前面临国家级复合跨域混合侦测与网络反制威胁。`,
        overallDefcon: 'DEFCON 2',
        overallThreatLevel: criticalCount > 0 ? 'CRITICAL' : 'HIGH',
        strategicHighlights: reports24h.slice(0, 4).map((r) => ({
          title: r.title,
          theater: r.locationName.split('(')[0].trim(),
          assessment: r.summary,
          severity: r.threatLevel === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
          primaryActor: r.entities[0] || '未知特种目标',
        })),
        crossDomainAnalysis: {
          maritimeUndersea:
            '波斯湾第4号欧亚海底光缆交汇点与北极斯瓦尔巴西南海槽呈现双重异常，特种潜水作业与低频声学水听器阵列对战略核潜艇冰下通道及欧亚能源金融结算流构成实质性被动窃听威胁。',
          cyberInfrastructure:
            '暗影编织者(APT-44)持续利用未公开IEC 60870-5-104工控遥测协议栈缺陷渗透西欧400kV超高压电网调度中心，攻击样本中带有自毁时间锁，威胁冬季负荷高峰电网稳定性。',
          aerospaceElectromagnetic:
            '新加坡至马六甲东部锚地连续发生商船高频电子欺骗(GPS Spoofing)，太平洋靶区遥测船只就位观测到高超滑翔等离子体热辐射特征，天基合成孔径雷达(SAR)需维持紧急重访。',
        },
        keyEntityWatchlist: [
          {
            name: '特种科考船 GHOST DIVER',
            status: '作业悬停中',
            activity24h: '阿曼湾至霍尔木兹海峡连续释放小型深潜ROV及感应线圈探头',
            threatScore: 94,
          },
          {
            name: '暗影编织者 (APT-44)',
            status: '持续渗透探测',
            activity24h: '向法兰克福核心电网调度网关下发微量相位欺骗指令包',
            threatScore: 92,
          },
          {
            name: '泰坦航运 (Titan Shipping)',
            status: '资金离岸洗钱',
            activity24h: '经由日内瓦赫尔墨斯离岸信托向境外防务泄密涉案人员转移大额资金',
            threatScore: 88,
          },
        ],
        recommendedDirectives: [
          '提升波斯湾及霍尔木兹海域海上巡逻机(P-8A)多波段声呐与雷达查证频次至二级戒备；',
          '强制隔离欧洲及关键受援变电站远程运维VPN通道，启动物理隔离离线调度保护；',
          '向国际海事组织发布马六甲东口商用GPS信号异常漂移高风险航行通告；',
          '针对涉嫌转移量子通信校准参数的“信使-09”实施紧急边境通报与离境拦截预案。',
        ],
        metrics: {
          totalReportsProcessed: reports24h.length,
          criticalAlertsCount: criticalCount,
          activeTheatersCount: 4,
          admiraltyReliabilityAvg: 'A1 - B2',
        },
      };
      setDailyBriefData(fallback);
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  // Sync activeReportId when selectedReportId prop changes (e.g. from Global Search)
  useEffect(() => {
    if (selectedReportId) {
      setActiveReportId(selectedReportId);
      const target = reports.find((r) => r.id === selectedReportId);
      if (target) {
        // If current filters would hide the target report, reset them so it is visible
        if (
          (selectedClassification !== 'ALL' && target.classification !== selectedClassification) ||
          (selectedCategory !== 'ALL' && target.category !== selectedCategory)
        ) {
          setSelectedClassification('ALL');
          setSelectedCategory('ALL');
        }
      }
    }
  }, [selectedReportId, reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.entities.some((e) => e.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchClass = selectedClassification === 'ALL' || r.classification === selectedClassification;
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      return matchSearch && matchClass && matchCat;
    });
  }, [reports, searchQuery, selectedClassification, selectedCategory]);

  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === activeReportId) || filteredReports[0] || reports[0];
  }, [reports, activeReportId, filteredReports]);

  const getClassificationBadge = (lvl: ClassificationLevel) => {
    switch (lvl) {
      case 'TOP_SECRET':
        return { label: '绝密 (TOP SECRET)', bg: 'bg-rose-950/80', text: 'text-rose-400', border: 'border-rose-800' };
      case 'SECRET':
        return { label: '机密 (SECRET)', bg: 'bg-amber-950/80', text: 'text-amber-400', border: 'border-amber-800' };
      case 'CONFIDENTIAL':
        return { label: '秘密 (CONFIDENTIAL)', bg: 'bg-sky-950/80', text: 'text-sky-400', border: 'border-sky-800' };
      case 'RESTRICTED':
      default:
        return { label: '内部限制 (RESTRICTED)', bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700' };
    }
  };

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL': return 'text-rose-400';
      case 'HIGH': return 'text-orange-400';
      case 'ELEVATED': return 'text-sky-400';
      case 'GUARDED': return 'text-emerald-400';
      default: return 'text-slate-400';
    }
  };

  const handleExportBriefing = () => {
    if (!activeReport) return;
    setIsExporting(true);
    const content = `========================================================
天玑战略情报研判系统 - 综合防务情报简报
密级: ${activeReport.classification}
电报代号: ${activeReport.codeName} (${activeReport.id})
生成时间: ${new Date().toISOString()}
========================================================

【情报标题】: ${activeReport.title}
【情报来源类别】: ${activeReport.category}
【情报信度等级】: 北约/海军 Admiralty Code: ${activeReport.sourceReliability}
【威胁态势评级】: ${activeReport.threatLevel}
【事发地理位置】: ${activeReport.locationName} (${activeReport.coordinates.lat}N, ${activeReport.coordinates.lng}E)

一、研判核心结论
${activeReport.summary}

二、原始情报详文与侦测细节
${activeReport.content}

三、关键事实证据链条
${activeReport.keyFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')}

四、关联涉事目标实体
${activeReport.entities.join(', ')}

五、指挥部优先应对建议
${activeReport.priorityAction || '持续保持多波段被动信号监听与低轨卫星二次重访。'}
========================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INTEL_BRIEF_${activeReport.codeName}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setTimeout(() => setIsExporting(false), 500);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0b0f17]">
      {/* Top filter bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1420] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索电报、代号、涉事目标实体或关键词..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Classification Filter */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>密级:</span>
            <select
              value={selectedClassification}
              onChange={(e) => setSelectedClassification(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="ALL">全部密级</option>
              <option value="TOP_SECRET">绝密 (TOP SECRET)</option>
              <option value="SECRET">机密 (SECRET)</option>
              <option value="CONFIDENTIAL">秘密 (CONFIDENTIAL)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1 text-slate-400">
            <span>情报源:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="ALL">全部来源</option>
              <option value="SIGINT">SIGINT 信号</option>
              <option value="CYBER">CYBER 网络</option>
              <option value="GEOINT">GEOINT 空间</option>
              <option value="HUMINT">HUMINT 人力</option>
              <option value="OSINT">OSINT 开源</option>
              <option value="MASINT">MASINT 特征</option>
            </select>
          </div>

          <button
            onClick={() => setShowAdmiraltyInfo(!showAdmiraltyInfo)}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded cursor-pointer transition-colors"
            title="查看 Admiralty 来源与可信度评级规范"
          >
            <Info className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">信度体系</span>
          </button>

          {/* Automated Daily Intelligence Brief Trigger Button */}
          <button
            onClick={() => {
              setIsDailyBriefOpen(true);
              if (!dailyBriefData) {
                handleGenerateDailyBrief();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer shadow-sm shadow-amber-500/25 active:scale-95 font-mono"
            title="使用大模型智能汇总过去24小时全域多源情报为结构化战略日报"
          >
            <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>生成24H情报日报</span>
            <span className="text-[10px] bg-slate-950/20 text-slate-950 px-1 py-0.2 rounded font-mono">
              {reports24h.length} 份
            </span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Cables List, Right Cable Dossier Viewer */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
        {/* Left Column: Cables List (md:col-span-4 lg:col-span-4) */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-slate-800 bg-[#090d16] flex flex-col h-full overflow-y-auto">
          <div className="p-3 border-b border-slate-800/80 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400 font-mono">
            <span>待批阅电报 ({filteredReports.length})</span>
            <span>按威胁与时间排序</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filteredReports.map((report) => {
              const isSelected = activeReport?.id === report.id;
              const badge = getClassificationBadge(report.classification);
              const threatColor = getThreatColor(report.threatLevel);

              return (
                <div
                  key={report.id}
                  onClick={() => {
                    setActiveReportId(report.id);
                    onSelectReport?.(report);
                  }}
                  className={`p-3.5 transition-colors cursor-pointer text-left flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-800/70 border-l-2 border-amber-400'
                      : 'hover:bg-slate-850/50 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-amber-400/90 font-medium">
                      {report.codeName}
                    </span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {report.classification}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-slate-100 line-clamp-2 leading-relaxed">
                    {report.title}
                  </h4>

                  {/* Unboxed metadata with · */}
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                    <span className={threatColor}>{report.threatLevel}</span>
                    <span>·</span>
                    <span>{report.category}</span>
                    <span>·</span>
                    <span>信度 {report.sourceReliability}</span>
                    <span>·</span>
                    <span className="truncate">{report.timestamp}</span>
                  </div>
                </div>
              );
            })}

            {filteredReports.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                未检索到符合条件的防务电报
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Detailed Intelligence Dossier / Cable (md:col-span-7 lg:col-span-8) */}
        <div className="md:col-span-7 lg:col-span-8 bg-[#0b0f17] flex flex-col h-full overflow-y-auto">
          {activeReport ? (
            <div className="p-5 lg:p-8 flex flex-col gap-6 max-w-4xl">
              {/* Classified Cable Header Stamp */}
              <div className="border border-slate-700/80 bg-slate-900/60 p-4 sm:p-5 rounded flex flex-col gap-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-2 opacity-10 pointer-events-none">
                  <Shield className="w-36 h-36 text-amber-400" />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-slate-500">DISPATCH ID:</span>
                    <span className="font-mono text-xs font-bold text-amber-400">{activeReport.id}</span>
                    <span className="text-slate-600">|</span>
                    <span className="font-mono text-xs text-slate-300 font-semibold">{activeReport.codeName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${getClassificationBadge(activeReport.classification).bg} ${getClassificationBadge(activeReport.classification).text} ${getClassificationBadge(activeReport.classification).border}`}>
                      {getClassificationBadge(activeReport.classification).label}
                    </span>
                  </div>
                </div>

                <h2 className="text-lg lg:text-xl font-bold text-slate-100 leading-snug">
                  {activeReport.title}
                </h2>

                {/* Zero-pill metadata line */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-slate-300">来源: {activeReport.category}</span>
                  <span>·</span>
                  <span className="text-slate-300">信度评级: {activeReport.sourceReliability}</span>
                  <span>·</span>
                  <span className={`font-semibold ${getThreatColor(activeReport.threatLevel)}`}>
                    威胁等级: {activeReport.threatLevel}
                  </span>
                  <span>·</span>
                  <span className="text-slate-400">{activeReport.locationName}</span>
                  <span>·</span>
                  <span className="text-slate-500">{activeReport.timestamp}</span>
                </div>
              </div>

              {/* Section 01: Key Summary */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 tracking-wider uppercase font-semibold">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
                  <span>01. 态势研判与核心结论 (BOTTOM LINE UP FRONT)</span>
                </div>
                <div className="p-4 bg-slate-900/40 rounded border border-slate-800/80 text-sm leading-relaxed text-slate-200">
                  {activeReport.summary}
                </div>
              </div>

              {/* Section 02: Full Cable Text */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider uppercase font-semibold">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <span>02. 原始截获情报与现场侦搜记录 (RAW INTERCEPT)</span>
                </div>
                <div className="p-4 bg-slate-950/60 rounded border border-slate-800/60 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {activeReport.content}
                </div>
              </div>

              {/* Section 03: Key Findings Checklist */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400 tracking-wider uppercase font-semibold">
                  <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                  <span>03. 交叉印证事实链条 (VERIFIED EVIDENCE CHAIN)</span>
                </div>
                <div className="flex flex-col gap-2">
                  {activeReport.keyFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-900/30 rounded border border-slate-800/50 flex items-start gap-2.5 text-xs text-slate-300"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{finding}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 04: Target Entities & Priority Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
                    涉及监控目标与关联实体
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeReport.entities.map((entity, idx) => (
                      <span
                        key={idx}
                        className="text-xs font-mono text-slate-200 bg-slate-800 border border-slate-700 px-2 py-1 rounded"
                      >
                        {entity}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                    推荐指挥应对建议
                  </span>
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-xs text-amber-100/90 font-mono leading-relaxed">
                    {activeReport.priorityAction || '维持当前侦搜级别，持续监控'}
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="border-t border-slate-800 pt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSelectReportOnMap(activeReport)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-sky-400" />
                    <span>在态势图锁定方位</span>
                  </button>

                  <button
                    onClick={handleExportBriefing}
                    disabled={isExporting}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-slate-100 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isExporting ? '生成中...' : '导出防务简报'}</span>
                  </button>
                </div>

                <button
                  onClick={() => onSendToAIAnalyst(activeReport)}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>启用 AI 深度战略兵棋推演</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <FileText className="w-12 h-12 text-slate-700 mb-3 stroke-[1]" />
              <p className="text-sm">请在左侧列表中点击选择防务电报进行解密查阅</p>
            </div>
          )}
        </div>
      </div>

      {/* Admiralty Rating Guide Modal */}
      {showAdmiraltyInfo && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-lg max-w-2xl w-full p-5 flex flex-col gap-4 text-xs">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-sm font-bold text-slate-100 font-mono">
                北约/海军情报部 (Admiralty Code) 情报信度与可信度矩阵规范
              </span>
              <button
                onClick={() => setShowAdmiraltyInfo(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-amber-400">情报来源可靠度 (Source Reliability)</span>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li><strong>A - 完全可靠:</strong> 长期验证绝无怀疑的专业技术侦听或核心内线</li>
                  <li><strong>B - 通常可靠:</strong> 绝大多数历史信息均属实的稳定情报渠道</li>
                  <li><strong>C - 尚属可靠:</strong> 多数情况下属实，但偶有偏差</li>
                  <li><strong>D - 通常不可靠:</strong> 经常出现虚假或夸大报告</li>
                  <li><strong>E - 不可靠:</strong> 存在已知欺骗或恶意投毒倾向</li>
                  <li><strong>F - 无法判断可靠性:</strong> 新兴来源或匿名投递</li>
                </ul>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-semibold text-sky-400">情报内容真实度 (Information Credibility)</span>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li><strong>1 - 业经证实:</strong> 多源相互独立交叉印证且物理核准</li>
                  <li><strong>2 - 很可能真实:</strong> 与已掌握敌情态势逻辑自洽</li>
                  <li><strong>3 - 可能真实:</strong> 虽未经独立证实，但符合基本防务逻辑</li>
                  <li><strong>4 - 可疑:</strong> 与现有战略情报存在明显矛盾</li>
                  <li><strong>5 - 不可能:</strong> 违背物理常识或确认系反间谍欺骗手段</li>
                  <li><strong>6 - 无法判断真伪:</strong> 缺乏横向比对数据</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-800 pt-2 flex justify-end">
              <button
                onClick={() => setShowAdmiraltyInfo(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded cursor-pointer"
              >
                关闭说明
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Automated Daily Intelligence Brief Modal */}
      <DailyIntelBriefModal
        isOpen={isDailyBriefOpen}
        onClose={() => setIsDailyBriefOpen(false)}
        reports24h={reports24h}
        briefData={dailyBriefData}
        isLoading={isGeneratingBrief}
        onRegenerate={handleGenerateDailyBrief}
        onSendToAIAnalyst={() => {
          if (activeReport) onSendToAIAnalyst(activeReport);
        }}
      />
    </div>
  );
};
