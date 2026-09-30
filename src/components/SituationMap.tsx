import React, { useState, useMemo, useEffect } from 'react';
import { IntelReport, IntelCategory, ThreatLevel } from '../types/intelligence';
import { 
  Crosshair, Radio, ShieldAlert, Compass, Eye, Filter, 
  ExternalLink, Layers, ZoomIn, ZoomOut, RotateCcw, AlertTriangle,
  TrendingUp, X, ChevronUp, ChevronDown, BarChart2
} from 'lucide-react';
import { SituationIntelTicker } from './SituationIntelTicker';
import { GlobalThreatPulse, ThreatRegion, STRATEGIC_THREAT_REGIONS } from './GlobalThreatPulse';
import { RegionalTrendChart } from './RegionalTrendChart';

interface SituationMapProps {
  reports: IntelReport[];
  selectedReportId: string | null;
  onSelectReport: (report: IntelReport) => void;
  onSendToAIAnalyst: (report: IntelReport) => void;
}

// Strategic global chokepoints
const STRATEGIC_CHOKEPOINTS = [
  { name: '霍尔木兹海峡', lat: 26.56, lng: 56.25, note: '全球波斯湾油轮咽喉' },
  { name: '马六甲海峡', lat: 1.43, lng: 102.89, note: '东亚能源命脉航道' },
  { name: '曼德海峡', lat: 12.58, lng: 43.33, note: '红海-亚丁湾南口' },
  { name: '苏伊士运河', lat: 30.70, lng: 32.34, note: '地中海至红海枢纽' },
  { name: '直布罗陀海峡', lat: 35.96, lng: -5.60, note: '大西洋-地中海西口' },
  { name: '斯瓦尔巴航道', lat: 77.00, lng: 15.00, note: '北极深海战略走廊' },
  { name: '巴拿马运河', lat: 9.10, lng: -79.69, note: '两洋联通水门' },
  { name: '台湾海峡', lat: 24.50, lng: 119.50, note: '西太重要海空通道' },
];

export const SituationMap: React.FC<SituationMapProps> = ({
  reports,
  selectedReportId,
  onSelectReport,
  onSendToAIAnalyst,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedThreat, setSelectedThreat] = useState<string>('ALL');
  const [showRadarSweep, setShowRadarSweep] = useState<boolean>(true);
  const [showChokepoints, setShowChokepoints] = useState<boolean>(true);
  const [showThreatPulse, setShowThreatPulse] = useState<boolean>(true);
  const [showTensionLines, setShowTensionLines] = useState<boolean>(true);
  const [activeThreatRegionId, setActiveThreatRegionId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [focusedGeonode, setFocusedGeonode] = useState<{
    name: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [showTrendChart, setShowTrendChart] = useState<boolean>(true);
  const [trendChartMinimized, setTrendChartMinimized] = useState<boolean>(false);
  const [sidebarTab, setSidebarTab] = useState<'dossier' | 'trend'>('dossier');

  // Map coordinate conversion (Equirectangular: lat -90..90 -> y, lng -180..180 -> x)
  const mapWidth = 960;
  const mapHeight = 480;

  const project = (lat: number, lng: number) => {
    const x = ((lng + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    return { x, y };
  };

  const handleFocusCoordinates = (lat: number, lng: number, label: string) => {
    setFocusedGeonode({ name: label, lat, lng });
    const pt = project(lat, lng);
    // Smoothly pan so the target point is centered on screen
    const targetX = (mapWidth / 2 - pt.x) * 0.7;
    const targetY = (mapHeight / 2 - pt.y) * 0.7;
    setZoomLevel(1.5);
    setPanOffset({ x: targetX, y: targetY });
  };

  const handleSelectRegionFromTrend = (regionName: string) => {
    if (regionName.includes('霍尔木兹') || regionName.includes('波斯湾')) {
      handleFocusCoordinates(26.56, 56.25, '霍尔木兹中枢');
    } else if (regionName.includes('西太平洋') || regionName.includes('印太') || regionName.includes('台海')) {
      handleFocusCoordinates(24.30, 121.20, '西太第一岛链');
    } else if (regionName.includes('斯瓦尔巴') || regionName.includes('北极')) {
      handleFocusCoordinates(76.85, 14.20, '北极斯瓦尔巴走廊');
    } else if (regionName.includes('马六甲') || regionName.includes('东南亚')) {
      handleFocusCoordinates(1.43, 102.89, '马六甲咽喉航道');
    } else if (regionName.includes('法兰克福') || regionName.includes('波罗的海') || regionName.includes('欧洲')) {
      handleFocusCoordinates(50.11, 8.68, '欧洲法兰克福节点');
    } else if (regionName.includes('日内瓦')) {
      handleFocusCoordinates(46.20, 6.14, '日内瓦防务线');
    }
  };

  // Center and focus map when selectedReportId changes
  useEffect(() => {
    if (selectedReportId) {
      const rep = reports.find((r) => r.id === selectedReportId);
      if (rep) {
        handleFocusCoordinates(rep.coordinates.lat, rep.coordinates.lng, rep.codeName);
        if (selectedCategory !== 'ALL' && rep.category !== selectedCategory) {
          setSelectedCategory('ALL');
        }
        if (selectedThreat !== 'ALL' && rep.threatLevel !== selectedThreat) {
          setSelectedThreat('ALL');
        }
      }
    }
  }, [selectedReportId, reports]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchThreat = selectedThreat === 'ALL' || r.threatLevel === selectedThreat;
      return matchCat && matchThreat;
    });
  }, [reports, selectedCategory, selectedThreat]);

  const activeReport = useMemo(() => {
    return reports.find((r) => r.id === selectedReportId) || filteredReports[0] || reports[0];
  }, [reports, selectedReportId, filteredReports]);

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL':
        return '#f43f5e'; // rose-500
      case 'HIGH':
        return '#fb923c'; // orange-400
      case 'ELEVATED':
        return '#38bdf8'; // sky-400
      case 'GUARDED':
        return '#34d399'; // emerald-400
      case 'LOW':
      default:
        return '#94a3b8'; // slate-400
    }
  };

  const getCategoryLabel = (cat: IntelCategory) => {
    switch (cat) {
      case 'SIGINT': return '信号侦搜 (SIGINT)';
      case 'CYBER': return '网络空间 (CYBER)';
      case 'GEOINT': return '地理空间 (GEOINT)';
      case 'HUMINT': return '人力情报 (HUMINT)';
      case 'OSINT': return '开源情报 (OSINT)';
      case 'MASINT': return '测量与特征 (MASINT)';
      default: return cat;
    }
  };

  const categories: { id: string; label: string }[] = [
    { id: 'ALL', label: '全部多源' },
    { id: 'SIGINT', label: 'SIGINT 信号' },
    { id: 'CYBER', label: 'CYBER 网络' },
    { id: 'GEOINT', label: 'GEOINT 卫星' },
    { id: 'HUMINT', label: 'HUMINT 人力' },
    { id: 'OSINT', label: 'OSINT 开源' },
    { id: 'MASINT', label: 'MASINT 特征' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0b0f17]">
      {/* Transparent Real-time Scrolling Intelligence Briefing Ticker Layer */}
      <SituationIntelTicker
        reports={reports}
        selectedReportId={selectedReportId}
        onSelectReport={(report) => {
          onSelectReport(report);
          handleFocusCoordinates(report.coordinates.lat, report.coordinates.lng, report.codeName);
        }}
        onFocusCoordinates={handleFocusCoordinates}
        activeFocusedLabel={focusedGeonode?.name}
      />

      {/* Control bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1420] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium cursor-pointer ${
                selectedCategory === c.id
                  ? 'bg-slate-700 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-slate-400">
            <span>威胁等级:</span>
            <select
              value={selectedThreat}
              onChange={(e) => setSelectedThreat(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500/50 cursor-pointer"
            >
              <option value="ALL">全部等级</option>
              <option value="CRITICAL">严重 (CRITICAL)</option>
              <option value="HIGH">高危 (HIGH)</option>
              <option value="ELEVATED">关注 (ELEVATED)</option>
              <option value="GUARDED">警戒 (GUARDED)</option>
            </select>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={() => setShowRadarSweep(!showRadarSweep)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              showRadarSweep ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${showRadarSweep ? 'animate-pulse' : ''}`} />
            <span className="hidden sm:inline">雷达扫描</span>
          </button>

          <button
            onClick={() => setShowChokepoints(!showChokepoints)}
            className={`flex items-center gap-1 px-2 py-1 rounded transition-colors cursor-pointer ${
              showChokepoints ? 'text-sky-400 bg-sky-500/10' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">战略咽喉</span>
          </button>

          <button
            onClick={() => setShowThreatPulse(!showThreatPulse)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
              showThreatPulse ? 'text-rose-400 bg-rose-500/10 border border-rose-500/30' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="切换全球战区威胁脉冲背景热力层"
          >
            <span className={`w-2 h-2 rounded-full ${showThreatPulse ? 'bg-rose-500 animate-ping' : 'bg-slate-500'}`} />
            <span className="hidden sm:inline">威胁脉冲</span>
          </button>

          {showThreatPulse && (
            <button
              onClick={() => setShowTensionLines(!showTensionLines)}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${
                showTensionLines ? 'text-amber-400 bg-amber-500/10 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300'
              }`}
              title="切换跨战区张力走廊与数据流"
            >
              <span>张力弧线</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowTrendChart((prev) => !prev);
              setTrendChartMinimized(false);
            }}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-all cursor-pointer ${
              showTrendChart
                ? 'text-amber-400 bg-amber-500/15 border border-amber-400/40 shadow-sm shadow-amber-400/20 font-semibold'
                : 'text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800'
            }`}
            title="可视化近30日各战区态势情报频次走势"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">30天走势图</span>
          </button>

          <div className="flex items-center gap-1 border border-slate-800 bg-slate-900 rounded px-1">
            <button
              onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 2.5))}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="放大地图"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.75))}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="缩小地图"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(1);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
              title="重置视角"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content: Map + Side HUD */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
        {/* Map Canvas / SVG (Cols 1-8) */}
        <div className="lg:col-span-8 relative bg-[#070b12] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 tactical-grid">
          {/* Tactical coordinates header overlay */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500 pointer-events-none">
            <span className="text-amber-400/90 font-semibold tracking-wider">GLOBAL STRATEGIC THEATER</span>
            <span>·</span>
            <span>EQUIRECTANGULAR PROJECTION</span>
            <span>·</span>
            <span>活跃节点: {filteredReports.length}</span>
            {focusedGeonode && (
              <>
                <span>·</span>
                <span className="text-amber-300 font-semibold bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
                  锁定目标: {focusedGeonode.name}
                </span>
              </>
            )}
          </div>

          <div className="absolute top-3 right-4 z-10 flex items-center gap-2 text-[11px] font-mono tabular-nums text-slate-500 pointer-events-none">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1" />
            <span>实时侦听天网: 联通</span>
          </div>

          {/* SVG Map Container */}
          <div 
            className="w-full h-full flex items-center justify-center p-4 cursor-crosshair overflow-hidden transition-transform duration-200"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            <svg
              viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              className="w-full max-h-[90%] drop-shadow-2xl select-none"
              preserveAspectRatio="xMidYMid meet"
            >
              <defs>
                {/* Tactical grid background */}
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="0.5" />
                </pattern>
                {/* Radial glow for critical targets */}
                <radialGradient id="criticalPulse" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.8" />
                  <stop offset="70%" stopColor="#f43f5e" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect width={mapWidth} height={mapHeight} fill="#060910" />
              <rect width={mapWidth} height={mapHeight} fill="url(#grid)" />

              {/* Equator & Tropics & Prime Meridian lines */}
              <line x1="0" y1={mapHeight / 2} x2={mapWidth} y2={mapHeight / 2} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1={mapWidth / 2} y1="0" x2={mapWidth / 2} y2={mapHeight} stroke="#1e293b" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="0" y1={(90 - 23.44) / 180 * mapHeight} x2={mapWidth} y2={(90 - 23.44) / 180 * mapHeight} stroke="#0f172a" strokeWidth="0.8" />
              <line x1="0" y1={(90 + 23.44) / 180 * mapHeight} x2={mapWidth} y2={(90 + 23.44) / 180 * mapHeight} stroke="#0f172a" strokeWidth="0.8" />
              <line x1="0" y1={(90 - 66.5) / 180 * mapHeight} x2={mapWidth} y2={(90 - 66.5) / 180 * mapHeight} stroke="#0f172a" strokeWidth="0.8" strokeDasharray="2 2" />

              {/* Simplified high-veracity vector continents */}
              {/* Eurasia & Africa */}
              <path
                d="M 450,90 Q 520,70 620,80 Q 750,90 840,110 Q 860,180 810,220 Q 770,250 720,270 Q 660,260 620,290 Q 580,240 540,210 Q 500,210 460,150 Q 420,130 450,90 Z"
                fill="#121a28"
                stroke="#1e293b"
                strokeWidth="1"
              />
              <path
                d="M 460,190 Q 520,200 550,250 Q 560,330 520,380 Q 490,410 470,390 Q 440,310 440,240 Q 440,200 460,190 Z"
                fill="#101724"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* North America */}
              <path
                d="M 120,70 Q 230,60 280,100 Q 320,160 260,210 Q 210,240 180,210 Q 140,170 120,130 Z"
                fill="#121a28"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* South America */}
              <path
                d="M 230,240 Q 290,260 300,320 Q 280,390 250,440 Q 220,410 220,330 Q 210,270 230,240 Z"
                fill="#101724"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* Australia */}
              <path
                d="M 760,320 Q 830,310 850,350 Q 840,400 790,410 Q 740,370 760,320 Z"
                fill="#111827"
                stroke="#1e293b"
                strokeWidth="1"
              />
              {/* Japan & East Asia Arch */}
              <path
                d="M 800,160 Q 820,180 810,210 M 740,240 Q 770,270 780,290"
                fill="none"
                stroke="#1e293b"
                strokeWidth="1.5"
              />
              {/* Greenland & Arctic islands */}
              <path
                d="M 330,40 Q 390,45 370,80 Q 330,85 330,40 Z"
                fill="#0f172a"
                stroke="#1e293b"
                strokeWidth="0.8"
              />

              {/* Background Layer: Animated Real-time Global Threat Pulse */}
              {showThreatPulse && (
                <GlobalThreatPulse
                  project={project}
                  mapWidth={mapWidth}
                  mapHeight={mapHeight}
                  onSelectRegion={(region) => {
                    setActiveThreatRegionId(region.id);
                    handleFocusCoordinates(region.lat, region.lng, `${region.name} [${region.codeName}]`);
                  }}
                  activeRegionId={activeThreatRegionId}
                  showTensionLines={showTensionLines}
                  showHeatRings={true}
                />
              )}

              {/* Strategic Chokepoints */}
              {showChokepoints && STRATEGIC_CHOKEPOINTS.map((cp, idx) => {
                const pt = project(cp.lat, cp.lng);
                const isFocused = focusedGeonode?.name?.includes(cp.name);
                return (
                  <g 
                    key={`cp-${idx}`} 
                    className="cursor-pointer transition-opacity hover:opacity-100"
                    onClick={() => handleFocusCoordinates(cp.lat, cp.lng, cp.name)}
                  >
                    {isFocused && (
                      <circle cx={pt.x} cy={pt.y} r="16" fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-ping" opacity="0.7" />
                    )}
                    <circle cx={pt.x} cy={pt.y} r={isFocused ? "4" : "2.5"} fill={isFocused ? "#38bdf8" : "#0284c7"} stroke="#bae6fd" strokeWidth={isFocused ? 1.5 : 0.5} />
                    <text
                      x={pt.x + 5}
                      y={pt.y - 4}
                      fill={isFocused ? "#38bdf8" : "#64748b"}
                      fontSize={isFocused ? "9" : "8"}
                      fontWeight={isFocused ? "bold" : "normal"}
                      fontFamily="var(--font-mono)"
                    >
                      {cp.name}
                    </text>
                  </g>
                );
              })}

              {/* Focused Geonode / Target Reticle Overlay */}
              {focusedGeonode && (
                <g className="pointer-events-none">
                  {(() => {
                    const pt = project(focusedGeonode.lat, focusedGeonode.lng);
                    return (
                      <g>
                        <circle cx={pt.x} cy={pt.y} r="22" fill="none" stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4 3" />
                        <circle cx={pt.x} cy={pt.y} r="12" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.8" />
                        <line x1={pt.x - 26} y1={pt.y} x2={pt.x - 14} y2={pt.y} stroke="#f59e0b" strokeWidth="1.2" />
                        <line x1={pt.x + 14} y1={pt.y} x2={pt.x + 26} y2={pt.y} stroke="#f59e0b" strokeWidth="1.2" />
                        <line x1={pt.x} y1={pt.y - 26} x2={pt.x} y2={pt.y - 14} stroke="#f59e0b" strokeWidth="1.2" />
                        <line x1={pt.x} y1={pt.y + 14} x2={pt.x} y2={pt.y + 26} stroke="#f59e0b" strokeWidth="1.2" />
                      </g>
                    );
                  })()}
                </g>
              )}

              {/* Radar Sweep Effect */}
              {showRadarSweep && (
                <g className="radar-sweep" style={{ transformOrigin: `${mapWidth / 2}px ${mapHeight / 2}px` }}>
                  <line
                    x1={mapWidth / 2}
                    y1={mapHeight / 2}
                    x2={mapWidth / 2 + 350}
                    y2={mapHeight / 2 - 200}
                    stroke="rgba(245, 158, 11, 0.4)"
                    strokeWidth="1.5"
                  />
                  <polygon
                    points={`${mapWidth / 2},${mapHeight / 2} ${mapWidth / 2 + 350},${mapHeight / 2 - 200} ${mapWidth / 2 + 320},${mapHeight / 2 - 240}`}
                    fill="rgba(245, 158, 11, 0.04)"
                  />
                </g>
              )}

              {/* Intelligence Report Markers */}
              {filteredReports.map((report) => {
                const pt = project(report.coordinates.lat, report.coordinates.lng);
                const isSelected = activeReport?.id === report.id;
                const color = getThreatColor(report.threatLevel);

                return (
                  <g
                    key={report.id}
                    className="cursor-pointer transition-transform duration-150 hover:scale-125"
                    onClick={() => onSelectReport(report)}
                  >
                    {/* Pulsing halo for critical or selected */}
                    {(report.threatLevel === 'CRITICAL' || isSelected) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isSelected ? 18 : 14}
                        fill="none"
                        stroke={color}
                        strokeWidth="1"
                        opacity="0.4"
                        className="animate-ping"
                      />
                    )}

                    {/* Outer Target Circle */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 9 : 6}
                      fill="#070a10"
                      stroke={color}
                      strokeWidth={isSelected ? 2.5 : 1.5}
                    />

                    {/* Inner Core */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 4 : 2.5}
                      fill={color}
                    />

                    {/* Reticle lines for selected */}
                    {isSelected && (
                      <>
                        <line x1={pt.x - 14} y1={pt.y} x2={pt.x - 9} y2={pt.y} stroke={color} strokeWidth="1" />
                        <line x1={pt.x + 9} y1={pt.y} x2={pt.x + 14} y2={pt.y} stroke={color} strokeWidth="1" />
                        <line x1={pt.x} y1={pt.y - 14} x2={pt.x} y2={pt.y - 9} stroke={color} strokeWidth="1" />
                        <line x1={pt.x} y1={pt.y + 9} x2={pt.x} y2={pt.y + 14} stroke={color} strokeWidth="1" />
                        <text
                          x={pt.x}
                          y={pt.y + 24}
                          textAnchor="middle"
                          fill="#f8fafc"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="var(--font-mono)"
                          className="bg-black/80 px-1"
                        >
                          {report.codeName}
                        </text>
                      </>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Coordinates HUD footer */}
          <div className="absolute bottom-3 left-4 z-10 flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500 pointer-events-none">
            <span>GRID: WGS-84</span>
            <span>·</span>
            <span>聚焦坐标: {activeReport ? `${activeReport.coordinates.lat}°N, ${activeReport.coordinates.lng}°E` : '--'}</span>
          </div>

          {/* Global Threat Pulse Live Telemetry Indicator */}
          {showThreatPulse && (
            <div className="absolute bottom-3 right-4 z-10 hidden sm:flex items-center gap-2 bg-[#080d19]/80 backdrop-blur-md px-2.5 py-1 rounded border border-rose-500/30 text-[10px] font-mono text-slate-300 pointer-events-none shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              <span className="text-rose-400 font-semibold tracking-wider">THREAT PULSE: ACTIVE</span>
              <span className="text-slate-600">|</span>
              <span className="text-amber-300">热力指数: 81.4% (DEFCON 2)</span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400">9个核心战区</span>
            </div>
          )}

          {/* 30-Day Regional Trend Chart Floating Tactical Dock */}
          {showTrendChart && (
            trendChartMinimized ? (
              <div className="absolute bottom-10 left-4 z-20 flex items-center gap-2 bg-[#080d19]/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/80 shadow-xl text-xs font-mono">
                <TrendingUp className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span className="text-slate-200 font-semibold">30天各战区情报走势</span>
                <span className="text-slate-600">|</span>
                <span className="text-amber-400/90">峰值: 霍尔木兹 (38%)</span>
                <button
                  onClick={() => setTrendChartMinimized(false)}
                  className="ml-2 text-amber-400 hover:text-amber-300 p-0.5 hover:bg-slate-800 rounded cursor-pointer"
                  title="展开走势图"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="absolute bottom-10 left-3 right-3 sm:left-4 sm:right-4 z-20 h-[270px] sm:h-[295px] max-w-4xl mx-auto shadow-2xl transition-all">
                <div className="relative h-full">
                  <RegionalTrendChart
                    reports={reports}
                    onSelectRegion={handleSelectRegionFromTrend}
                  />
                  {/* Minimize and Close controls in top right */}
                  <div className="absolute top-2.5 right-12 flex items-center gap-1 z-30">
                    <button
                      onClick={() => setTrendChartMinimized(true)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                      title="最小化走势图"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setShowTrendChart(false)}
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors cursor-pointer"
                      title="关闭走势图"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </div>

        {/* Tactical HUD Inspector Drawer (Cols 9-12) */}
        <div className="lg:col-span-4 bg-[#0a0f19] border-t lg:border-t-0 border-slate-800 flex flex-col h-full overflow-y-auto">
          {/* Sidebar Tab Header */}
          <div className="flex items-center border-b border-slate-800 bg-[#070c16] text-xs font-mono shrink-0">
            <button
              onClick={() => setSidebarTab('dossier')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 font-medium transition-colors cursor-pointer ${
                sidebarTab === 'dossier'
                  ? 'border-amber-400 text-amber-400 font-semibold bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>目标档案</span>
            </button>
            <button
              onClick={() => setSidebarTab('trend')}
              className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 font-medium transition-colors cursor-pointer ${
                sidebarTab === 'trend'
                  ? 'border-amber-400 text-amber-400 font-semibold bg-slate-900/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>30天走势研判</span>
            </button>
          </div>

          {sidebarTab === 'trend' ? (
            <div className="p-3 sm:p-4 flex-1 h-full min-h-[440px]">
              <RegionalTrendChart
                reports={reports}
                onSelectRegion={handleSelectRegionFromTrend}
              />
            </div>
          ) : activeReport ? (
            <div className="p-4 sm:p-5 flex flex-col gap-4">
              {/* Header with CodeName & Classification */}
              <div className="flex flex-col gap-1 border-b border-slate-800 pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs tracking-wider text-amber-400 font-semibold">
                    {activeReport.codeName}
                  </span>
                  <span 
                    className="font-mono text-[11px] font-bold tracking-wider px-2 py-0.5 rounded border"
                    style={{
                      borderColor: getThreatColor(activeReport.threatLevel),
                      color: getThreatColor(activeReport.threatLevel),
                      backgroundColor: `${getThreatColor(activeReport.threatLevel)}15`
                    }}
                  >
                    {activeReport.threatLevel} · 密级: {activeReport.classification}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-slate-100 leading-snug mt-1">
                  {activeReport.title}
                </h3>
                {/* Zero-pill metadata line */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1 font-mono">
                  <span>{getCategoryLabel(activeReport.category)}</span>
                  <span>·</span>
                  <span>置信度: {activeReport.sourceReliability}</span>
                  <span>·</span>
                  <span>{activeReport.timestamp}</span>
                </div>
              </div>

              {/* Tactical Satellite / Sensor HUD Mockup Viewport */}
              <div className="relative rounded border border-slate-800 bg-slate-950 p-3 overflow-hidden">
                <div className="absolute top-2 left-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>OPTICAL RECON FEED // SAT-07</span>
                </div>
                <div className="absolute top-2 right-2 text-[10px] font-mono text-slate-500 tabular-nums">
                  LAT: {activeReport.coordinates.lat} | LNG: {activeReport.coordinates.lng}
                </div>

                {/* Styled CSS/SVG Tactical Sensor Graphic (Zero-Broken-Image compliance) */}
                <div className="h-32 mt-5 bg-gradient-to-b from-slate-900 to-slate-950 rounded border border-slate-800/80 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 tactical-grid-dense opacity-40" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Crosshair className="w-16 h-16 text-amber-500/30 stroke-[1]" />
                  </div>
                  <div className="z-10 text-center px-4">
                    <p className="text-xs font-mono text-slate-300 font-semibold">{activeReport.locationName}</p>
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5">多源传感器数据已对齐校验 · 异常概率 92.4%</p>
                  </div>
                  {/* Subtle target telemetry lines */}
                  <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-slate-500">
                    STATUS: {activeReport.status}
                  </div>
                  <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-amber-400/80">
                    TARGET LOCK: ACTIVE
                  </div>
                </div>
              </div>

              {/* Intel Summary */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">研判摘要</span>
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/40 p-2.5 rounded border border-slate-800/60">
                  {activeReport.summary}
                </p>
              </div>

              {/* Key Findings */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">核心证据要点</span>
                <ul className="flex flex-col gap-1.5 text-xs text-slate-300">
                  {activeReport.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-slate-900/20 p-1.5 rounded">
                      <span className="font-mono text-amber-400/80 text-[11px] mt-0.5">[{idx + 1}]</span>
                      <span className="leading-relaxed">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Related Entities */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">关联侦控实体</span>
                <div className="flex flex-wrap gap-1.5">
                  {activeReport.entities.map((entity, idx) => (
                    <span
                      key={idx}
                      className="text-xs font-mono text-slate-300 bg-slate-800/60 border border-slate-700/60 px-2 py-0.5 rounded"
                    >
                      {entity}
                    </span>
                  ))}
                </div>
              </div>

              {/* Priority Action */}
              {activeReport.priorityAction && (
                <div className="flex flex-col gap-1 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded">
                  <span className="text-[11px] font-semibold tracking-wider text-amber-400 uppercase flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    建议指挥处置预案
                  </span>
                  <p className="text-xs text-amber-100/90 leading-relaxed font-mono">
                    {activeReport.priorityAction}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  onClick={() => onSendToAIAnalyst(activeReport)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors cursor-pointer font-semibold shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>深入 AI 战略研判推演</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <Crosshair className="w-10 h-10 text-slate-700 mb-2 stroke-[1]" />
              <p className="text-sm">在地图或列表中选择一个态势目标查看雷达战术档案</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
