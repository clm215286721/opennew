import React, { useState, useMemo } from 'react';
import { TargetEntity, ThreatLevel, IntelReport } from '../types/intelligence';
import { 
  Network, Search, User, ShieldAlert, Cpu, Anchor, 
  Building2, Radio, Zap, ArrowRight, Eye, Crosshair 
} from 'lucide-react';

interface EntityGraphProps {
  entities: TargetEntity[];
  reports: IntelReport[];
  onSelectIntelReport: (report: IntelReport) => void;
}

export const EntityGraph: React.FC<EntityGraphProps> = ({
  entities,
  reports,
  onSelectIntelReport,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [activeEntityId, setActiveEntityId] = useState<string>(entities[0]?.id || '');
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);

  // Position nodes in an aesthetically balanced tactical force layout
  const graphWidth = 800;
  const graphHeight = 520;
  const centerX = graphWidth / 2;
  const centerY = graphHeight / 2;

  // Compute fixed balanced coordinates for the initial 8 entities so it's rock-solid and stable
  const nodePositions = useMemo(() => {
    const posMap: Record<string, { x: number; y: number }> = {};
    const count = entities.length;
    entities.forEach((entity, index) => {
      // Distribute in two orbital tiers
      const isInner = index < 4;
      const radius = isInner ? 140 : 220;
      const angle = (index / count) * 2 * Math.PI - Math.PI / 2;
      posMap[entity.id] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
      };
    });
    return posMap;
  }, [entities, centerX, centerY]);

  const filteredEntities = useMemo(() => {
    return entities.filter((e) => {
      const matchSearch =
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.codeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.details.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = selectedType === 'ALL' || e.type === selectedType;
      return matchSearch && matchType;
    });
  }, [entities, searchQuery, selectedType]);

  const activeEntity = useMemo(() => {
    return entities.find((e) => e.id === activeEntityId) || entities[0];
  }, [entities, activeEntityId]);

  // Find linked entities for active entity
  const activeLinks = useMemo(() => {
    if (!activeEntity) return [];
    return activeEntity.linkedEntityIds.map((l) => {
      const target = entities.find((e) => e.id === l.targetId);
      return {
        target,
        relation: l.relation,
      };
    }).filter((item) => item.target !== undefined);
  }, [activeEntity, entities]);

  // Find related intelligence reports
  const relatedReports = useMemo(() => {
    if (!activeEntity) return [];
    return reports.filter((r) =>
      r.entities.some((e) => e.includes(activeEntity.name) || activeEntity.name.includes(e))
    );
  }, [activeEntity, reports]);

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL': return '#f43f5e';
      case 'HIGH': return '#fb923c';
      case 'ELEVATED': return '#38bdf8';
      case 'GUARDED': return '#34d399';
      default: return '#94a3b8';
    }
  };

  const getEntityIcon = (type: TargetEntity['type']) => {
    switch (type) {
      case 'CYBER_ACTOR': return <Cpu className="w-3.5 h-3.5" />;
      case 'INDIVIDUAL': return <User className="w-3.5 h-3.5" />;
      case 'ORGANIZATION': return <Building2 className="w-3.5 h-3.5" />;
      case 'VESSEL': return <Anchor className="w-3.5 h-3.5" />;
      case 'INFRASTRUCTURE': return <Zap className="w-3.5 h-3.5" />;
      default: return <Network className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] overflow-hidden bg-[#0b0f17]">
      {/* Top Filter Bar */}
      <div className="px-4 py-2.5 border-b border-slate-800 bg-[#0e1420] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="快速检索目标代号、人员、影子实体..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded text-slate-200 text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500/50 font-mono"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: '全部实体' },
            { id: 'CYBER_ACTOR', label: 'CYBER 网络组织' },
            { id: 'ORGANIZATION', label: '影子机构/航运' },
            { id: 'INFRASTRUCTURE', label: '关键基础设施' },
            { id: 'INDIVIDUAL', label: '重点人员' },
            { id: 'VESSEL', label: '特种船只' },
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap font-medium cursor-pointer ${
                selectedType === type.id
                  ? 'bg-slate-700 text-amber-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Interactive Visual Graph, Right Target Dossier */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Graph Canvas (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-[#070a10] border-b lg:border-b-0 lg:border-r border-slate-800 relative flex items-center justify-center overflow-hidden tactical-grid">
          {/* Tactical Overlay */}
          <div className="absolute top-3 left-4 z-10 flex items-center gap-3 text-[11px] font-mono tabular-nums text-slate-500 pointer-events-none">
            <span className="text-amber-400 font-semibold">ENTITY LINKAGE TOPOLOGY</span>
            <span>·</span>
            <span>节点数: {entities.length}</span>
            <span>·</span>
            <span>关系链路: {entities.reduce((acc, e) => acc + e.linkedEntityIds.length, 0)} 条</span>
          </div>

          <div className="absolute bottom-3 left-4 z-10 text-[11px] font-mono text-slate-500 pointer-events-none">
            单击节点锁定目标档案 · 双向拓扑关系侦测模式
          </div>

          <svg
            viewBox={`0 0 ${graphWidth} ${graphHeight}`}
            className="w-full h-full max-h-[92%] select-none"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Draw Links */}
            {entities.map((sourceEntity) => {
              const srcPos = nodePositions[sourceEntity.id];
              if (!srcPos) return null;

              return sourceEntity.linkedEntityIds.map((link, idx) => {
                const tgtPos = nodePositions[link.targetId];
                if (!tgtPos) return null;

                const isConnectedToActive =
                  activeEntity?.id === sourceEntity.id || activeEntity?.id === link.targetId;
                const isHovered =
                  hoveredEntityId === sourceEntity.id || hoveredEntityId === link.targetId;

                const midX = (srcPos.x + tgtPos.x) / 2;
                const midY = (srcPos.y + tgtPos.y) / 2;

                return (
                  <g key={`${sourceEntity.id}-${link.targetId}-${idx}`}>
                    <line
                      x1={srcPos.x}
                      y1={srcPos.y}
                      x2={tgtPos.x}
                      y2={tgtPos.y}
                      stroke={isConnectedToActive ? '#f59e0b' : '#334155'}
                      strokeWidth={isConnectedToActive ? 2 : 1}
                      strokeDasharray={isConnectedToActive ? undefined : '3 3'}
                      opacity={isConnectedToActive ? 0.9 : 0.4}
                    />
                    {/* Relationship label */}
                    <text
                      x={midX}
                      y={midY - 4}
                      fill={isConnectedToActive ? '#fcd34d' : '#64748b'}
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="var(--font-mono)"
                      className="bg-slate-950 px-1 select-none"
                    >
                      {link.relation}
                    </text>
                  </g>
                );
              });
            })}

            {/* Draw Nodes */}
            {entities.map((entity) => {
              const pos = nodePositions[entity.id];
              if (!pos) return null;

              const isSelected = activeEntity?.id === entity.id;
              const isHovered = hoveredEntityId === entity.id;
              const color = getThreatColor(entity.threatLevel);

              return (
                <g
                  key={entity.id}
                  className="cursor-pointer transition-transform duration-150"
                  onClick={() => setActiveEntityId(entity.id)}
                  onMouseEnter={() => setHoveredEntityId(entity.id)}
                  onMouseLeave={() => setHoveredEntityId(null)}
                >
                  {/* Outer glow ring for selected */}
                  {isSelected && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={30}
                      fill="none"
                      stroke={color}
                      strokeWidth="1.5"
                      opacity="0.4"
                      className="animate-pulse"
                    />
                  )}

                  {/* Main Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isSelected ? 22 : 18}
                    fill="#0f172a"
                    stroke={color}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Threat score text in center */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill={color}
                    fontSize="10"
                    fontWeight="bold"
                    fontFamily="var(--font-mono)"
                  >
                    {entity.threatScore}
                  </text>

                  {/* Node label below */}
                  <text
                    x={pos.x}
                    y={pos.y + 36}
                    textAnchor="middle"
                    fill={isSelected ? '#f8fafc' : '#cbd5e1'}
                    fontSize="10"
                    fontWeight={isSelected ? 'bold' : 'normal'}
                    fontFamily="var(--font-sans)"
                  >
                    {entity.name}
                  </text>

                  <text
                    x={pos.x}
                    y={pos.y + 48}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="8"
                    fontFamily="var(--font-mono)"
                  >
                    {entity.codeName}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Right Column: Target Dossier (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-[#0a0f19] flex flex-col h-full overflow-y-auto p-5 gap-5">
          {activeEntity ? (
            <div className="flex flex-col gap-4">
              {/* Dossier Header */}
              <div className="border-b border-slate-800 pb-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-amber-400">
                    TARGET DOSSIER // {activeEntity.id}
                  </span>
                  <span
                    className="font-mono text-[11px] font-bold px-2 py-0.5 rounded border"
                    style={{
                      color: getThreatColor(activeEntity.threatLevel),
                      borderColor: getThreatColor(activeEntity.threatLevel),
                      backgroundColor: `${getThreatColor(activeEntity.threatLevel)}15`,
                    }}
                  >
                    {activeEntity.threatLevel} · 状态: {activeEntity.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 mt-1">
                  {getEntityIcon(activeEntity.type)}
                  <span>{activeEntity.name}</span>
                </h3>

                {/* Zero-pill metadata line */}
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-400">
                  <span className="text-slate-300">代号: {activeEntity.codeName}</span>
                  <span>·</span>
                  <span>类别: {activeEntity.type}</span>
                  <span>·</span>
                  <span>最后侦见: {activeEntity.lastSeen}</span>
                </div>
              </div>

              {/* Threat Score Gauge */}
              <div className="p-3.5 bg-slate-900/60 rounded border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">战略威胁危险度指标:</span>
                  <span className="font-bold text-base tabular-nums" style={{ color: getThreatColor(activeEntity.threatLevel) }}>
                    {activeEntity.threatScore} / 100
                  </span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded overflow-hidden">
                  <div
                    className="h-full transition-all duration-500 rounded"
                    style={{
                      width: `${activeEntity.threatScore}%`,
                      backgroundColor: getThreatColor(activeEntity.threatLevel),
                    }}
                  />
                </div>
              </div>

              {/* Affiliation & Coordinate Details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  组织隶属与活动区域
                </span>
                <div className="p-3 bg-slate-900/40 rounded border border-slate-800 text-xs text-slate-300 font-mono flex flex-col gap-1">
                  <p><strong>隶属关系:</strong> {activeEntity.affiliation}</p>
                  <p><strong>活动坐标:</strong> {activeEntity.coordinates.lat}°N, {activeEntity.coordinates.lng}°E</p>
                </div>
              </div>

              {/* Background Details */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  情报背景与侦控详情
                </span>
                <p className="text-xs leading-relaxed text-slate-300 bg-slate-900/30 p-3 rounded border border-slate-800/60">
                  {activeEntity.details}
                </p>
              </div>

              {/* Linked Nodes */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>拓扑关联目标 ({activeLinks.length})</span>
                  <span className="text-[11px] font-normal text-slate-500 font-mono">点击直接切换</span>
                </span>
                <div className="flex flex-col gap-1.5">
                  {activeLinks.map((link, idx) => (
                    <div
                      key={idx}
                      onClick={() => link.target && setActiveEntityId(link.target.id)}
                      className="p-2.5 bg-slate-900/50 hover:bg-slate-800 border border-slate-800/80 rounded flex items-center justify-between cursor-pointer transition-colors text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="font-semibold text-slate-200">{link.target?.name}</span>
                        <span className="text-[11px] font-mono text-slate-500">({link.target?.codeName})</span>
                      </div>
                      <span className="text-[11px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded">
                        {link.relation}
                      </span>
                    </div>
                  ))}
                  {activeLinks.length === 0 && (
                    <p className="text-xs text-slate-500">暂无直接关联节点</p>
                  )}
                </div>
              </div>

              {/* Related Classified Reports */}
              <div className="flex flex-col gap-2 border-t border-slate-800 pt-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  相关涉案绝密电报 ({relatedReports.length})
                </span>
                <div className="flex flex-col gap-2">
                  {relatedReports.map((report) => (
                    <div
                      key={report.id}
                      onClick={() => onSelectIntelReport(report)}
                      className="p-2.5 bg-slate-900/70 hover:bg-slate-800 border border-slate-800 rounded flex flex-col gap-1 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-amber-400">{report.codeName}</span>
                        <span className="text-slate-500">{report.classification}</span>
                      </div>
                      <p className="text-xs text-slate-200 font-medium line-clamp-1">{report.title}</p>
                    </div>
                  ))}
                  {relatedReports.length === 0 && (
                    <p className="text-xs text-slate-500">该实体暂未触发新的电报线索</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <Network className="w-10 h-10 text-slate-700 mb-2 stroke-[1]" />
              <p className="text-xs">选择拓扑节点查看侦控目标全景档案</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
