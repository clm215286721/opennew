import React, { useMemo, useState } from 'react';
import { TargetEntity, IntelReport } from '../types/intelligence';
import { 
  ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, ReferenceLine 
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Clock, Activity, AlertTriangle, 
  Sparkles, Calendar, Layers, ArrowUpRight, BarChart2, Shield
} from 'lucide-react';

export interface EntityInfluenceTemporalChartProps {
  entity: TargetEntity;
  reports: IntelReport[];
  onSelectIntelReport?: (report: IntelReport) => void;
}

export const EntityInfluenceTemporalChart: React.FC<EntityInfluenceTemporalChartProps> = ({
  entity,
  reports,
  onSelectIntelReport,
}) => {
  const [timeRange, setTimeRange] = useState<'7D' | '15D' | '30D'>('15D');

  // Filter direct matching reports
  const matchedReports = useMemo(() => {
    return reports.filter((r) =>
      r.entities.some(
        (e) =>
          e.toLowerCase().includes(entity.name.toLowerCase()) ||
          entity.name.toLowerCase().includes(e.toLowerCase()) ||
          (entity.codeName && e.toLowerCase().includes(entity.codeName.toLowerCase()))
      ) ||
      r.title.toLowerCase().includes(entity.name.toLowerCase()) ||
      r.summary.toLowerCase().includes(entity.name.toLowerCase())
    );
  }, [entity, reports]);

  // Generate temporal mention series across selected range ending at 2026-09-30
  const seriesData = useMemo(() => {
    const daysCount = timeRange === '7D' ? 7 : timeRange === '15D' ? 15 : 30;
    const baseDate = new Date(Date.UTC(2026, 8, 30)); // 2026-09-30

    // Map existing reports into date map: YYYY-MM-DD -> IntelReport[]
    const reportDateMap: Record<string, IntelReport[]> = {};
    matchedReports.forEach((rep) => {
      const match = rep.timestamp.match(/(\d{4})-(\d{2})-(\d{2})/);
      const dateKey = match ? match[0] : '2026-09-30';
      if (!reportDateMap[dateKey]) {
        reportDateMap[dateKey] = [];
      }
      reportDateMap[dateKey].push(rep);
    });

    const result = [];
    let maxMentions = 0;

    // Entity baseline seed for deterministic historical continuity
    const entitySeed = entity.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const scoreFactor = entity.threatScore / 100;

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseDate.getTime() - i * 86400000);
      const yyyy = d.getUTCFullYear();
      const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const shortDate = `${mm}/${dd}`;

      const matchedToday = reportDateMap[dateKey] || [];
      const directCount = matchedToday.length;

      // Realistic historical baseline telemetry for periods prior to current active day
      let syntheticHistorical = 0;
      if (i > 2) {
        // Pseudo-random pseudo-frequency consistent with entity's threat level
        const wave = Math.sin((i + entitySeed) * 0.7);
        if (scoreFactor > 0.85) {
          syntheticHistorical = wave > 0.2 ? Math.floor(wave * 2.2 + 1) : (i % 3 === 0 ? 1 : 0);
        } else if (scoreFactor > 0.7) {
          syntheticHistorical = wave > 0.5 ? 1 : 0;
        } else {
          syntheticHistorical = (i + entitySeed) % 5 === 0 ? 1 : 0;
        }
      } else if (i === 1) {
        syntheticHistorical = scoreFactor > 0.8 ? 2 : 1;
      }

      // Total mentions for this day
      const totalMentions = directCount > 0 ? directCount : syntheticHistorical;
      if (totalMentions > maxMentions) maxMentions = totalMentions;

      // Weighted influence index (mentions * severity multiplier + baseline threat score component)
      const severityMultiplier = entity.threatLevel === 'CRITICAL' ? 1.5 : entity.threatLevel === 'HIGH' ? 1.2 : 1.0;
      const influenceIndex = Math.min(100, Math.round(totalMentions * 22 * severityMultiplier + entity.threatScore * 0.35));

      result.push({
        date: shortDate,
        fullDate: dateKey,
        mentions: totalMentions,
        influenceIndex,
        reportCodes: matchedToday.map((r) => r.codeName),
        reports: matchedToday,
      });
    }

    return result.map((item) => ({
      ...item,
      isPeak: item.mentions === maxMentions && maxMentions > 0,
    }));
  }, [timeRange, matchedReports, entity]);

  // Calculate metrics
  const totalPeriodMentions = useMemo(() => {
    return seriesData.reduce((acc, cur) => acc + cur.mentions, 0);
  }, [seriesData]);

  const peakPoint = useMemo(() => {
    return seriesData.reduce((prev, curr) => (curr.mentions > prev.mentions ? curr : prev), seriesData[0]);
  }, [seriesData]);

  const trendRate = useMemo(() => {
    if (seriesData.length < 4) return 0;
    const recent = seriesData.slice(-3).reduce((acc, c) => acc + c.mentions, 0);
    const earlier = seriesData.slice(0, 3).reduce((acc, c) => acc + c.mentions, 0);
    if (earlier === 0) return recent > 0 ? 100 : 0;
    return Math.round(((recent - earlier) / earlier) * 100);
  }, [seriesData]);

  return (
    <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-3 sm:p-4 flex flex-col gap-3 font-mono text-slate-200">
      {/* Header and Time-Range Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/15 border border-amber-400/30 text-amber-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-100 font-sans tracking-wide">
                实体情报提及频次与影响力时序走势
              </span>
              <span className="text-[10px] bg-slate-900 border border-slate-700 text-amber-400 px-1 py-0.2 rounded">
                TEMPORAL FREQUENCY
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono">
              追踪该实体在多源电报与案卷中被标记、拦截及提及的时序波动
            </p>
          </div>
        </div>

        {/* Range Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px]">
          {(['7D', '15D', '30D'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                timeRange === r
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {r === '7D' ? '近7天' : r === '15D' ? '近15天' : '近30天'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="p-2 bg-slate-950/60 rounded border border-slate-850 flex flex-col">
          <span className="text-[10px] text-slate-500">区间累计提及</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-base font-bold text-slate-100 tabular-nums">{totalPeriodMentions}</span>
            <span className="text-[10px] text-slate-500">次</span>
          </div>
        </div>

        <div className="p-2 bg-slate-950/60 rounded border border-slate-850 flex flex-col">
          <span className="text-[10px] text-slate-500">峰值提及活跃期</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-amber-300 truncate">{peakPoint?.date || 'N/A'}</span>
            <span className="text-[10px] text-rose-400 font-bold">({peakPoint?.mentions || 0}次)</span>
          </div>
        </div>

        <div className="p-2 bg-slate-950/60 rounded border border-slate-850 flex flex-col">
          <span className="text-[10px] text-slate-500">近期时序演变态势</span>
          <div className="flex items-center gap-1 mt-0.5">
            {trendRate >= 0 ? (
              <>
                <TrendingUp className="w-3 h-3 text-rose-400 shrink-0" />
                <span className="text-rose-400 font-bold text-xs">+{trendRate}% 激增</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-emerald-400 font-bold text-xs">{trendRate}% 趋缓</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Recharts Area / Line Chart */}
      <div className="h-44 w-full bg-slate-950/40 rounded border border-slate-850 p-2 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={seriesData} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
            <defs>
              <linearGradient id="mentionAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="influenceLineGradient" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="70%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.6} />

            <XAxis 
              dataKey="date" 
              stroke="#64748b" 
              fontSize={9} 
              tickLine={false} 
              interval="preserveStartEnd" 
            />

            <YAxis 
              stroke="#64748b" 
              fontSize={9} 
              tickLine={false} 
              domain={[0, 'auto']} 
              allowDecimals={false} 
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-[#090e1c] border border-amber-500/80 rounded p-2 shadow-xl text-[10px] font-mono text-slate-100 flex flex-col gap-1 min-w-[150px]">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <span className="text-amber-400 font-bold">{data.fullDate}</span>
                        {data.isPeak && (
                          <span className="bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.2 rounded font-bold text-[9px]">
                            活跃峰值
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-slate-300">
                        <span>电报提及频次:</span>
                        <span className="text-amber-300 font-bold text-xs">{data.mentions} 次</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>时序威胁权重:</span>
                        <span className="text-rose-400 font-bold">{data.influenceIndex} 分</span>
                      </div>
                      {data.reportCodes && data.reportCodes.length > 0 && (
                        <div className="border-t border-slate-850 pt-1 text-[9px] text-sky-300 flex flex-col gap-0.5">
                          <span className="text-slate-500">涉案代号:</span>
                          <span className="truncate">{data.reportCodes.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />

            {/* Reference line for peak point */}
            {peakPoint && peakPoint.mentions > 0 && (
              <ReferenceLine
                y={peakPoint.mentions}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                strokeWidth={0.8}
                opacity={0.6}
              />
            )}

            {/* Mentions Area Fill */}
            <Area
              type="monotone"
              dataKey="mentions"
              stroke="#fbbf24"
              strokeWidth={2}
              fill="url(#mentionAreaGradient)"
              activeDot={{ r: 5, fill: '#f43f5e', stroke: '#fff', strokeWidth: 1.5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Linked Reports Trigger List */}
      {matchedReports.length > 0 && (
        <div className="flex flex-col gap-1 text-[11px]">
          <div className="flex items-center justify-between text-slate-400">
            <span className="font-semibold text-slate-300">当前案卷库关联电报 ({matchedReports.length} 篇):</span>
            <span className="text-[10px] text-slate-500">点击直达解密电报</span>
          </div>

          <div className="flex flex-col gap-1 max-h-24 overflow-y-auto pr-1">
            {matchedReports.map((r) => (
              <div
                key={r.id}
                onClick={() => onSelectIntelReport?.(r)}
                className="p-1.5 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span className="text-amber-400 font-bold shrink-0">[{r.codeName}]</span>
                  <span className="text-slate-300 truncate">{r.title}</span>
                </div>
                <span className="text-[10px] text-slate-500 shrink-0 ml-2 font-mono">
                  {r.timestamp.split(' ')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
