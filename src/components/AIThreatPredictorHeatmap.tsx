import React, { useMemo, useState, useEffect } from 'react';
import * as d3 from 'd3';
import { IntelReport, ThreatLevel } from '../types/intelligence';
import { 
  Sparkles, Brain, AlertTriangle, Shield, TrendingUp, 
  Clock, Play, Pause, RotateCcw, Crosshair, ArrowRight,
  ChevronRight, Compass, Radio, Layers, Info
} from 'lucide-react';

export interface PredictedHotspot {
  id: string;
  name: string;
  lat: number;
  lng: number;
  baseReportId?: string;
  currentThreatLevel: ThreatLevel;
  predictedProbability: number; // 0 - 100%
  probabilityDelta: number; // +X%
  peakHour: number; // e.g. 14 -> T+14h
  primaryThreatType: string;
  projectedTrajectory: string;
  recommendedCountermeasure: string;
  affectedAssets: string[];
}

export interface AIThreatPredictorHeatmapProps {
  reports: IntelReport[];
  project: (lat: number, lng: number) => { x: number; y: number };
  mapWidth: number;
  mapHeight: number;
  projectionHours: number; // 0 to 24
  dispersionModel: 'HYBRID' | 'CHOKEPOINT' | 'CYBER_INFRA';
  bandwidth?: number;
  opacity?: number;
  onSelectHotspot?: (hotspot: PredictedHotspot) => void;
  selectedHotspotId?: string | null;
}

interface SamplePoint {
  x: number;
  y: number;
  weight: number;
}

export const AIThreatPredictorHeatmap: React.FC<AIThreatPredictorHeatmapProps> = ({
  reports,
  project,
  mapWidth,
  mapHeight,
  projectionHours,
  dispersionModel,
  bandwidth = 28,
  opacity = 0.85,
  onSelectHotspot,
  selectedHotspotId,
}) => {
  const [hoveredHotspot, setHoveredHotspot] = useState<PredictedHotspot | null>(null);

  // Generate predicted geographic hotspots with 24h expansion logic based on actual reports
  const predictedHotspots: PredictedHotspot[] = useMemo(() => {
    const list: PredictedHotspot[] = [];

    reports.forEach((rep, idx) => {
      const lat = rep.coordinates.lat;
      const lng = rep.coordinates.lng;
      const name = rep.locationName.split('(')[0].trim();

      // Expansion vector based on region & model
      let probBase = rep.threatLevel === 'CRITICAL' ? 82 : rep.threatLevel === 'HIGH' ? 70 : 54;
      const growthFactor = (projectionHours / 24) * 16;
      const predictedProb = Math.min(98, Math.round(probBase + growthFactor));

      let trajectory = '本地多频次被动侦听聚集';
      let peakHour = 6 + (idx * 3) % 18;
      let countermeasure = rep.priorityAction || '保持被动声呐网全频段监视';

      if (name.includes('霍尔木兹') || (lat > 20 && lat < 30 && lng > 50 && lng < 60)) {
        trajectory = '沿阿曼湾向阿拉伯海深水区呈漏斗形外溢扩散';
        peakHour = 14;
        countermeasure = '调动驻阿曼多用途海上巡逻机(P-8A)实施连续磁异与声呐浮标截击';
      } else if (name.includes('法兰克福') || (lat > 48 && lat < 55 && lng > 5 && lng < 15)) {
        trajectory = '沿欧亚输电同步网互联节点向波兰及波罗的海电网穿透';
        peakHour = 18;
        countermeasure = '在跨国变电站边缘交换机启用旁路流量异常相位阻断协议';
      } else if (name.includes('斯瓦尔巴') || lat > 70) {
        trajectory = '顺巴伦支海深槽向GIUK水道深海战略走廊渗透';
        peakHour = 10;
        countermeasure = '派遣声学调查船重访水听器阵列，校验核潜艇冰下航行静音声纹';
      } else if (name.includes('马六甲') || (lat > -5 && lat < 10 && lng > 95 && lng < 110)) {
        trajectory = '向南海西部深水航道及苏门答腊东岸漂移扩散';
        peakHour = 8;
        countermeasure = '向国际海事组织发布GPS伪造坐标抗差校正与惯导对齐通报';
      } else if (name.includes('太平洋') || (lng > 115 && lng < 150)) {
        trajectory = '由第一岛链海峡扇面指向关岛与马里亚纳海沟反潜扇区';
        peakHour = 20;
        countermeasure = '前推反潜直升机机群，对高超滑翔下行遥测链路实施电子压制';
      }

      list.push({
        id: `PRED-${rep.id}`,
        name: `【24H预警】${name}`,
        lat,
        lng,
        baseReportId: rep.id,
        currentThreatLevel: rep.threatLevel,
        predictedProbability: predictedProb,
        probabilityDelta: Math.round(growthFactor),
        peakHour,
        primaryThreatType: rep.category,
        projectedTrajectory: trajectory,
        recommendedCountermeasure: countermeasure,
        affectedAssets: rep.entities.slice(0, 3),
      });
    });

    return list;
  }, [reports, projectionHours, dispersionModel]);

  // Compute D3 Contour Density Heatmap paths
  const contourPaths = useMemo(() => {
    // 1. Generate weighted point cloud for D3 contour density
    const points: SamplePoint[] = [];

    reports.forEach((rep) => {
      const pt = project(rep.coordinates.lat, rep.coordinates.lng);
      const baseWeight = rep.threatLevel === 'CRITICAL' ? 1.4 : rep.threatLevel === 'HIGH' ? 0.9 : 0.5;

      // Primary source center
      points.push({ x: pt.x, y: pt.y, weight: baseWeight });

      // Simulate 24-hour predictive diffusion particles around the center
      const particleCount = Math.floor(4 + (projectionHours / 24) * 10);
      const spreadRadius = (12 + (projectionHours / 24) * 28) * (dispersionModel === 'CHOKEPOINT' ? 0.8 : 1.2);

      // Model bias angles
      let driftAngle = 0;
      if (dispersionModel === 'CHOKEPOINT') driftAngle = Math.PI / 4;
      if (dispersionModel === 'CYBER_INFRA') driftAngle = -Math.PI / 3;

      for (let i = 0; i < particleCount; i++) {
        const angle = (i / particleCount) * 2 * Math.PI + driftAngle;
        const dist = (Math.random() * 0.7 + 0.3) * spreadRadius;
        const px = pt.x + Math.cos(angle) * dist;
        const py = pt.y + Math.sin(angle) * dist;

        if (px >= 0 && px <= mapWidth && py >= 0 && py <= mapHeight) {
          const decay = 1 - (dist / (spreadRadius * 1.2));
          points.push({
            x: px,
            y: py,
            weight: baseWeight * Math.max(0.2, decay) * (1 + (projectionHours / 24) * 0.5),
          });
        }
      }
    });

    if (points.length === 0) return [];

    try {
      // 2. Configure D3 contour density
      const density = d3.contourDensity<SamplePoint>()
        .x((d) => d.x)
        .y((d) => d.y)
        .weight((d) => d.weight)
        .size([mapWidth, mapHeight])
        .bandwidth(bandwidth)
        .thresholds(9);

      const contours = density(points);
      const geoPath = d3.geoPath();

      // 3. Color scale from high-tech tactical cyan -> amber -> glowing crimson
      const maxVal = contours.length > 0 ? contours[contours.length - 1].value : 1;
      const minVal = contours.length > 0 ? contours[0].value : 0;

      const colorScale = d3.scaleLinear<string>()
        .domain([minVal, minVal + (maxVal - minVal) * 0.25, minVal + (maxVal - minVal) * 0.55, maxVal])
        .range([
          'rgba(56, 189, 248, 0.12)',   // Sky blue low density
          'rgba(251, 191, 36, 0.28)',   // Amber medium density
          'rgba(249, 115, 22, 0.45)',   // Orange high density
          'rgba(244, 63, 94, 0.72)',    // Rose/Crimson critical density
        ]);

      return contours.map((contour, i) => ({
        pathData: geoPath(contour) || '',
        value: contour.value,
        fillColor: colorScale(contour.value),
        strokeColor: d3.color(colorScale(contour.value))?.darker(0.3)?.toString() || '#f43f5e',
        index: i,
      }));
    } catch (e) {
      console.error('D3 Contour generation error:', e);
      return [];
    }
  }, [reports, project, mapWidth, mapHeight, projectionHours, dispersionModel, bandwidth]);

  // Projected trajectory drift arrows
  const trajectoryVectors = useMemo(() => {
    return predictedHotspots.map((hotspot) => {
      const start = project(hotspot.lat, hotspot.lng);
      // Determine drift vector direction based on coordinates
      let dx = 25;
      let dy = -15;
      if (hotspot.lat > 50) { dx = 20; dy = 20; }
      else if (hotspot.lng > 100) { dx = -20; dy = 25; }
      else if (hotspot.lat < 20) { dx = 30; dy = 10; }

      const lengthFactor = (projectionHours / 24);
      const end = {
        x: start.x + dx * (0.6 + lengthFactor),
        y: start.y + dy * (0.6 + lengthFactor),
      };

      return {
        id: hotspot.id,
        hotspot,
        start,
        end,
      };
    });
  }, [predictedHotspots, project, projectionHours]);

  return (
    <g className="ai-threat-prediction-heatmap-layer select-none" style={{ opacity }}>
      <defs>
        {/* Glowing blur filter for tactical heat diffusion */}
        <filter id="aiHeatGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Pulse animation for predicted peak points */}
        <radialGradient id="aiCriticalHotspotGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#f97316" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Layer 1: D3 Contour Density Heatmap isobars */}
      <g className="d3-contour-isobars" filter="url(#aiHeatGlow)">
        {contourPaths.map((c, i) => (
          <path
            key={`contour-${i}`}
            d={c.pathData}
            fill={c.fillColor}
            stroke={c.strokeColor}
            strokeWidth="0.8"
            strokeDasharray={i % 2 === 1 ? '3 2' : 'none'}
            className="transition-all duration-300"
          />
        ))}
      </g>

      {/* Layer 2: Predicted Vector Drift Arcs & Trajectories */}
      <g className="ai-trajectory-vectors pointer-events-none">
        {trajectoryVectors.map((v) => (
          <g key={`vec-${v.id}`} className="transition-all duration-300">
            {/* Dashed trajectory line */}
            <line
              x1={v.start.x}
              y1={v.start.y}
              x2={v.end.x}
              y2={v.end.y}
              stroke="#fbbf24"
              strokeWidth="1.2"
              strokeDasharray="4 3"
              opacity="0.75"
            />
            {/* Arrowhead marker circle */}
            <circle
              cx={v.end.x}
              cy={v.end.y}
              r="2.5"
              fill="#f43f5e"
              stroke="#fff"
              strokeWidth="0.8"
            />
            {/* Predicted trajectory note tag */}
            {projectionHours >= 12 && (
              <text
                x={v.end.x + 4}
                y={v.end.y + 3}
                fill="#fde047"
                fontSize="7.5"
                fontFamily="var(--font-mono)"
                opacity="0.85"
                className="bg-black/80 px-1"
              >
                T+{v.hotspot.peakHour}h外溢
              </text>
            )}
          </g>
        ))}
      </g>

      {/* Layer 3: Predicted High-Risk Focal Nodes */}
      <g className="ai-hotspot-nodes">
        {predictedHotspots.map((hotspot) => {
          const pt = project(hotspot.lat, hotspot.lng);
          const isSelected = selectedHotspotId === hotspot.id;
          const isHovered = hoveredHotspot?.id === hotspot.id;
          const radius = (12 + (projectionHours / 24) * 8);

          return (
            <g
              key={hotspot.id}
              className="cursor-pointer"
              onMouseEnter={() => setHoveredHotspot(hotspot)}
              onMouseLeave={() => setHoveredHotspot(null)}
              onClick={() => onSelectHotspot?.(hotspot)}
            >
              {/* Outer Pulsing Threat Ring */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={radius}
                fill="url(#aiCriticalHotspotGradient)"
                opacity={isSelected ? 0.9 : 0.65}
                className="animate-pulse"
              />

              {/* Concentric warning isobar */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r={radius + 4}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="0.8"
                strokeDasharray="2 2"
                opacity="0.7"
              />

              {/* Holographic Crosshair Reticle */}
              <line x1={pt.x - 7} y1={pt.y} x2={pt.x + 7} y2={pt.y} stroke="#fef08a" strokeWidth="1" />
              <line x1={pt.x} y1={pt.y - 7} x2={pt.x} y2={pt.y + 7} stroke="#fef08a" strokeWidth="1" />

              {/* Center Target Core */}
              <circle
                cx={pt.x}
                cy={pt.y}
                r="3"
                fill="#f43f5e"
                stroke="#fef08a"
                strokeWidth="1.2"
              />

              {/* Tag Label */}
              <g transform={`translate(${pt.x}, ${pt.y - radius - 6})`}>
                <rect
                  x="-32"
                  y="-12"
                  width="64"
                  height="12"
                  rx="2"
                  fill="#090d16"
                  stroke={hotspot.predictedProbability > 85 ? '#f43f5e' : '#fbbf24'}
                  strokeWidth="0.8"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="-3"
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="7.5"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                >
                  AI风险: {hotspot.predictedProbability}%
                </text>
              </g>
            </g>
          );
        })}
      </g>

      {/* Layer 4: Interactive Hotspot Inspector Card (when hovered or focused) */}
      {hoveredHotspot && (
        <foreignObject
          x={Math.min(mapWidth - 240, Math.max(10, project(hoveredHotspot.lat, hoveredHotspot.lng).x - 110))}
          y={Math.max(10, project(hoveredHotspot.lat, hoveredHotspot.lng).y + 24)}
          width="230"
          height="160"
          className="pointer-events-none z-50 overflow-visible"
        >
          <div className="bg-[#090e1c]/95 border border-amber-500/80 rounded-lg p-2.5 shadow-2xl backdrop-blur-md text-[10px] font-mono text-slate-100 flex flex-col gap-1.5 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-amber-400 truncate max-w-[140px]">
                {hoveredHotspot.name}
              </span>
              <span className="bg-rose-950 text-rose-300 border border-rose-800 px-1 py-0.2 rounded font-bold">
                T+{hoveredHotspot.peakHour}h峰值
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400">未来24H威胁概率:</span>
              <span className="text-rose-400 font-bold text-xs">
                {hoveredHotspot.predictedProbability}% (+{hoveredHotspot.probabilityDelta}%)
              </span>
            </div>

            <div className="text-slate-300 line-clamp-2">
              <span className="text-slate-500">外溢推演: </span>
              {hoveredHotspot.projectedTrajectory}
            </div>

            <div className="text-amber-200/90 line-clamp-2 bg-amber-500/10 p-1 rounded border border-amber-500/20">
              <span className="text-amber-400 font-bold">反制预案: </span>
              {hoveredHotspot.recommendedCountermeasure}
            </div>
          </div>
        </foreignObject>
      )}
    </g>
  );
};
