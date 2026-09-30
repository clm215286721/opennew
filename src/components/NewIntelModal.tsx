import React, { useState } from 'react';
import { IntelReport, ClassificationLevel, IntelCategory, ThreatLevel } from '../types/intelligence';
import { X, Sparkles, RefreshCw, Plus, Check } from 'lucide-react';

interface NewIntelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddReport: (report: IntelReport) => void;
}

export const NewIntelModal: React.FC<NewIntelModalProps> = ({
  isOpen,
  onClose,
  onAddReport,
}) => {
  const [title, setTitle] = useState('');
  const [codeName, setCodeName] = useState('OPERATION ECHO');
  const [category, setCategory] = useState<IntelCategory>('SIGINT');
  const [classification, setClassification] = useState<ClassificationLevel>('SECRET');
  const [threatLevel, setThreatLevel] = useState<ThreatLevel>('HIGH');
  const [sourceReliability, setSourceReliability] = useState('B2');
  const [locationName, setLocationName] = useState('西太平洋关键航道海域');
  const [lat, setLat] = useState('22.45');
  const [lng, setLng] = useState('124.50');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [keyFindingsStr, setKeyFindingsStr] = useState('无线电静默期突然出现定向超高频数据发射\n周边出现未知特种监测水面浮标');
  const [entitiesStr, setEntitiesStr] = useState('特种浮标阵列, 某未知科考船');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  if (!isOpen) return null;

  const handleAiAutoFill = async () => {
    if (!content.trim()) {
      alert('请先输入截获内容或线索描述');
      return;
    }
    setIsAiProcessing(true);
    try {
      const res = await fetch('/api/intelligence/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || '现场截获防务线索',
          content,
          classification,
          source: category,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) setSummary(data.summary);
        if (data.threatLevel) setThreatLevel(data.threatLevel);
        if (data.reliabilityRating) setSourceReliability(data.reliabilityRating);
        if (data.keyJudgments?.length) setKeyFindingsStr(data.keyJudgments.join('\n'));
        if (data.extractedEntities?.length) {
          setEntitiesStr(data.extractedEntities.map((e: any) => e.name).join(', '));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newReport: IntelReport = {
      id: `INTEL-${Date.now().toString().slice(-4)}`,
      codeName: codeName.toUpperCase(),
      title,
      classification,
      category,
      threatLevel,
      sourceReliability,
      timestamp: '刚刚 (2026-09-30 UTC)',
      locationName,
      coordinates: {
        lat: parseFloat(lat) || 0,
        lng: parseFloat(lng) || 0,
      },
      summary: summary || title,
      content,
      keyFindings: keyFindingsStr.split('\n').filter((f) => f.trim().length > 0),
      entities: entitiesStr.split(',').map((e) => e.trim()).filter(Boolean),
      status: 'INVESTIGATING',
      tags: [category, threatLevel, '人工录入'],
    };

    onAddReport(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c121d] border border-slate-700 rounded-lg max-w-2xl w-full p-5 max-h-[90vh] overflow-y-auto flex flex-col gap-4 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-slate-100 uppercase tracking-wider">
              录入新的涉密防务情报线索 (INGEST INTEL DISPATCH)
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 cursor-pointer font-bold text-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">电报代号 (CODENAME)</label>
              <input
                type="text"
                value={codeName}
                onChange={(e) => setCodeName(e.target.value)}
                required
                className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">密级 (CLASSIFICATION)</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="TOP_SECRET">绝密 (TOP SECRET)</option>
                <option value="SECRET">机密 (SECRET)</option>
                <option value="CONFIDENTIAL">秘密 (CONFIDENTIAL)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-slate-400">情报事件标题</label>
            <input
              type="text"
              placeholder="例如：直布罗陀海峡附近水域捕获可疑军用跳频通信信号"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">情报源类</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="SIGINT">SIGINT 信号</option>
                <option value="CYBER">CYBER 网络</option>
                <option value="GEOINT">GEOINT 空间</option>
                <option value="HUMINT">HUMINT 人力</option>
                <option value="OSINT">OSINT 开源</option>
                <option value="MASINT">MASINT 特征</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">威胁预估</label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200"
              >
                <option value="CRITICAL">CRITICAL 严重</option>
                <option value="HIGH">HIGH 高危</option>
                <option value="ELEVATED">ELEVATED 关注</option>
                <option value="GUARDED">GUARDED 警戒</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">纬度 (Lat)</label>
              <input
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200 font-mono"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">经度 (Lng)</label>
              <input
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-slate-200 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-mono text-slate-400">原始截获内容或外勤报告</label>
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAiProcessing}
                className="text-[11px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>AI 研判解析中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>AI 智能抽取关键结论与实体</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              rows={4}
              value={content}
              placeholder="输入拦截电文、雷达波段测量数据或外勤特工呈递摘要..."
              onChange={(e) => setContent(e.target.value)}
              required
              className="bg-slate-950 border border-slate-800 rounded p-2.5 text-slate-200 font-mono focus:outline-none focus:border-amber-500/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="font-mono text-slate-400">研判摘要 (BLUF)</label>
            <input
              type="text"
              placeholder="一句话核心研判要点"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded px-3 py-1.5 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">关键证据要点 (每行一条)</label>
              <textarea
                rows={2}
                value={keyFindingsStr}
                onChange={(e) => setKeyFindingsStr(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-[11px]"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="font-mono text-slate-400">关联实体 (逗号分隔)</label>
              <textarea
                rows={2}
                value={entitiesStr}
                onChange={(e) => setEntitiesStr(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded p-2 text-slate-200 font-mono text-[11px]"
              />
            </div>
          </div>

          <div className="border-t border-slate-800 pt-3 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded cursor-pointer transition-colors"
            >
              入库并分发研判
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
