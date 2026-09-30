import React, { useState } from 'react';
import { ThreatAlert, TargetEntity, IntelReport } from '../types/intelligence';
import { 
  ShieldAlert, Bell, Check, AlertOctagon, Activity, 
  Eye, CheckCircle2, ChevronRight, Download, Filter 
} from 'lucide-react';

interface ThreatMatrixProps {
  alerts: ThreatAlert[];
  entities: TargetEntity[];
  reports: IntelReport[];
  onAcknowledgeAlert: (alertId: string) => void;
  onSelectIntelReportById: (reportId: string) => void;
}

export const ThreatMatrix: React.FC<ThreatMatrixProps> = ({
  alerts,
  entities,
  reports,
  onAcknowledgeAlert,
  onSelectIntelReportById,
}) => {
  const [defconLevel, setDefconLevel] = useState<number>(3);
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');

  const defconDescriptions: Record<number, { title: string; color: string; desc: string }> = {
    1: { title: 'DEFCON 1 (最高危急)', color: '#f43f5e', desc: '全面处于实战戒备状态，核常兼备打击集群就绪' },
    2: { title: 'DEFCON 2 (红线武装预警)', color: '#ea580c', desc: '武装力量进入最高战备待命状态，战略导弹旅进入发射发射井' },
    3: { title: 'DEFCON 3 (防务戒备升级)', color: '#f59e0b', desc: '空军与海军重点海空走廊战备值班，截获多源异常电磁信号' },
    4: { title: 'DEFCON 4 (增强侦搜状态)', color: '#38bdf8', desc: '提高全频段被动侦听与低轨卫星过顶重访频次，重点监控影子实体' },
    5: { title: 'DEFCON 5 (日常战备巡航)', color: '#10b981', desc: '各战区执行常规和平时期战备执勤，态势指标名义平稳' },
  };

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'ALL') return true;
    return a.severity === filterSeverity;
  });

  const criticalCount = reports.filter((r) => r.threatLevel === 'CRITICAL').length;
  const highCount = reports.filter((r) => r.threatLevel === 'HIGH').length;
  const elevatedCount = reports.filter((r) => r.threatLevel === 'ELEVATED').length;

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#0b0f17] p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto w-full flex flex-col gap-6">
        {/* DEFCON Command Status Banner */}
        <div className="bg-[#090d16] border border-slate-800 rounded p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded border flex items-center justify-center font-mono font-black text-xl shrink-0"
              style={{
                borderColor: defconDescriptions[defconLevel].color,
                color: defconDescriptions[defconLevel].color,
                backgroundColor: `${defconDescriptions[defconLevel].color}15`,
              }}
            >
              D-{defconLevel}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                STRATEGIC DEFENSE CONDITION STATUS
              </span>
              <h2 className="text-base font-bold text-slate-100">
                {defconDescriptions[defconLevel].title}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {defconDescriptions[defconLevel].desc}
              </p>
            </div>
          </div>

          {/* DEFCON Selector Buttons */}
          <div className="flex items-center gap-1 self-start md:self-auto border border-slate-800 p-1 bg-slate-950 rounded">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDefconLevel(lvl)}
                className={`px-3 py-1 text-xs font-mono font-bold rounded transition-colors cursor-pointer ${
                  defconLevel === lvl
                    ? 'text-slate-950'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                style={{
                  backgroundColor: defconLevel === lvl ? defconDescriptions[lvl].color : 'transparent',
                }}
              >
                L-{lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Global Threat Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase">严重威胁电报 (CRITICAL)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-rose-500 tabular-nums">{criticalCount}</span>
              <span className="text-[11px] text-rose-400 font-mono">需要首长批示</span>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase">高危异常事件 (HIGH)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-orange-400 tabular-nums">{highCount}</span>
              <span className="text-[11px] text-orange-400/80 font-mono">侦测加权持续</span>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase">重点锁定实体 (ENTITIES)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-amber-400 tabular-nums">{entities.length}</span>
              <span className="text-[11px] text-slate-400 font-mono">已入图谱</span>
            </div>
          </div>

          <div className="bg-[#090d16] border border-slate-800 p-3.5 rounded flex flex-col gap-1">
            <span className="text-[11px] font-mono text-slate-500 uppercase">实时报警流 (ACTIVE ALERTS)</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-sky-400 tabular-nums">
                {alerts.filter((a) => !a.acknowledged).length}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">未处置</span>
            </div>
          </div>
        </div>

        {/* Two-column layout: Alerts Stream + Target Watchlist */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Real-time Threat Alerts (7 cols) */}
          <div className="lg:col-span-7 bg-[#090d16] border border-slate-800 rounded p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                  实时威胁预警流 (ACTIVE ALERT FEEDS)
                </span>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                {['ALL', 'CRITICAL', 'WARNING'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setFilterSeverity(sev)}
                    className={`px-2 py-0.5 rounded font-mono text-[11px] cursor-pointer transition-colors ${
                      filterSeverity === sev
                        ? 'bg-slate-700 text-amber-400 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {sev === 'ALL' ? '全部' : sev}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {filteredAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3.5 rounded border transition-colors flex items-start justify-between gap-3 text-xs ${
                    alert.acknowledged
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <AlertOctagon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${
                        alert.severity === 'CRITICAL'
                          ? 'text-rose-500'
                          : alert.severity === 'WARNING'
                          ? 'text-orange-400'
                          : 'text-sky-400'
                      }`}
                    />
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200">{alert.title}</span>
                        <span className="text-[10px] font-mono text-slate-500">{alert.region}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        <span>{alert.source}</span>
                        <span>·</span>
                        <span>{alert.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {alert.intelId && (
                      <button
                        onClick={() => onSelectIntelReportById(alert.intelId!)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded font-mono text-[11px] cursor-pointer transition-colors"
                      >
                        查阅电报
                      </button>
                    )}
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className={`p-1 rounded cursor-pointer transition-colors ${
                        alert.acknowledged
                          ? 'text-emerald-400 bg-emerald-950/40'
                          : 'text-slate-400 hover:text-slate-200 bg-slate-800'
                      }`}
                      title={alert.acknowledged ? '已确知' : '标记已核准'}
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Strategic Watchlist Table (5 cols) */}
          <div className="lg:col-span-5 bg-[#090d16] border border-slate-800 rounded p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-400" />
                <span className="font-mono text-xs font-bold text-slate-100 uppercase tracking-wider">
                  重点防务侦控清单 (WATCHLIST)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 tabular-nums">
                按威胁评分逆序
              </span>
            </div>

            <div className="divide-y divide-slate-800/80">
              {entities.map((entity) => (
                <div key={entity.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">{entity.name}</span>
                    <span className="text-[10px] font-mono text-slate-500">
                      {entity.codeName} · {entity.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 font-mono tabular-nums">
                    <span
                      className="font-bold text-xs"
                      style={{
                        color:
                          entity.threatScore >= 90
                            ? '#f43f5e'
                            : entity.threatScore >= 80
                            ? '#fb923c'
                            : '#38bdf8',
                      }}
                    >
                      {entity.threatScore}分
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {entity.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
