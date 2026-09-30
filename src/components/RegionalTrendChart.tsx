import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, LineChart, Line, 
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend 
} from 'recharts';
import { 
  TrendingUp, BarChart3, LineChart as LineIcon, Layers, 
  MapPin, AlertTriangle, ShieldAlert, Sparkles, Filter,
  Maximize2, Minimize2, Calendar, Radio
} from 'lucide-react';
import { IntelReport } from '../types/intelligence';

export interface RegionalTrendChartProps {
  reports: IntelReport[];
  onSelectRegion?: (regionName: string) => void;
  selectedRegionName?: string | null;
  compact?: boolean;
}

export interface RegionConfig {
  id: string;
  name: string;
  shortName: string;
  color: string;
  gradientId: string;
  keywords: string[];
}

export const STRATEGIC_REGIONS: RegionConfig[] = [
  {
    id: 'gulf',
    name: '中东·霍尔木兹中枢',
    shortName: '霍尔木兹',
    color: '#f43f5e', // rose-500
    gradientId: 'colorGulf',
    keywords: ['霍尔木兹', '阿曼', '波斯湾', '中东', '伊朗', '阿联酋'],
  },
  {
    id: 'wpac',
    name: '印太·西太平洋岛链',
    shortName: '西太平洋',
    color: '#38bdf8', // sky-400
    gradientId: 'colorWpac',
    keywords: ['太平洋', '关岛', '台海', '第一岛链', '西太', '巴士海峡'],
  },
  {
    id: 'arctic',
    name: '北极·斯瓦尔巴走廊',
    shortName: '斯瓦尔巴',
    color: '#34d399', // emerald-400
    gradientId: 'colorArctic',
    keywords: ['斯瓦尔巴', '北极', '北冰洋', '巴伦支海', '极地'],
  },
  {
    id: 'malacca',
    name: '东南亚·马六甲咽喉',
    shortName: '马六甲',
    color: '#a855f7', // purple-500
    gradientId: 'colorMalacca',
    keywords: ['马六甲', '新加坡', '南海', '印尼', '苏门答腊'],
  },
  {
    id: 'europe',
    name: '欧洲·法兰克福/波罗的海',
    shortName: '西欧/波罗的海',
    color: '#fb923c', // orange-400
    gradientId: 'colorEurope',
    keywords: ['法兰克福', '欧洲', '德国', '波罗的海', '西欧', '顿巴斯'],
  },
  {
    id: 'geneva',
    name: '中欧·日内瓦防务线',
    shortName: '日内瓦',
    color: '#eab308', // yellow-500
    gradientId: 'colorGeneva',
    keywords: ['日内瓦', '瑞士', '科技防务', '量子'],
  },
];

// Helper to categorize a report to one of our strategic regions
export const getReportRegionId = (report: IntelReport): string => {
  const text = `${report.locationName} ${report.summary} ${report.title} ${report.tags.join(' ')}`.toLowerCase();
  
  for (const reg of STRATEGIC_REGIONS) {
    if (reg.keywords.some((k) => text.includes(k.toLowerCase()))) {
      return reg.id;
    }
  }

  // Fallback by coordinates
  const lat = report.coordinates.lat;
  const lng = report.coordinates.lng;

  if (lat > 65) return 'arctic';
  if (lat >= 15 && lat <= 35 && lng >= 40 && lng <= 65) return 'gulf';
  if (lat >= -5 && lat <= 15 && lng >= 95 && lng <= 115) return 'malacca';
  if (lat >= 10 && lat <= 40 && lng >= 115 && lng <= 155) return 'wpac';
  if (lat >= 45 && lat <= 60 && lng >= 5 && lng <= 30) return 'europe';
  return 'geneva';
};

export const RegionalTrendChart: React.FC<RegionalTrendChartProps> = ({
  reports,
  onSelectRegion,
  selectedRegionName,
  compact = false,
}) => {
  const [chartType, setChartType] = useState<'area' | 'line' | 'bar'>('area');
  const [activeRegions, setActiveRegions] = useState<Record<string, boolean>>({
    gulf: true,
    wpac: true,
    arctic: true,
    malacca: true,
    europe: true,
    geneva: true,
  });

  // Toggle a single region filter
  const toggleRegion = (regionId: string) => {
    setActiveRegions((prev) => {
      const isCurrentlyOnlyOneActive = Object.values(prev).filter(Boolean).length === 1 && prev[regionId];
      if (isCurrentlyOnlyOneActive) {
        // If clicking the only active one, re-enable all
        const allEnabled: Record<string, boolean> = {};
        STRATEGIC_REGIONS.forEach((r) => (allEnabled[r.id] = true));
        return allEnabled;
      }
      return { ...prev, [regionId]: !prev[regionId] };
    });
  };

  // Isolate a region
  const isolateRegion = (regionId: string) => {
    const updated: Record<string, boolean> = {};
    STRATEGIC_REGIONS.forEach((r) => {
      updated[r.id] = r.id === regionId;
    });
    setActiveRegions(updated);
    if (onSelectRegion) {
      const reg = STRATEGIC_REGIONS.find((r) => r.id === regionId);
      if (reg) onSelectRegion(reg.name);
    }
  };

  const resetAllRegions = () => {
    const allEnabled: Record<string, boolean> = {};
    STRATEGIC_REGIONS.forEach((r) => (allEnabled[r.id] = true));
    setActiveRegions(allEnabled);
  };

  // Generate 30-day timeline series (from 30 days ago up to 2026-09-30)
  const trendData = useMemo(() => {
    const days: {
      date: string;
      rawDate: string;
      label: string;
      dayIndex: number;
      gulf: number;
      wpac: number;
      arctic: number;
      malacca: number;
      europe: number;
      geneva: number;
      total: number;
    }[] = [];

    // Current mock reference date is 2026-09-30
    const now = new Date(Date.UTC(2026, 8, 30));

    // Baseline historical patterns for 30 days
    // Specific incident surges around day 12 (North Atlantic cable incident),
    // day 18 (GPS spoofing outbreak in Malacca), day 24 (Hypersonic test Pacific),
    // and day 28-30 (Hormuz EMP & SCADA cyber attack)
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const dateKey = `${month}-${day}`;
      const fullDateStr = `2026-${month}-${day}`;

      // Realistic pseudo-random deterministic telemetry baseline based on day index
      const seed1 = Math.sin(i * 1.3) * 2;
      const seed2 = Math.cos(i * 0.9) * 1.5;
      const seed3 = Math.sin(i * 2.1) * 1.8;

      let baseGulf = Math.max(1, Math.round(3 + seed1 + (i < 5 ? 4 : 0) + (i >= 22 ? 2 : 0)));
      let baseWpac = Math.max(1, Math.round(2 + seed2 + (i === 6 || i === 7 ? 4 : 0)));
      let baseArctic = Math.max(0, Math.round(1 + seed3 + (i === 2 || i === 3 ? 3 : 0)));
      let baseMalacca = Math.max(0, Math.round(2 + Math.cos(i * 1.7) * 2 + (i === 1 ? 3 : 0)));
      let baseEurope = Math.max(1, Math.round(2 + Math.sin(i * 0.7) * 2 + (i < 3 ? 3 : 0)));
      let baseGeneva = Math.max(0, Math.round(1 + Math.sin(i * 1.1) * 1.2 + (i === 1 ? 2 : 0)));

      days.push({
        date: dateKey,
        rawDate: fullDateStr,
        label: i === 0 ? '今日 (09-30)' : `${dateKey}`,
        dayIndex: 30 - i,
        gulf: baseGulf,
        wpac: baseWpac,
        arctic: baseArctic,
        malacca: baseMalacca,
        europe: baseEurope,
        geneva: baseGeneva,
        total: baseGulf + baseWpac + baseArctic + baseMalacca + baseEurope + baseGeneva,
      });
    }

    // Now map actual dynamic reports from memory into their dates!
    reports.forEach((rep) => {
      const regId = getReportRegionId(rep);
      // Try to parse report timestamp (e.g. "2026-09-30 06:14 UTC" or ISO)
      let reportDateStr = '2026-09-30';
      if (rep.timestamp.includes('2026-')) {
        const match = rep.timestamp.match(/2026-\d{2}-\d{2}/);
        if (match) reportDateStr = match[0];
      }

      const foundDay = days.find((d) => d.rawDate === reportDateStr) || days[days.length - 1];
      if (foundDay && regId in foundDay) {
        // Increment frequency count for this real report
        (foundDay as any)[regId] += 2;
        foundDay.total += 2;
      }
    });

    return days;
  }, [reports]);

  // Aggregate 30-day stats
  const stats = useMemo(() => {
    let totalReports = 0;
    const regionTotals: Record<string, number> = {
      gulf: 0,
      wpac: 0,
      arctic: 0,
      malacca: 0,
      europe: 0,
      geneva: 0,
    };

    trendData.forEach((d) => {
      totalReports += d.total;
      STRATEGIC_REGIONS.forEach((r) => {
        regionTotals[r.id] += (d as any)[r.id] || 0;
      });
    });

    // Find highest region
    let topRegion = STRATEGIC_REGIONS[0];
    let maxCount = 0;
    STRATEGIC_REGIONS.forEach((r) => {
      if (regionTotals[r.id] > maxCount) {
        maxCount = regionTotals[r.id];
        topRegion = r;
      }
    });

    // Compute velocity (last 7 days vs previous 7 days)
    const recent7Days = trendData.slice(-7).reduce((acc, curr) => acc + curr.total, 0);
    const prev7Days = trendData.slice(-14, -7).reduce((acc, curr) => acc + curr.total, 0);
    const growthRate = prev7Days > 0 ? (((recent7Days - prev7Days) / prev7Days) * 100).toFixed(1) : '+24.5';

    return {
      totalReports,
      regionTotals,
      topRegion,
      topPercent: totalReports > 0 ? Math.round((maxCount / totalReports) * 100) : 0,
      growthRate,
    };
  }, [trendData]);

  // Custom Dark HUD Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    const totalCount = payload.reduce((acc: number, item: any) => acc + (Number(item.value) || 0), 0);

    return (
      <div className="bg-[#080d19]/95 border border-slate-700/90 rounded-lg p-3 shadow-2xl backdrop-blur-md text-xs font-mono min-w-[210px] pointer-events-none z-50">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dataPoint?.rawDate || label}</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
            日总计: {totalCount} 批
          </span>
        </div>

        <div className="space-y-1.5">
          {payload.map((entry: any) => {
            const regConfig = STRATEGIC_REGIONS.find((r) => r.id === entry.dataKey);
            if (!regConfig) return null;

            return (
              <div key={entry.dataKey} className="flex items-center justify-between gap-3 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 truncate max-w-[120px]">{regConfig.shortName}</span>
                </div>
                <div className="flex items-center gap-1 font-semibold tabular-nums text-slate-100">
                  <span>{entry.value}</span>
                  <span className="text-[10px] text-slate-500 font-normal">批</span>
                </div>
              </div>
            );
          })}
        </div>

        {totalCount > 10 && (
          <div className="mt-2 pt-1.5 border-t border-slate-800/80 text-[10px] text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>该日侦搜频次超均线 32% (战区戒备升级)</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#070b13] text-slate-100 rounded-lg overflow-hidden border border-slate-800/90 shadow-xl">
      {/* Header bar */}
      <div className="p-3 sm:px-4 sm:py-3 border-b border-slate-800/80 bg-[#0a0f1c] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-amber-400/10 border border-amber-400/30 text-amber-400">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-semibold tracking-wide text-slate-100">
                30日各战略战区态势情报频次走势
              </h3>
              <span className="hidden sm:inline-block px-1.5 py-0.2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono rounded">
                LIVE TELEMETRY
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 hidden sm:block">
              涵盖近30天多源情报入库、高频异常信号截获与雷达监测频次分布
            </p>
          </div>
        </div>

        {/* Chart type controls & reset */}
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-900 border border-slate-800 p-0.5 rounded flex items-center gap-0.5 text-xs">
            <button
              onClick={() => setChartType('area')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartType === 'area'
                  ? 'bg-slate-700 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="切换为堆叠面积走势图"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartType === 'line'
                  ? 'bg-slate-700 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="切换为多维折线对比图"
            >
              <LineIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                chartType === 'bar'
                  ? 'bg-slate-700 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="切换为日频次柱状分布图"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={resetAllRegions}
            className="text-[11px] font-mono px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-800 rounded transition-colors cursor-pointer"
            title="恢复全部战区显示"
          >
            重置全选
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-950/60 border-b border-slate-800/80 text-xs font-mono shrink-0">
        <div className="bg-[#0b101c] p-2 rounded border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase">30天全域情报吞吐</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-slate-100 tabular-nums">
              {stats.totalReports}
            </span>
            <span className="text-[11px] text-slate-400">批次</span>
          </div>
        </div>

        <div className="bg-[#0b101c] p-2 rounded border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase">高频预警战区</span>
          <div className="flex items-baseline gap-1.5 truncate">
            <span 
              className="text-xs sm:text-sm font-bold truncate"
              style={{ color: stats.topRegion.color }}
            >
              {stats.topRegion.shortName}
            </span>
            <span className="text-[10px] text-amber-400/90 font-semibold tabular-nums">
              {stats.topPercent}%
            </span>
          </div>
        </div>

        <div className="bg-[#0b101c] p-2 rounded border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase">7日战备增速环比</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base sm:text-lg font-bold text-rose-400 tabular-nums">
              {stats.growthRate}%
            </span>
            <span className="text-[10px] text-rose-500 font-semibold">↑ 加速</span>
          </div>
        </div>

        <div className="bg-[#0b101c] p-2 rounded border border-slate-800/80 flex flex-col gap-0.5">
          <span className="text-[10px] text-slate-500 uppercase">综合防御警戒级</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              DEFCON 2
            </span>
            <span className="text-[10px] text-slate-400">极高战备</span>
          </div>
        </div>
      </div>

      {/* Interactive Region Filter Legend Chips */}
      <div className="px-3 sm:px-4 py-2 bg-[#090d18] border-b border-slate-800/60 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] font-mono shrink-0">
        <span className="text-slate-500 text-[10px] uppercase flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3 text-slate-500" />
          战区过滤:
        </span>
        {STRATEGIC_REGIONS.map((reg) => {
          const isEnabled = activeRegions[reg.id];
          const count = stats.regionTotals[reg.id] || 0;

          return (
            <button
              key={reg.id}
              onClick={() => toggleRegion(reg.id)}
              onDoubleClick={() => isolateRegion(reg.id)}
              className={`px-2 py-0.5 rounded border transition-all flex items-center gap-1.5 cursor-pointer text-[11px] ${
                isEnabled
                  ? 'bg-slate-900 border-slate-700 text-slate-200 shadow-sm'
                  : 'bg-slate-950/40 border-slate-850 text-slate-600 opacity-60'
              }`}
              title={`点击切换 ${reg.name}，双击单独聚焦 (共 ${count} 批)`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0 transition-opacity"
                style={{
                  backgroundColor: reg.color,
                  boxShadow: isEnabled ? `0 0 6px ${reg.color}60` : 'none',
                }}
              />
              <span className="font-medium">{reg.shortName}</span>
              <span className="text-[10px] text-slate-500 tabular-nums">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Recharts Container */}
      <div className="flex-1 w-full min-h-[190px] p-2 sm:p-4 relative">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'area' ? (
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                {STRATEGIC_REGIONS.map((reg) => (
                  <linearGradient key={reg.id} id={reg.gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={reg.color} stopOpacity={0.65} />
                    <stop offset="95%" stopColor={reg.color} stopOpacity={0.05} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                interval={Math.floor(trendData.length / 8)}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {STRATEGIC_REGIONS.map((reg) => {
                if (!activeRegions[reg.id]) return null;
                return (
                  <Area
                    key={reg.id}
                    type="monotone"
                    dataKey={reg.id}
                    name={reg.shortName}
                    stroke={reg.color}
                    strokeWidth={2}
                    fillOpacity={1}
                    fill={`url(#${reg.gradientId})`}
                    stackId="1"
                    activeDot={{ r: 4, stroke: '#fff', strokeWidth: 1.5 }}
                  />
                );
              })}
            </AreaChart>
          ) : chartType === 'line' ? (
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                interval={Math.floor(trendData.length / 8)}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {STRATEGIC_REGIONS.map((reg) => {
                if (!activeRegions[reg.id]) return null;
                return (
                  <Line
                    key={reg.id}
                    type="monotone"
                    dataKey={reg.id}
                    name={reg.shortName}
                    stroke={reg.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }}
                  />
                );
              })}
            </LineChart>
          ) : (
            <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />
              <XAxis
                dataKey="date"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                interval={Math.floor(trendData.length / 8)}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'var(--font-mono)' }}
                tickLine={{ stroke: '#334155' }}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              {STRATEGIC_REGIONS.map((reg) => {
                if (!activeRegions[reg.id]) return null;
                return (
                  <Bar
                    key={reg.id}
                    dataKey={reg.id}
                    name={reg.shortName}
                    fill={reg.color}
                    stackId="a"
                    radius={[1, 1, 0, 0]}
                  />
                );
              })}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Footer Tactical Insight note */}
      <div className="px-3 sm:px-4 py-2 bg-[#080c16] border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[10px] font-mono text-slate-500 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span>研判提示: 波斯湾光缆异动与西欧工控SCADA渗透形成双峰态势，建议重点加强第3巡逻机侦搜频次</span>
        </div>
        <span className="text-slate-600 hidden md:inline">
          滚动窗口: 30 DAYS (ROLLING) · RECHARTS TACTICAL TELEMETRY
        </span>
      </div>
    </div>
  );
};
