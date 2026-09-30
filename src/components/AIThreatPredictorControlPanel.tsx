import React, { useState, useEffect } from 'react';
import { 
  Brain, Play, Pause, RotateCcw, Clock, Sparkles, 
  Layers, ChevronDown, ChevronUp, X, AlertTriangle, 
  TrendingUp, Shield, Sliders
} from 'lucide-react';

export interface AIThreatPredictorControlPanelProps {
  projectionHours: number;
  setProjectionHours: (h: number | ((prev: number) => number)) => void;
  dispersionModel: 'HYBRID' | 'CHOKEPOINT' | 'CYBER_INFRA';
  setDispersionModel: (m: 'HYBRID' | 'CHOKEPOINT' | 'CYBER_INFRA') => void;
  heatmapOpacity: number;
  setHeatmapOpacity: (o: number) => void;
  bandwidth: number;
  setBandwidth: (b: number) => void;
  onClose: () => void;
}

export const AIThreatPredictorControlPanel: React.FC<AIThreatPredictorControlPanelProps> = ({
  projectionHours,
  setProjectionHours,
  dispersionModel,
  setDispersionModel,
  heatmapOpacity,
  setHeatmapOpacity,
  bandwidth,
  setBandwidth,
  onClose,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Auto-play time progression loop
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProjectionHours((prev) => (prev >= 24 ? 0 : prev + 3));
    }, 1200);
    return () => clearInterval(interval);
  }, [isPlaying, setProjectionHours]);

  if (isMinimized) {
    return (
      <div className="absolute top-12 left-4 z-20 flex items-center gap-2 bg-[#090e1c]/90 border border-amber-500/50 rounded-lg px-3 py-1.5 backdrop-blur-md shadow-2xl text-xs font-mono">
        <Brain className="w-4 h-4 text-amber-400 animate-pulse" />
        <span className="text-slate-100 font-bold">AI 24H 威胁预测:</span>
        <span className="text-rose-400 font-bold">T+{projectionHours}h 演化</span>
        <button
          onClick={() => setIsMinimized(false)}
          className="ml-2 text-amber-400 hover:text-amber-300 p-0.5 hover:bg-slate-800 rounded cursor-pointer"
          title="展开预测控制面板"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-12 left-3 sm:left-4 z-20 w-80 sm:w-96 bg-[#090e1c]/95 border border-amber-500/60 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono text-slate-100 p-3 sm:p-4 flex flex-col gap-3 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-amber-400/20 border border-amber-400/40 text-amber-400">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-100 font-sans text-xs sm:text-sm">
                AI 未来24小时威胁趋势预测
              </span>
              <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold">
                D3 HEATMAP
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              基于已录入多源情报经纬度与战区通道的核密度外溢估算
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
            title="最小化"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
            title="关闭预测图层"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Projection Time Slider & Playback */}
      <div className="flex flex-col gap-2 p-2.5 rounded bg-slate-950/70 border border-slate-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 font-semibold">
            <Clock className="w-3.5 h-3.5" />
            <span>预测演化时序: T+{projectionHours} 小时</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-2 py-0.5 rounded text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                isPlaying
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'bg-amber-400 text-slate-950 hover:bg-amber-300'
              }`}
            >
              {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
              <span>{isPlaying ? '暂停' : '演化推演'}</span>
            </button>
            <button
              onClick={() => {
                setIsPlaying(false);
                setProjectionHours(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded cursor-pointer"
              title="重置为当前T+0h基线"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Range slider */}
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={projectionHours}
          onChange={(e) => {
            setIsPlaying(false);
            setProjectionHours(Number(e.target.value));
          }}
          className="w-full accent-amber-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
        />

        {/* Milestone Steps */}
        <div className="grid grid-cols-5 gap-1 text-[10px] text-center pt-0.5">
          {[
            { label: 'T+0h', val: 0 },
            { label: 'T+6h', val: 6 },
            { label: 'T+12h', val: 12 },
            { label: 'T+18h', val: 18 },
            { label: 'T+24h', val: 24 },
          ].map((step) => (
            <button
              key={step.val}
              onClick={() => {
                setIsPlaying(false);
                setProjectionHours(step.val);
              }}
              className={`py-0.5 rounded transition-colors cursor-pointer ${
                projectionHours === step.val
                  ? 'bg-amber-400/20 text-amber-300 font-bold border border-amber-400/40'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {step.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dispersion Model Switcher */}
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400">AI扩散算法模型:</span>
        <div className="grid grid-cols-3 gap-1 text-[10px]">
          {[
            { id: 'HYBRID', label: '全域复合扩散' },
            { id: 'CHOKEPOINT', label: '海上咽喉断绝' },
            { id: 'CYBER_INFRA', label: '工控网络外溢' },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setDispersionModel(m.id as any)}
              className={`p-1.5 rounded border text-center transition-all cursor-pointer ${
                dispersionModel === m.id
                  ? 'bg-slate-900 border-amber-400 text-amber-300 font-bold shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap Layer Sliders */}
      <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/40 p-2 rounded border border-slate-800/80">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-400">
            <span>热力图透明度</span>
            <span>{Math.round(heatmapOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.2"
            max="1"
            step="0.05"
            value={heatmapOpacity}
            onChange={(e) => setHeatmapOpacity(Number(e.target.value))}
            className="accent-amber-400 cursor-pointer h-1 bg-slate-800 rounded appearance-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-slate-400">
            <span>D3高斯核带宽</span>
            <span>{bandwidth}px</span>
          </div>
          <input
            type="range"
            min="15"
            max="45"
            step="1"
            value={bandwidth}
            onChange={(e) => setBandwidth(Number(e.target.value))}
            className="accent-sky-400 cursor-pointer h-1 bg-slate-800 rounded appearance-none"
          />
        </div>
      </div>

      {/* Mini Intelligence Telemetry */}
      <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-800/80 pt-2">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
          <span>最高外溢战区: 霍尔木兹中枢 (96%)</span>
        </div>
        <span className="text-amber-400 font-bold">置信度 93.8%</span>
      </div>
    </div>
  );
};
