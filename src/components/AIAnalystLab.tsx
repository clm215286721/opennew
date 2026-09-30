import React, { useState, useEffect, useMemo } from 'react';
import { 
  IntelReport, TargetEntity, AnalysisResult, SimulationResult, 
  IntelCategory, ClassificationLevel 
} from '../types/intelligence';
import { 
  Sparkles, Shield, Cpu, RefreshCw, Send, CheckCircle2, 
  AlertTriangle, Crosshair, HelpCircle, Layers, ArrowRight, 
  BookmarkPlus, Network, GitBranch, ArrowUpRight 
} from 'lucide-react';
import { EntityRelevanceTimeline } from './EntityRelevanceTimeline';
import { INITIAL_INTEL_REPORTS, INITIAL_ENTITIES } from '../data/mockIntelligence';

interface AIAnalystLabProps {
  initialReport?: IntelReport | null;
  onIngestNewReport?: (report: IntelReport) => void;
  reports?: IntelReport[];
  entities?: TargetEntity[];
  onSelectIntelReportById?: (reportId: string) => void;
}

export const AIAnalystLab: React.FC<AIAnalystLabProps> = ({
  initialReport,
  onIngestNewReport,
  reports = INITIAL_INTEL_REPORTS,
  entities = INITIAL_ENTITIES,
  onSelectIntelReportById,
}) => {
  const [activeMode, setActiveMode] = useState<'ANALYZE' | 'TIMELINE' | 'SIMULATE' | 'QUERY'>('ANALYZE');

  // Currently analyzed report object
  const [currentAnalyzedReport, setCurrentAnalyzedReport] = useState<IntelReport>(() => {
    return initialReport || (reports && reports.length > 0 ? reports[0] : INITIAL_INTEL_REPORTS[0]);
  });

  // Sync when initialReport prop changes
  useEffect(() => {
    if (initialReport) {
      setCurrentAnalyzedReport(initialReport);
      setInputTitle(initialReport.title);
      setInputContent(initialReport.content);
      setInputClassification(initialReport.classification);
      setInputSource(initialReport.category);
    }
  }, [initialReport]);

  // Mode 1: Cable Analysis State
  const [inputTitle, setInputTitle] = useState(
    initialReport?.title || reports[0]?.title || '截获多源原始防务线索分析'
  );
  const [inputContent, setInputContent] = useState(
    initialReport?.content ||
      reports[0]?.content ||
      `【突发外军无线电电磁截获】
时间：今日 05:20 UTC
区域：东地中海至苏伊士运河以北海域
截获内容：观测到一艘悬挂巴拿马旗的货轮“海王星-08”在进入苏伊士航道前突然关闭AIS应答机，雷达显示其向某未经标定的军用停泊区释放两艘充气快艇。
伴随侦测到数组频率在 433.92MHz 的扩频加密微突发数据包，接收端疑似指向利马索尔某空壳物流保税仓。卫星红外传感器捕捉到船尾甲板曾启动大功率降噪发电机组，水下有可疑金属回波向沿海海底天然气管道铺设区机动。`
  );
  const [inputClassification, setInputClassification] = useState<ClassificationLevel>(
    (initialReport?.classification as ClassificationLevel) || reports[0]?.classification || 'SECRET'
  );
  const [inputSource, setInputSource] = useState<IntelCategory>(
    (initialReport?.category as IntelCategory) || reports[0]?.category || 'SIGINT'
  );
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [ingestedSuccess, setIngestedSuccess] = useState(false);

  // Mode 2: Scenario Simulation State
  const [scenarioPrompt, setScenarioPrompt] = useState(
    '某大国在波罗的海海底关键通信光缆附近展开非通报深水排雷演习，导致北欧三国金融结算系统产生300毫秒网络延迟，引发国际外汇市场剧烈波动。'
  );
  const [scenarioRegion, setScenarioRegion] = useState('波罗的海海底关键光缆走廊');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Mode 3: Query Assistant State
  const [question, setQuestion] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; text: string; time: string }>>([
    {
      role: 'assistant',
      text: '报告指挥官，天玑战略情报大模型研判席位已就绪。您可以针对当前全球防务态势、涉案实体暗网资金流、关键航道封锁威胁或反制推演提出研判质询。',
      time: '08:00 UTC',
    },
  ]);
  const [isQuerying, setIsQuerying] = useState(false);

  // Quick preset templates for rapid testing
  const presets: Array<{ title: string; source: IntelCategory; content: string }> = [
    {
      title: '霍尔木兹海峡海底光缆遭异常搭接侦听',
      source: 'SIGINT',
      content: '截获固定声呐阵列与海底地震检波器异常频闪，某深潜特种改装船正在霍尔木兹咽喉海底干线部署感应线圈窃听探头，意图截取能源结算流。',
    },
    {
      title: '西欧电网调度网关SCADA零日漏洞攻击',
      source: 'CYBER',
      content: 'APT-44利用工控IEC-104遥测协议漏洞向跨国高压输电调度中心发送恶意相位注入包，极可能在极寒用电高峰期诱发区域性大断电。',
    },
    {
      title: '非标低轨侦察星座异常轨道机动交会',
      source: 'GEOINT',
      content: '太空目标监视雷达网记录到编号 Kosmos-841 试验载荷在远地点实施反常轨道机动，近距离掠过某主权防务光学侦察卫星仅 3.2 公里。',
    },
  ];

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setIngestedSuccess(false);

    try {
      const res = await fetch('/api/intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: inputTitle,
          content: inputContent,
          classification: inputClassification,
          source: inputSource,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || '研判服务响应异常');
      }

      const data = await res.json();
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalysisError(err.message || '研判生成失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRunSimulation = async () => {
    setIsSimulating(true);
    setSimulationError(null);

    try {
      const res = await fetch('/api/intelligence/simulate-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: scenarioPrompt,
          region: scenarioRegion,
          timeframe: 'T+0 至 T+72小时',
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.details || err.error || '推演服务响应异常');
      }

      const data = await res.json();
      setSimulationResult(data);
    } catch (err: any) {
      setSimulationError(err.message || '推演生成失败');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleSendQuery = async () => {
    if (!question.trim() || isQuerying) return;
    const userQ = question.trim();
    const timeStr = new Date().toTimeString().slice(0, 5) + ' UTC';
    setChatMessages((prev) => [...prev, { role: 'user', text: userQ, time: timeStr }]);
    setQuestion('');
    setIsQuerying(true);

    try {
      const res = await fetch('/api/intelligence/query-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userQ,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '参谋问答响应异常');
      }

      const data = await res.json();
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.answer, time: new Date().toTimeString().slice(0, 5) + ' UTC' },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `研判系统通信故障: ${err.message}`, time: timeStr },
      ]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleIngestToDatabase = () => {
    if (!analysisResult || !onIngestNewReport) return;
    const newReport: IntelReport = {
      id: `INTEL-${Date.now().toString().slice(-4)}`,
      codeName: `OPERATION ${inputTitle.slice(0, 6).toUpperCase()}`,
      title: inputTitle,
      classification: inputClassification as any,
      category: inputSource as any,
      threatLevel: analysisResult.threatLevel,
      sourceReliability: analysisResult.reliabilityRating || 'B2',
      timestamp: '刚刚 (2026-09-30 UTC)',
      locationName: '实时录入侦搜区域',
      coordinates: { lat: 31.2, lng: 121.5 },
      summary: analysisResult.summary,
      content: inputContent,
      keyFindings: analysisResult.keyJudgments,
      entities: analysisResult.extractedEntities.map((e) => e.name),
      status: 'VERIFIED',
      priorityAction: analysisResult.recommendedAction,
      tags: ['AI研判入库', inputSource, analysisResult.threatLevel],
    };
    onIngestNewReport(newReport);
    setIngestedSuccess(true);
  };

  const handleSelectReportToAnalyze = (report: IntelReport) => {
    setCurrentAnalyzedReport(report);
    setInputTitle(report.title);
    setInputContent(report.content);
    setInputClassification(report.classification);
    setInputSource(report.category);
    setAnalysisResult(null);
  };

  // Quick count of correlated reports for badge
  const quickCorrelatedCount = useMemo(() => {
    const norm = currentAnalyzedReport.entities.map((e) => e.split('(')[0].trim().toLowerCase());
    let count = 0;
    reports.forEach((r) => {
      if (r.id === currentAnalyzedReport.id) return;
      const otherNorm = r.entities.map((e) => e.split('(')[0].trim().toLowerCase());
      const hasDirect = norm.some((n) => otherNorm.some((o) => n === o || n.includes(o) || o.includes(n)));
      if (hasDirect || r.category === currentAnalyzedReport.category) count++;
    });
    return Math.max(count, 2);
  }, [currentAnalyzedReport, reports]);

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0b0f17]">
      {/* Top Mode Segmented Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1420] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded border border-slate-800">
          <button
            onClick={() => setActiveMode('ANALYZE')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeMode === 'ANALYZE'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            多源电报深度研判
          </button>
          <button
            onClick={() => setActiveMode('TIMELINE')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeMode === 'TIMELINE'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>实体关联时序推演</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
              activeMode === 'TIMELINE' ? 'bg-slate-950 text-amber-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {quickCorrelatedCount}
            </span>
          </button>
          <button
            onClick={() => setActiveMode('SIMULATE')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeMode === 'SIMULATE'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            战略态势兵棋推演
          </button>
          <button
            onClick={() => setActiveMode('QUERY')}
            className={`px-3 py-1 rounded font-medium transition-colors cursor-pointer ${
              activeMode === 'QUERY'
                ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            高级情报参谋质询
          </button>
        </div>

        {/* Right side: Report Switcher & Telemetry */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono">
            <span className="text-slate-500 hidden md:inline">研判基准电报:</span>
            <select
              value={currentAnalyzedReport?.id || ''}
              onChange={(e) => {
                const rep = reports.find((r) => r.id === e.target.value);
                if (rep) handleSelectReportToAnalyze(rep);
              }}
              className="bg-slate-900 border border-slate-700/80 rounded px-2.5 py-1 text-xs text-amber-400 font-mono focus:outline-none focus:border-amber-400 max-w-[220px] truncate cursor-pointer shadow-sm"
              title="切换当前深入研判与实体关联回溯的基准电报"
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.codeName} - {r.title.slice(0, 14)}...
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>GEMINI 3.8 FLASH: 在线</span>
          </div>
        </div>
      </div>

      {/* Main Area based on mode */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {/* MODE 1: DEEP CABLE ANALYSIS */}
        {activeMode === 'ANALYZE' && (
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Input Cable (5 cols) */}
            <div className="lg:col-span-5 flex flex-col gap-4">
              <div className="bg-[#090d16] border border-slate-800 rounded p-4 flex flex-col gap-3">
                <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                  原始电报与侦搜录入
                </span>

                {/* Preset quick pills */}
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-500">载入仿真经典防务线索:</span>
                  <div className="flex flex-wrap gap-1">
                    {presets.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setInputTitle(p.title);
                          setInputContent(p.content);
                          setInputSource(p.source);
                        }}
                        className="text-[11px] font-mono text-slate-400 hover:text-slate-200 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 cursor-pointer"
                      >
                        {p.title.slice(0, 10)}...
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-400">情报标题 / 事件定义</label>
                  <input
                    type="text"
                    value={inputTitle}
                    onChange={(e) => setInputTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-mono text-slate-400">来源途径</label>
                    <select
                      value={inputSource}
                      onChange={(e) => setInputSource(e.target.value as IntelCategory)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="SIGINT">SIGINT 信号侦测</option>
                      <option value="CYBER">CYBER 网络空间</option>
                      <option value="GEOINT">GEOINT 遥感图像</option>
                      <option value="HUMINT">HUMINT 外勤人员</option>
                      <option value="OSINT">OSINT 开源采集</option>
                      <option value="MASINT">MASINT 特征测量</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-mono text-slate-400">密级设定</label>
                    <select
                      value={inputClassification}
                      onChange={(e) => setInputClassification(e.target.value as ClassificationLevel)}
                      className="bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="TOP_SECRET">绝密 (TOP SECRET)</option>
                      <option value="SECRET">机密 (SECRET)</option>
                      <option value="CONFIDENTIAL">秘密 (CONFIDENTIAL)</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-mono text-slate-400">截获原始报文 / 现场侦搜文本</label>
                  <textarea
                    rows={8}
                    value={inputContent}
                    onChange={(e) => setInputContent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
                  />
                </div>

                <button
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在启动战略综合研判模型...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>执行 AI 深度结构化研判</span>
                    </>
                  )}
                </button>
              </div>

              {analysisError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded text-xs text-rose-300 font-mono">
                  研判失败: {analysisError}
                </div>
              )}

              {/* Entity Association & Historical Relevance Teaser Card */}
              <div className="bg-gradient-to-br from-[#0c121e] to-[#080d17] border border-amber-500/30 rounded p-4 flex flex-col gap-2.5 shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-amber-400">
                    <Network className="w-4 h-4 text-amber-400" />
                    <span>基于实体关联的情报时序推演</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    自动匹配就绪
                  </span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  已依据当前基准电报涉案实体与拓扑关系网，智能穿透溯源了相关的历史防务档案。
                </p>

                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {currentAnalyzedReport.entities.slice(0, 3).map((ent) => (
                    <span
                      key={ent}
                      className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 text-[11px] font-mono"
                    >
                      {ent}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setActiveMode('TIMELINE')}
                  className="mt-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/40 rounded text-xs font-mono font-semibold transition-colors cursor-pointer group"
                >
                  <GitBranch className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>展开完整实体关联时序推演 (共 {quickCorrelatedCount} 篇相关情报)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Right: Structured Output (7 cols) */}
            <div className="lg:col-span-7 flex flex-col gap-4">
              {analysisResult ? (
                <div className="bg-[#090d16] border border-slate-800 rounded p-5 flex flex-col gap-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-400" />
                      <span className="font-mono text-xs font-bold text-slate-100">
                        结构化情报研判报告 (AI SYNTHESIS BRIEF)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold">
                        {analysisResult.threatLevel}
                      </span>
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        信度: {analysisResult.reliabilityRating}
                      </span>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-amber-400 font-mono uppercase">
                      01. 核心研判结论 (BLUF)
                    </span>
                    <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded border border-slate-800">
                      {analysisResult.summary}
                    </p>
                  </div>

                  {/* Key Judgments */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-300 font-mono uppercase">
                      02. 关键判断依据 (KEY JUDGMENTS)
                    </span>
                    <ul className="space-y-1.5">
                      {analysisResult.keyJudgments.map((item, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 p-2 bg-slate-900/30 rounded border border-slate-800/60 text-xs text-slate-300"
                        >
                          <span className="font-mono text-amber-400 text-[11px] font-bold mt-0.5">
                            [{idx + 1}]
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Extracted Entities */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-300 font-mono uppercase">
                      03. 抽取的涉案目标实体与威胁评分
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysisResult.extractedEntities.map((ent, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 bg-slate-950 rounded border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100">{ent.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {ent.type} · {ent.role}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-amber-400 text-xs tabular-nums">
                            {ent.threatScore}分
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Geopolitical Impact & Countermeasures */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-900/40 rounded border border-slate-800 flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                        战略安全与地缘影响
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {analysisResult.geopoliticalImpact}
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase">
                        指挥部优先处置方案
                      </span>
                      <p className="text-xs text-amber-100/90 leading-relaxed font-mono">
                        {analysisResult.recommendedAction}
                      </p>
                    </div>
                  </div>

                  {/* Indicators & Warnings */}
                  {analysisResult.indicatorsAndWarnings?.length > 0 && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-mono text-slate-400 font-semibold uppercase">
                        后续触发预警观测指标
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {analysisResult.indicatorsAndWarnings.map((iw, idx) => (
                          <span
                            key={idx}
                            className="text-xs font-mono text-rose-300 bg-rose-950/40 border border-rose-900 px-2 py-0.5 rounded"
                          >
                            ⚠️ {iw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ingestion button */}
                  <div className="pt-2 border-t border-slate-800 flex justify-end">
                    <button
                      onClick={handleIngestToDatabase}
                      disabled={ingestedSuccess}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium cursor-pointer transition-colors ${
                        ingestedSuccess
                          ? 'bg-emerald-900 text-emerald-300 border border-emerald-700'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                      }`}
                    >
                      <BookmarkPlus className="w-3.5 h-3.5" />
                      <span>{ingestedSuccess ? '已成功收录至全局态势库' : '将本条研判收录至实时情报数据库'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="h-full bg-[#090d16] border border-slate-800/80 rounded p-8 flex flex-col items-center justify-center text-center text-slate-500">
                  <Cpu className="w-12 h-12 text-slate-700 mb-3 stroke-[1]" />
                  <h4 className="text-sm font-semibold text-slate-400">等待输入电报或选择仿真案例</h4>
                  <p className="text-xs max-w-sm mt-1">
                    点击“执行 AI 深度结构化研判”，系统将自动完成实体关系抽取、置信度评定及反制推演。
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODE: ENTITY RELEVANCE TIMELINE */}
        {activeMode === 'TIMELINE' && (
          <div className="max-w-6xl mx-auto h-[calc(100vh-8.5rem)]">
            <EntityRelevanceTimeline
              currentReport={currentAnalyzedReport}
              allReports={reports}
              entities={entities}
              onSelectReportToAnalyze={(rep) => {
                handleSelectReportToAnalyze(rep);
                setActiveMode('ANALYZE');
              }}
              onSelectIntelReportById={onSelectIntelReportById}
            />
          </div>
        )}

        {/* MODE 2: STRATEGIC SCENARIO SIMULATION */}
        {activeMode === 'SIMULATE' && (
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div className="bg-[#090d16] border border-slate-800 rounded p-5 flex flex-col gap-4">
              <span className="text-xs font-mono font-semibold text-amber-400 uppercase tracking-wider">
                战略态势推演情景假定 (WARGAME & SCENARIO ENGINE)
              </span>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-mono text-slate-400">输入地缘危机或防务推演情景</label>
                <textarea
                  rows={3}
                  value={scenarioPrompt}
                  onChange={(e) => setScenarioPrompt(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-amber-500/50 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <span>关注防务区:</span>
                  <input
                    type="text"
                    value={scenarioRegion}
                    onChange={(e) => setScenarioRegion(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 text-xs"
                  />
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={isSimulating}
                  className="flex items-center gap-2 px-5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>正在展开多阶段兵棋推演...</span>
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>启动兵棋推演</span>
                    </>
                  )}
                </button>
              </div>

              {simulationError && (
                <div className="p-3 bg-rose-950/60 border border-rose-800 rounded text-xs text-rose-300 font-mono">
                  推演失败: {simulationError}
                </div>
              )}
            </div>

            {simulationResult && (
              <div className="bg-[#090d16] border border-slate-800 rounded p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-base font-bold text-slate-100">
                    {simulationResult.scenarioTitle}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-400">
                      主要假定方: {simulationResult.primaryThreatActor}
                    </span>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                      危机综合指数: {simulationResult.riskIndex}/100
                    </span>
                  </div>
                </div>

                {/* Escalation Phases Timeline */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                    危机多阶段事态演变轴 (ESCALATION PHASES)
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {simulationResult.escalationPhases.map((phase, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-slate-900/60 rounded border border-slate-800 flex flex-col gap-2"
                      >
                        <span className="font-mono text-xs font-bold text-amber-400">
                          {phase.phase}
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-mono">
                          {phase.developments}
                        </p>
                        <div className="mt-auto pt-2 border-t border-slate-800 text-[11px] font-mono text-slate-400">
                          <strong>触发指标:</strong> {phase.indicators}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Implications & Chokepoints */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
                      深远战略影响 (STRATEGIC IMPLICATIONS)
                    </span>
                    <ul className="space-y-1.5 text-xs text-slate-300 font-mono">
                      {simulationResult.strategicImplications.map((imp, idx) => (
                        <li key={idx} className="p-2 bg-slate-950 rounded border border-slate-800/80">
                          · {imp}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-mono text-slate-400 font-semibold uppercase">
                      受威胁关键咽喉 (CRITICAL CHOKEPOINTS)
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {simulationResult.criticalChokepoints.map((cp, idx) => (
                        <span
                          key={idx}
                          className="text-xs font-mono text-rose-300 bg-rose-950/40 border border-rose-900 px-2.5 py-1 rounded"
                        >
                          ⚠️ {cp}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contingency Response */}
                <div className="flex flex-col gap-2 bg-amber-500/10 border border-amber-500/20 p-4 rounded">
                  <span className="text-xs font-mono text-amber-400 font-semibold uppercase">
                    指挥中枢推荐应对预案 (CONTINGENCY PREPAREDNESS)
                  </span>
                  <ul className="space-y-1 text-xs text-amber-100 font-mono">
                    {simulationResult.contingencyResponse.map((res, idx) => (
                      <li key={idx}>[{idx + 1}] {res}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 3: DIRECT INTELLIGENCE OFFICER TERMINAL */}
        {activeMode === 'QUERY' && (
          <div className="max-w-4xl mx-auto flex flex-col h-full gap-4">
            <div className="flex-1 bg-[#090d16] border border-slate-800 rounded p-4 flex flex-col gap-3 min-h-[420px] max-h-[560px] overflow-y-auto">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col max-w-[85%] ${
                    msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                  }`}
                >
                  <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 mb-1">
                    <span>{msg.role === 'user' ? '指挥官指令' : '首席战略情报参谋'}</span>
                    <span>·</span>
                    <span>{msg.time}</span>
                  </div>
                  <div
                    className={`p-3 rounded text-xs leading-relaxed font-mono whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-amber-400 text-slate-950 font-medium'
                        : 'bg-slate-900/90 text-slate-200 border border-slate-800'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isQuerying && (
                <div className="flex items-center gap-2 text-xs font-mono text-amber-400 animate-pulse p-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>参谋席位正在调用多源情报数据库比对研判...</span>
                </div>
              )}
            </div>

            {/* Chat Input Bar */}
            <div className="flex items-center gap-2 bg-[#090d16] border border-slate-800 rounded p-2">
              <input
                type="text"
                value={question}
                placeholder="向情报参谋提问，例如：若霍尔木兹海峡海底光缆断裂，对东亚能源结算有何冲击？"
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none font-mono"
              />
              <button
                onClick={handleSendQuery}
                disabled={isQuerying || !question.trim()}
                className="px-4 py-2 bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-slate-950 font-semibold rounded text-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>发送质询</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
