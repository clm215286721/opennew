import React, { useState, useEffect, useMemo } from 'react';
import { ThreatLevel } from '../types/intelligence';

export interface ThreatRegion {
  id: string;
  name: string;
  codeName: string;
  lat: number;
  lng: number;
  threatLevel: ThreatLevel;
  baseScore: number; // 0 - 100
  radiusKm: number;
  tensionCorridors?: string[]; // IDs of other linked regions
  description: string;
  activeIncidents: number;
}

export const STRATEGIC_THREAT_REGIONS: ThreatRegion[] = [
  {
    id: 'REGION-ME',
    name: '波斯湾与霍尔木兹中枢',
    codeName: 'THEATER-GULF',
    lat: 26.56,
    lng: 56.25,
    threatLevel: 'CRITICAL',
    baseScore: 94,
    radiusKm: 38,
    tensionCorridors: ['REGION-REDSEA', 'REGION-MED'],
    description: '海底光缆电磁截获升级 · 深潜特战悬停 · 关键水道防空戒备',
    activeIncidents: 6,
  },
  {
    id: 'REGION-REDSEA',
    name: '红海与曼德海峡咽喉',
    codeName: 'THEATER-BAB-MANDEB',
    lat: 13.20,
    lng: 43.10,
    threatLevel: 'CRITICAL',
    baseScore: 91,
    radiusKm: 34,
    tensionCorridors: ['REGION-ME', 'REGION-MED'],
    description: '巡飞弹掠海轨迹频发 · 亚丁湾护航截击 · 商船规避率68%',
    activeIncidents: 5,
  },
  {
    id: 'REGION-WPAC',
    name: '台海与西太第一岛链',
    codeName: 'THEATER-FIRST-ISLAND',
    lat: 24.30,
    lng: 121.20,
    threatLevel: 'HIGH',
    baseScore: 88,
    radiusKm: 42,
    tensionCorridors: ['REGION-KOREA', 'REGION-MALACCA'],
    description: '海空密集联合巡逻 · 反潜声呐浮标阵列 · 超视距空情雷达锁链',
    activeIncidents: 7,
  },
  {
    id: 'REGION-EEU',
    name: '东欧与波罗的海走廊',
    codeName: 'THEATER-BALTIC-EEU',
    lat: 55.40,
    lng: 24.80,
    threatLevel: 'HIGH',
    baseScore: 85,
    radiusKm: 36,
    tensionCorridors: ['REGION-ARCTIC'],
    description: '电网SCADA协议漏洞渗透 · 海底复线震动警戒 · 电子对抗压制',
    activeIncidents: 4,
  },
  {
    id: 'REGION-KOREA',
    name: '朝鲜半岛与黄海海空区',
    codeName: 'THEATER-YELLOW-SEA',
    lat: 38.00,
    lng: 126.80,
    threatLevel: 'HIGH',
    baseScore: 83,
    radiusKm: 32,
    tensionCorridors: ['REGION-WPAC'],
    description: '弹道防御系统战备值班 · 高空侦察机巡逻 · 频繁无线电管制',
    activeIncidents: 3,
  },
  {
    id: 'REGION-ARCTIC',
    name: '北极斯瓦尔巴深海走廊',
    codeName: 'THEATER-SVALBARD-ARCTIC',
    lat: 76.50,
    lng: 18.00,
    threatLevel: 'ELEVATED',
    baseScore: 72,
    radiusKm: 35,
    tensionCorridors: ['REGION-GIUK', 'REGION-EEU'],
    description: '12枚深海自持水听潜标组网 · 战略核潜艇冰下通道声场监测',
    activeIncidents: 3,
  },
  {
    id: 'REGION-MALACCA',
    name: '马六甲海峡与南海枢纽',
    codeName: 'THEATER-MALACCA-SCS',
    lat: 3.50,
    lng: 103.50,
    threatLevel: 'GUARDED',
    baseScore: 65,
    radiusKm: 36,
    tensionCorridors: ['REGION-WPAC'],
    description: 'GPS伪距欺骗高频发生 · 沿岸机动侦测 · AIS虚拟航标泛滥',
    activeIncidents: 3,
  },
  {
    id: 'REGION-MED',
    name: '地中海至苏伊士通道',
    codeName: 'THEATER-LEVANT-SUEZ',
    lat: 32.50,
    lng: 32.00,
    threatLevel: 'ELEVATED',
    baseScore: 70,
    radiusKm: 30,
    tensionCorridors: ['REGION-ME', 'REGION-REDSEA'],
    description: '大苦湖引航防爆二级预案 · 水面水下双重声呐排查',
    activeIncidents: 2,
  },
  {
    id: 'REGION-GIUK',
    name: '北大西洋水下声学防线 (GIUK)',
    codeName: 'THEATER-NORTH-ATLANTIC',
    lat: 61.50,
    lng: -20.00,
    threatLevel: 'GUARDED',
    baseScore: 61,
    radiusKm: 38,
    tensionCorridors: ['REGION-ARCTIC'],
    description: '固定被动水听阵列监听 · 静音常规动力潜艇水声指纹库甄别',
    activeIncidents: 2,
  }
];

interface GlobalThreatPulseProps {
  project: (lat: number, lng: number) => { x: number; y: number };
  mapWidth: number;
  mapHeight: number;
  onSelectRegion?: (region: ThreatRegion) => void;
  activeRegionId?: string | null;
  showTensionLines?: boolean;
  showHeatRings?: boolean;
}

export const GlobalThreatPulse: React.FC<GlobalThreatPulseProps> = ({
  project,
  mapWidth,
  mapHeight,
  onSelectRegion,
  activeRegionId,
  showTensionLines = true,
  showHeatRings = true,
}) => {
  // Live fluctuating pulse score simulation for realistic telemetry heartbeat
  const [pulsePhase, setPulsePhase] = useState<number>(0);
  const [regionFluctuations, setRegionFluctuations] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase((p) => (p + 1) % 360);

      // Micro-fluctuations in threat metrics
      const newFluctuations: Record<string, number> = {};
      STRATEGIC_THREAT_REGIONS.forEach((r) => {
        // Subtle organic sine drift ±2.5
        const drift = Math.sin((Date.now() / 1500) + r.lat) * 2.5;
        newFluctuations[r.id] = drift;
      });
      setRegionFluctuations(newFluctuations);
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const getThreatColor = (level: ThreatLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          main: '#f43f5e', // rose-500
          glow: 'rgba(244, 63, 94, 0.45)',
          fill: 'rgba(244, 63, 94, 0.08)',
          pulseDuration: '2.5s',
        };
      case 'HIGH':
        return {
          main: '#fb923c', // orange-400
          glow: 'rgba(251, 146, 60, 0.4)',
          fill: 'rgba(251, 146, 60, 0.06)',
          pulseDuration: '3.2s',
        };
      case 'ELEVATED':
        return {
          main: '#38bdf8', // sky-400
          glow: 'rgba(56, 189, 248, 0.35)',
          fill: 'rgba(56, 189, 248, 0.05)',
          pulseDuration: '4s',
        };
      case 'GUARDED':
      case 'LOW':
      default:
        return {
          main: '#34d399', // emerald-400
          glow: 'rgba(52, 211, 153, 0.3)',
          fill: 'rgba(52, 211, 153, 0.04)',
          pulseDuration: '5s',
        };
    }
  };

  // Build unique tension corridors between regions
  const tensionCorridorPaths = useMemo(() => {
    const corridors: {
      id: string;
      source: ThreatRegion;
      target: ThreatRegion;
      threatLevel: ThreatLevel;
    }[] = [];

    const regionMap = new Map(STRATEGIC_THREAT_REGIONS.map((r) => [r.id, r]));
    const seen = new Set<string>();

    STRATEGIC_THREAT_REGIONS.forEach((source) => {
      source.tensionCorridors?.forEach((targetId) => {
        const target = regionMap.get(targetId);
        if (!target) return;
        const key = [source.id, target.id].sort().join('--');
        if (!seen.has(key)) {
          seen.add(key);
          // Higher threat dictates corridor color
          const threatLevel: ThreatLevel = 
            source.threatLevel === 'CRITICAL' || target.threatLevel === 'CRITICAL'
              ? 'CRITICAL'
              : source.threatLevel === 'HIGH' || target.threatLevel === 'HIGH'
              ? 'HIGH'
              : 'ELEVATED';

          corridors.push({
            id: key,
            source,
            target,
            threatLevel,
          });
        }
      });
    });

    return corridors;
  }, []);

  return (
    <g className="global-threat-pulse select-none">
      <defs>
        {/* Glow Filters */}
        <filter id="threatGlowCritical" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur2" />
          <feMerge>
            <feMergeNode in="blur1" />
            <feMergeNode in="blur2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="threatGlowStandard" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Dynamic pulse gradients */}
        {STRATEGIC_THREAT_REGIONS.map((region) => {
          const colors = getThreatColor(region.threatLevel);
          return (
            <radialGradient
              key={`grad-${region.id}`}
              id={`grad-${region.id}`}
              cx="50%"
              cy="50%"
              r="50%"
            >
              <stop offset="0%" stopColor={colors.main} stopOpacity="0.5" />
              <stop offset="45%" stopColor={colors.main} stopOpacity="0.15" />
              <stop offset="85%" stopColor={colors.main} stopOpacity="0.04" />
              <stop offset="100%" stopColor={colors.main} stopOpacity="0" />
            </radialGradient>
          );
        })}
      </defs>

      {/* 1. Global Geopolitical Tension Corridors (Data Flow Arcs) */}
      {showTensionLines && (
        <g className="tension-corridors opacity-70">
          {tensionCorridorPaths.map((corridor) => {
            const p1 = project(corridor.source.lat, corridor.source.lng);
            const p2 = project(corridor.target.lat, corridor.target.lng);

            // Compute curved tension arc
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Perpendicular bend
            const midX = (p1.x + p2.x) / 2;
            const midY = (p1.y + p2.y) / 2 - Math.min(dist * 0.15, 30);

            const pathD = `M ${p1.x},${p1.y} Q ${midX},${midY} ${p2.x},${p2.y}`;
            const colors = getThreatColor(corridor.threatLevel);

            return (
              <g key={`corridor-${corridor.id}`}>
                {/* Background base path */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.main}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                  opacity="0.3"
                />

                {/* Animated pulse data packets traveling along the tension vector */}
                <path
                  d={pathD}
                  fill="none"
                  stroke={colors.main}
                  strokeWidth="2"
                  strokeDasharray="6 24"
                  strokeLinecap="round"
                  opacity="0.75"
                  className="transition-all"
                  style={{
                    animation: `corridorFlow ${colors.pulseDuration} linear infinite`,
                  }}
                />
              </g>
            );
          })}
        </g>
      )}

      {/* 2. Regional Threat Heat Halos & Concentric Wave Rings */}
      {STRATEGIC_THREAT_REGIONS.map((region) => {
        const pt = project(region.lat, region.lng);
        const colors = getThreatColor(region.threatLevel);
        const isActive = activeRegionId === region.id;
        const currentScore = Math.min(
          100,
          Math.max(0, region.baseScore + (regionFluctuations[region.id] || 0))
        );

        return (
          <g
            key={`threat-region-${region.id}`}
            className="cursor-pointer group"
            onClick={() => onSelectRegion?.(region)}
          >
            {/* Heat Gradient Halo */}
            {showHeatRings && (
              <>
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={region.radiusKm * (isActive ? 1.3 : 1)}
                  fill={`url(#grad-${region.id})`}
                  className="transition-all duration-300"
                />

                {/* Concentric Expanding Shockwave 1 */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={region.radiusKm * 0.8}
                  fill="none"
                  stroke={colors.main}
                  strokeWidth="0.8"
                  opacity="0.5"
                  className="animate-ping"
                  style={{
                    animationDuration: colors.pulseDuration,
                    animationTimingFunction: 'cubic-bezier(0, 0.2, 0.8, 1)',
                  }}
                />

                {/* Concentric Secondary Ring */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={region.radiusKm * 0.45}
                  fill="none"
                  stroke={colors.main}
                  strokeWidth="1"
                  strokeDasharray="4 2"
                  opacity="0.6"
                />
              </>
            )}

            {/* Tactical Radar Defense Ring with Ticks */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isActive ? 14 : 9}
              fill="#060b14"
              stroke={colors.main}
              strokeWidth={isActive ? 2 : 1.2}
              opacity="0.85"
            />

            {/* Glowing Center Core */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={isActive ? 5 : 3.5}
              fill={colors.main}
              filter={region.threatLevel === 'CRITICAL' ? 'url(#threatGlowCritical)' : 'url(#threatGlowStandard)'}
            />

            {/* Mini HUD telemetry label under node */}
            <g className="pointer-events-none transition-opacity duration-200">
              {/* Threat Index Badge */}
              <rect
                x={pt.x - 30}
                y={pt.y + 11}
                width="60"
                height="13"
                rx="2"
                fill="#070c18"
                stroke={colors.main}
                strokeWidth="0.8"
                opacity="0.85"
              />
              <text
                x={pt.x}
                y={pt.y + 20}
                textAnchor="middle"
                fill={colors.main}
                fontSize="7.5"
                fontWeight="bold"
                fontFamily="var(--font-mono)"
              >
                {region.codeName} {currentScore.toFixed(0)}%
              </text>
            </g>
          </g>
        );
      })}
    </g>
  );
};
