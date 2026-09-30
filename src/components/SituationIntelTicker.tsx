import React, { useState, useEffect, useMemo, useRef } from 'react';
import { IntelReport, ThreatLevel } from '../types/intelligence';
import { 
  Radio, Compass, ShieldAlert, AlertTriangle, Activity, 
  Pause, Play, FastForward, ExternalLink, ChevronRight, 
  Search, X, Crosshair, Zap, Eye, Volume2, VolumeX, CheckCircle2,
  RefreshCw, Globe
} from 'lucide-react';

export interface TickerItem {
  id: string;
  type: 'INTEL_HARVEST' | 'GEONODE_CHANGE' | 'RECON_PASS' | 'CYBER_INTERCEPT';
  sourceCategory: string; // SIGINT, GEOINT, OSINT, CYBER, MASINT, CHOKEPOINT
  title: string;
  locationName: string;
  coordinates: { lat: number; lng: number };
  threatLevel: ThreatLevel;
  timestamp: string;
  sourceCode: string;
  changeHighlight: string;
  reportId?: string;
  isNew?: boolean;
}

interface SituationIntelTickerProps {
  reports: IntelReport[];
  selectedReportId: string | null;
  onSelectReport: (report: IntelReport) => void;
  onFocusCoordinates: (lat: number, lng: number, label: string) => void;
  activeFocusedLabel?: string | null;
}

// Baseline Geopolitical and Strategic nodes updates
const BASE_GEOPOLITICAL_TICKER_ITEMS: TickerItem[] = [
  {
    id: 'TICK-GEO-01',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '霍尔木兹海峡 · 咽喉水道电磁侦听警戒升级',
    locationName: '霍尔木兹海峡 (26.56°N, 56.25°E)',
    coordinates: { lat: 26.56, lng: 56.25 },
    threatLevel: 'CRITICAL',
    timestamp: '刚刚',
    sourceCode: '海峡监听哨站-A',
    changeHighlight: '海底光缆异常电磁突发 · 未知深潜船悬停',
    reportId: 'INTEL-2026-0891',
  },
  {
    id: 'TICK-GEO-02',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '曼德海峡 · 红海入海口商船编队规避变轨',
    locationName: '曼德海峡 (12.58°N, 43.33°E)',
    coordinates: { lat: 12.58, lng: 43.33 },
    threatLevel: 'CRITICAL',
    timestamp: '18秒前',
    sourceCode: '亚丁湾卫勤网',
    changeHighlight: '红海南口防空截击警戒提升 · 68%货轮转航好望角',
  },
  {
    id: 'TICK-GEO-03',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'GEOINT',
    title: '台湾海峡 · 海空联合警戒巡航态势雷达追踪',
    locationName: '台湾海峡 (24.50°N, 119.50°E)',
    coordinates: { lat: 24.50, lng: 119.50 },
    threatLevel: 'HIGH',
    timestamp: '45秒前',
    sourceCode: '东部空情雷达',
    changeHighlight: '8批次海空巡逻编队经由海峡东侧中线机动',
  },
  {
    id: 'TICK-GEO-04',
    type: 'INTEL_HARVEST',
    sourceCategory: 'CYBER',
    title: '西欧电网SCADA中心 · 捕获APT-44零日渗透攻击包',
    locationName: '法兰克福节点 (50.11°N, 8.68°E)',
    coordinates: { lat: 50.11, lng: 8.68 },
    threatLevel: 'HIGH',
    timestamp: '1分前',
    sourceCode: '国家网安中心',
    changeHighlight: '工控协议虚假相位调节包拦截 · 隔离VPN通道',
    reportId: 'INTEL-2026-0892',
  },
  {
    id: 'TICK-GEO-05',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'OSINT',
    title: '马六甲海峡东口 · 扩散式GPS电子欺骗致多轮偏航',
    locationName: '新加坡海峡东部 (1.43°N, 102.89°E)',
    coordinates: { lat: 1.43, lng: 102.89 },
    threatLevel: 'GUARDED',
    timestamp: '2分前',
    sourceCode: '国际海事无线电',
    changeHighlight: '超27艘VLCC油轮偏离主航道 · 沿岸机动侦测中',
    reportId: 'INTEL-2026-0894',
  },
  {
    id: 'TICK-GEO-06',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'MASINT',
    title: '斯瓦尔巴海槽 · 被动深海声学浮标阵列完成组网',
    locationName: '北极斯瓦尔巴 (77.00°N, 15.00°E)',
    coordinates: { lat: 77.00, lng: 15.00 },
    threatLevel: 'ELEVATED',
    timestamp: '3分前',
    sourceCode: '极地声呐浮标网',
    changeHighlight: '12枚自持潜标连续捕获极低频轴频声纹遥测',
    reportId: 'INTEL-2026-0893',
  },
  {
    id: 'TICK-GEO-07',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '苏伊士运河 · 大苦湖锚地启动特种安保防爆二级预案',
    locationName: '苏伊士运河 (30.70°N, 32.34°E)',
    coordinates: { lat: 30.70, lng: 32.34 },
    threatLevel: 'GUARDED',
    timestamp: '4分前',
    sourceCode: '运河引航管制台',
    changeHighlight: '超大型箱船间距扩增至3.5海里 · 单向分时放行',
  },
  {
    id: 'TICK-GEO-08',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '直布罗陀海峡 · 西口水下声屏障记录到未标识静音潜航',
    locationName: '直布罗陀海峡 (35.96°N, -5.60°E)',
    coordinates: { lat: 35.96, lng: -5.60 },
    threatLevel: 'ELEVATED',
    timestamp: '6分前',
    sourceCode: '大西洋水声防线',
    changeHighlight: '声学特征比对中 · 战区反潜巡逻机升空复核',
  },
  {
    id: 'TICK-GEO-09',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '巴拿马运河 · 加通湖水位回升并开启战略物资绿色过闸',
    locationName: '巴拿马运河 (9.10°N, -79.69°E)',
    coordinates: { lat: 9.10, lng: -79.69 },
    threatLevel: 'LOW',
    timestamp: '8分前',
    sourceCode: '运河水文气象站',
    changeHighlight: '最大允许吃水提升至49.5英尺 · 航道畅通',
  },
  {
    id: 'TICK-GEO-10',
    type: 'RECON_PASS',
    sourceCategory: 'GEOINT',
    title: '西太平洋马里亚纳战区 · 低轨合成孔径雷达SAR重访成像',
    locationName: '马里亚纳战区 (13.44°N, 144.79°E)',
    coordinates: { lat: 13.44, lng: 144.79 },
    threatLevel: 'ELEVATED',
    timestamp: '11分前',
    sourceCode: '高分雷达遥感-11',
    changeHighlight: '第二轮深潜试验区微波成像完成 · 目标未浮起',
  },
  {
    id: 'TICK-GEO-11',
    type: 'INTEL_HARVEST',
    sourceCategory: 'HUMINT',
    title: '绝密量子分发线索 · 防务承包商QKD样机遭刺探',
    locationName: '日内瓦某高新园区 (46.20°N, 6.14°E)',
    coordinates: { lat: 46.20, lng: 6.14 },
    threatLevel: 'CRITICAL',
    timestamp: '15分前',
    sourceCode: '反谍特别外勤组',
    changeHighlight: '刺探人员出境航线已布控 · 核心密钥未泄漏',
    reportId: 'INTEL-2026-0895',
  },
  {
    id: 'TICK-GEO-12',
    type: 'GEONODE_CHANGE',
    sourceCategory: 'GEOINT',
    title: '波罗的海咽喉 · 芬兰湾海底通信天然气复线震动阈值告警',
    locationName: '芬兰湾海槽 (59.80°N, 24.50°E)',
    coordinates: { lat: 59.80, lng: 24.50 },
    threatLevel: 'HIGH',
    timestamp: '19分前',
    sourceCode: '波罗的海管线监控',
    changeHighlight: '排查非标拖网外力破坏可能 · 巡逻艇离港核查',
  }
];

// Pool of periodic simulated updates to dynamically inject
const SIMULATED_NEW_INTERCEPTS: Omit<TickerItem, 'id' | 'timestamp'>[] = [
  {
    type: 'RECON_PASS',
    sourceCategory: 'GEOINT',
    title: '低轨遥感卫星 · 捕获霍尔木兹海域深潜支持船释放微型作业潜器',
    locationName: '霍尔木兹海峡外海 (26.40°N, 56.45°E)',
    coordinates: { lat: 26.40, lng: 56.45 },
    threatLevel: 'CRITICAL',
    sourceCode: 'SAR-09微波侦察星',
    changeHighlight: '光学红外双模确认释放物为无缆深水作业潜器',
    reportId: 'INTEL-2026-0891',
  },
  {
    type: 'INTEL_HARVEST',
    sourceCategory: 'SIGINT',
    title: '红海中段 · 截获超短波跳频自适应加密战术电台突发握手',
    locationName: '红海主航道 (19.85°N, 39.50°E)',
    coordinates: { lat: 19.85, lng: 39.50 },
    threatLevel: 'HIGH',
    sourceCode: '机载电子侦察天线',
    changeHighlight: '跳频速率每秒1200跳 · 指纹特征库比对命中87%',
  },
  {
    type: 'GEONODE_CHANGE',
    sourceCategory: 'CHOKEPOINT',
    title: '台湾海峡西南防空识别区 · 监测到海空联训机群密集机动',
    locationName: '台湾海峡西南空域 (22.80°N, 118.90°E)',
    coordinates: { lat: 22.80, lng: 118.90 },
    threatLevel: 'HIGH',
    sourceCode: '岸基相控阵超视距雷达',
    changeHighlight: '战术电子压制吊舱信号辐射 · 空情雷达全程咬合',
  },
  {
    type: 'CYBER_INTERCEPT',
    sourceCategory: 'CYBER',
    title: '关键海底缆线中继站 · 探测到异常BGP自治域流量劫持尝试',
    locationName: '法兰克福至马赛干线 (43.30°N, 5.37°E)',
    coordinates: { lat: 43.30, lng: 5.37 },
    threatLevel: 'HIGH',
    sourceCode: '全球BGP哨兵节点',
    changeHighlight: '重定向目标为东亚跨国能源清算专线',
    reportId: 'INTEL-2026-0892',
  },
  {
    type: 'INTEL_HARVEST',
    sourceCategory: 'MASINT',
    title: '斯瓦尔巴极地海槽 · 水听器记录到特种潜艇低频循环水泵转速变频',
    locationName: '斯瓦尔巴深海水槽 (77.15°N, 14.80°E)',
    coordinates: { lat: 77.15, lng: 14.80 },
    threatLevel: 'ELEVATED',
    sourceCode: '北极深海听音网',
    changeHighlight: '目标航速估计4.2节 · 极低频轴频指纹已归档',
    reportId: 'INTEL-2026-0893',
  }
];

export const SituationIntelTicker: React.FC<SituationIntelTickerProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onFocusCoordinates,
  activeFocusedLabel,
}) => {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>(BASE_GEOPOLITICAL_TICKER_ITEMS);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<'1x' | '2x'>('1x');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'CHOKEPOINT' | 'SIGINT_GEOINT' | 'CYBER'>('ALL');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [audioFeedback, setAudioFeedback] = useState<boolean>(false);
  const [lastNewItemCount, setLastNewItemCount] = useState<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Play subtle tactical click/ping sound if enabled
  const playTacticalBlip = (freq: number = 880, type: OscillatorType = 'sine') => {
    if (!audioFeedback) return;
    try {
      if (!audioContextRef.current) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioContextClass();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio might be blocked by browser policy until interaction
    }
  };

  // Real-time simulated ingestion: periodically adds a realistic tactical intercept blip
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      const template = SIMULATED_NEW_INTERCEPTS[index % SIMULATED_NEW_INTERCEPTS.length];
      index++;

      const newItem: TickerItem = {
        ...template,
        id: `TICK-DYNAMIC-${Date.now()}`,
        timestamp: '刚刚',
        isNew: true,
      };

      setTickerItems((prev) => [newItem, ...prev.slice(0, 24)]);
      setLastNewItemCount((c) => c + 1);
      playTacticalBlip(1200, 'triangle');
    }, 18000); // Ingest new simulated telemetry every 18 seconds

    return () => clearInterval(interval);
  }, [audioFeedback]);

  // Combine reports with ticker data to ensure all current reports have presence
  const mergedItems = useMemo(() => {
    return tickerItems;
  }, [tickerItems]);

  const filteredItems = useMemo(() => {
    return mergedItems.filter((item) => {
      if (selectedFilter === 'CHOKEPOINT') {
        return item.sourceCategory === 'CHOKEPOINT' || item.type === 'GEONODE_CHANGE';
      }
      if (selectedFilter === 'SIGINT_GEOINT') {
        return item.sourceCategory === 'SIGINT' || item.sourceCategory === 'GEOINT' || item.sourceCategory === 'MASINT';
      }
      if (selectedFilter === 'CYBER') {
        return item.sourceCategory === 'CYBER' || item.sourceCategory === 'HUMINT' || item.sourceCategory === 'OSINT';
      }
      return true;
    });
  }, [mergedItems, selectedFilter]);

  // For the infinite marquee to seamlessly wrap, we double the items list
  const marqueeItems = useMemo(() => {
    if (filteredItems.length === 0) return [];
    return [...filteredItems, ...filteredItems];
  }, [filteredItems]);

  const getThreatBadgeStyle = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-rose-400 bg-rose-500/15 border-rose-500/40 shadow-rose-950/40';
      case 'HIGH':
        return 'text-orange-400 bg-orange-500/15 border-orange-500/40 shadow-orange-950/40';
      case 'ELEVATED':
        return 'text-sky-400 bg-sky-500/15 border-sky-500/40 shadow-sky-950/40';
      case 'GUARDED':
        return 'text-amber-400 bg-amber-500/15 border-amber-500/40 shadow-amber-950/40';
      case 'LOW':
      default:
        return 'text-slate-400 bg-slate-800/40 border-slate-700/50 shadow-none';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'CHOKEPOINT': return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
      case 'SIGINT': return 'text-purple-400 border-purple-500/30 bg-purple-500/10';
      case 'GEOINT': return 'text-sky-400 border-sky-500/30 bg-sky-500/10';
      case 'CYBER': return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
      case 'OSINT': return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
      case 'MASINT': return 'text-teal-400 border-teal-500/30 bg-teal-500/10';
      default: return 'text-slate-400 border-slate-700 bg-slate-800/40';
    }
  };

  const handleItemClick = (item: TickerItem) => {
    playTacticalBlip(980);
    // Focus coordinates on the map
    onFocusCoordinates(item.coordinates.lat, item.coordinates.lng, item.locationName);

    // If item links to a report, also trigger selection
    if (item.reportId) {
      const r = reports.find((rep) => rep.id === item.reportId);
      if (r) {
        onSelectReport(r);
      }
    }
  };

  // Drawer filtered items
  const drawerSearchResults = useMemo(() => {
    return mergedItems.filter((item) => {
      const matchQuery = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sourceCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.changeHighlight.toLowerCase().includes(searchQuery.toLowerCase());
      return matchQuery;
    });
  }, [mergedItems, searchQuery]);

  return (
    <div className="relative z-20 w-full border-b border-amber-500/25 bg-[#070d18]/85 backdrop-blur-md shadow-lg shadow-black/30 text-slate-200 select-none">
      {/* Background subtle tactical scanline */}
      <div className="absolute inset-0 tactical-scanline pointer-events-none opacity-40" />

      {/* Main Ticker Row */}
      <div className="flex items-stretch h-10 overflow-hidden relative">
        {/* Left Fixed Badge: Status & Radar Pulse */}
        <div className="flex items-center gap-2 px-3 sm:px-4 bg-[#0a1222] border-r border-amber-500/30 shrink-0 z-10 shadow-md">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping absolute opacity-75" />
            <span className="w-2 h-2 rounded-full bg-rose-500 relative" />
          </div>
          
          <div className="flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-amber-400 font-semibold whitespace-nowrap">
            <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="hidden sm:inline">实时全源简讯</span>
            <span className="sm:hidden">简讯</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
              LIVE
            </span>
          </div>

          {/* Quick telemetry counter */}
          <div className="hidden md:flex items-center gap-2 pl-1 text-[10px] font-mono text-slate-400">
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> 18条/分
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-400">节点: 12</span>
          </div>
        </div>

        {/* Center: Infinite Rolling Marquee Stream */}
        <div className="flex-1 overflow-hidden relative flex items-center">
          {/* Gradient fade edge masks */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#070d18] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#070d18] to-transparent z-10 pointer-events-none" />

          <div
            className={`flex items-center whitespace-nowrap pause-hover ${
              speedMultiplier === '2x' ? 'animate-ticker-scroll-fast' : 'animate-ticker-scroll'
            }`}
            style={{
              animationPlayState: isPaused ? 'paused' : 'running',
            }}
          >
            {marqueeItems.map((item, idx) => {
              const isSelected = selectedReportId === item.reportId;
              const isFocused = activeFocusedLabel === item.locationName;

              return (
                <div
                  key={`${item.id}-${idx}`}
                  onClick={() => handleItemClick(item)}
                  className={`inline-flex items-center gap-2 px-3 py-1 mx-1.5 rounded border text-xs cursor-pointer transition-all duration-150 ${
                    isSelected || isFocused
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-900/60 hover:bg-slate-800/80 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                  title="点击在战术态势地图上聚焦此地缘节点与情报档案"
                >
                  {/* Category Pill */}
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.2 rounded border font-semibold ${getCategoryColor(
                      item.sourceCategory
                    )}`}
                  >
                    {item.sourceCategory}
                  </span>

                  {/* Threat severity indicator dot */}
                  <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      item.threatLevel === 'CRITICAL'
                        ? 'bg-rose-500 animate-ping'
                        : item.threatLevel === 'HIGH'
                        ? 'bg-orange-400'
                        : item.threatLevel === 'ELEVATED'
                        ? 'bg-sky-400'
                        : 'bg-emerald-400'
                    }`}
                  />

                  {/* Item Headline */}
                  <span className="font-medium text-slate-200 tracking-tight">
                    {item.title}
                  </span>

                  {/* Key dynamic highlight */}
                  <span className="text-[11px] font-mono text-slate-400 border-l border-slate-700/60 pl-1.5 hidden lg:inline">
                    {item.changeHighlight}
                  </span>

                  {/* Timestamp */}
                  <span className="text-[10px] font-mono text-amber-400/80 shrink-0">
                    {item.timestamp}
                  </span>

                  {/* Target Locator Icon */}
                  <Crosshair className="w-3 h-3 text-slate-400 group-hover:text-amber-400 shrink-0 opacity-70" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Controls HUD */}
        <div className="flex items-center gap-1 px-2.5 bg-[#0a1222] border-l border-slate-800/80 shrink-0 z-10">
          {/* Pause / Resume Button */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title={isPaused ? '恢复滚动' : '暂停滚动'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>

          {/* Speed Toggle (1x / 2x) */}
          <button
            onClick={() => setSpeedMultiplier((s) => (s === '1x' ? '2x' : '1x'))}
            className={`px-1.5 py-0.5 font-mono text-[10px] rounded border transition-colors cursor-pointer ${
              speedMultiplier === '2x'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold'
                : 'text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
            title="切换情报滚动速度"
          >
            {speedMultiplier}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              const next = !audioFeedback;
              setAudioFeedback(next);
              if (next) playTacticalBlip(1040);
            }}
            className={`p-1.5 rounded transition-colors cursor-pointer ${
              audioFeedback ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
            title={audioFeedback ? '静音战术音效' : '开启战术雷达提示音'}
          >
            {audioFeedback ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Expand Full Feed Drawer */}
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-mono font-medium text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors cursor-pointer ml-1"
            title="展开全部情报流与地缘变化档案"
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">研判流 ({filteredItems.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-header Filter Pill strip */}
      <div className="flex items-center justify-between px-3 py-1 bg-[#060a14]/90 border-t border-slate-800/60 text-[11px] text-slate-400">
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider shrink-0">研判快筛:</span>
          {[
            { id: 'ALL', label: '全部抓取动态' },
            { id: 'CHOKEPOINT', label: '关键地缘海峡' },
            { id: 'SIGINT_GEOINT', label: '卫星与电磁侦搜' },
            { id: 'CYBER', label: '网络空间与OSINT' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedFilter(cat.id as any)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                selectedFilter === cat.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3 text-[10px] font-mono text-slate-400">
          <span>加密信道: MIL-STD-188-110</span>
          <span>·</span>
          <span className="text-amber-400/90">
            {activeFocusedLabel ? `当前锁定: ${activeFocusedLabel}` : '全局战区态势监控'}
          </span>
        </div>
      </div>

      {/* Full Telemetry Feed Drawer / Modal */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#0a0f1d] border border-amber-500/30 rounded-lg shadow-2xl w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden text-slate-100">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0e1627]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
                  <Activity className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                    <span>全源实时情报抓取与关键地缘节点变化档案</span>
                    <span className="text-xs font-mono font-normal text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                      LIVE STREAM
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    涵盖国际战略海峡水道、反潜听音网络、网络空间攻防与遥感卫星动态
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-3 border-b border-slate-800 bg-[#080d19] flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="搜索地缘节点、海峡名称、情报编号、特征关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 font-mono"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span>共收录 {drawerSearchResults.length} 条</span>
              </div>
            </div>

            {/* Intercepts List */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-800/60 space-y-2">
              {drawerSearchResults.length > 0 ? (
                drawerSearchResults.map((item) => {
                  const isSelected = selectedReportId === item.reportId;
                  return (
                    <div
                      key={item.id}
                      className={`pt-2.5 first:pt-0 p-3 rounded border transition-colors ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500/40'
                          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getCategoryColor(
                                item.sourceCategory
                              )}`}
                            >
                              {item.sourceCategory}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getThreatBadgeStyle(
                                item.threatLevel
                              )}`}
                            >
                              {item.threatLevel}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {item.sourceCode}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500">
                              · {item.timestamp}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
                            {item.title}
                          </h4>

                          <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/40 p-2 rounded border border-slate-800/60 font-sans">
                            {item.changeHighlight}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-2">
                            <span>坐标: {item.coordinates.lat}°N, {item.coordinates.lng}°E</span>
                            <span>·</span>
                            <span>位置: {item.locationName}</span>
                          </div>
                        </div>

                        {/* Direct Jump button */}
                        <div className="flex flex-col gap-2 shrink-0">
                          <button
                            onClick={() => {
                              handleItemClick(item);
                              setIsDrawerOpen(false);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer shadow-sm"
                          >
                            <Crosshair className="w-3.5 h-3.5" />
                            <span>在地图上标定</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center text-slate-500 font-mono text-xs">
                  未找到匹配关键词的情报简讯
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-slate-800 bg-[#080d19] flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>实时侦听天网联通中 · 数据每18秒自动增量捕获</span>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 cursor-pointer"
              >
                关闭窗口
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
