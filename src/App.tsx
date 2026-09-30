import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { TopBar } from './components/TopBar';
import { SituationMap } from './components/SituationMap';
import { BriefingCenter } from './components/BriefingCenter';
import { EntityGraph } from './components/EntityGraph';
import { AIAnalystLab } from './components/AIAnalystLab';
import { ThreatMatrix } from './components/ThreatMatrix';
import { NewIntelModal } from './components/NewIntelModal';
import { GlobalSearchOverlay } from './components/GlobalSearchOverlay';
import { INITIAL_INTEL_REPORTS, INITIAL_ENTITIES, INITIAL_ALERTS } from './data/mockIntelligence';
import { IntelReport, TargetEntity, ThreatAlert } from './types/intelligence';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('situation');
  const [reports, setReports] = useState<IntelReport[]>(INITIAL_INTEL_REPORTS);
  const [entities, setEntities] = useState<TargetEntity[]>(INITIAL_ENTITIES);
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_ALERTS);

  const [selectedReportId, setSelectedReportId] = useState<string | null>(INITIAL_INTEL_REPORTS[0].id);
  const [aiReportToAnalyze, setAiReportToAnalyze] = useState<IntelReport | null>(null);
  const [isNewIntelModalOpen, setIsNewIntelModalOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);

  // Global keyboard shortcuts (Cmd+K, Ctrl+K, or '/')
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Toggle search on Cmd+K or Ctrl+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
      // If user presses '/' when not typing in an input/textarea/select
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cross-module handlers
  const handleSelectReport = (report: IntelReport) => {
    setSelectedReportId(report.id);
  };

  const handleSendToAIAnalyst = (report: IntelReport) => {
    setAiReportToAnalyze(report);
    setActiveTab('ai-analyst');
  };

  const handleSelectReportOnMap = (report: IntelReport) => {
    setSelectedReportId(report.id);
    setActiveTab('situation');
  };

  const handleSelectIntelReportById = (reportId: string) => {
    setSelectedReportId(reportId);
    setActiveTab('briefing');
  };

  // Direct report navigation from Global Search Overlay
  const handleGlobalSearchNavigate = (
    report: IntelReport,
    targetView: 'briefing' | 'situation' | 'ai-analyst'
  ) => {
    setSelectedReportId(report.id);
    if (targetView === 'ai-analyst') {
      setAiReportToAnalyze(report);
      setActiveTab('ai-analyst');
    } else {
      setActiveTab(targetView);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === alertId ? { ...a, acknowledged: !a.acknowledged } : a))
    );
  };

  const handleAddReport = (newReport: IntelReport) => {
    setReports((prev) => [newReport, ...prev]);
    setSelectedReportId(newReport.id);
    // Add threat alert if CRITICAL or HIGH
    if (newReport.threatLevel === 'CRITICAL' || newReport.threatLevel === 'HIGH') {
      const newAlert: ThreatAlert = {
        id: `ALT-${Date.now().toString().slice(-3)}`,
        severity: newReport.threatLevel === 'CRITICAL' ? 'CRITICAL' : 'WARNING',
        title: `新突发情报入库: ${newReport.title}`,
        timestamp: '刚刚',
        source: `${newReport.category} 侦搜网`,
        region: newReport.locationName,
        acknowledged: false,
        intelId: newReport.id,
      };
      setAlerts((prev) => [newAlert, ...prev]);
    }
  };

  const unreadAlertCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans">
      <TopBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewIntel={() => setIsNewIntelModalOpen(true)}
        onOpenGlobalSearch={() => setIsGlobalSearchOpen(true)}
        unreadAlertCount={unreadAlertCount}
      />

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'situation' && (
          <SituationMap
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            onSendToAIAnalyst={handleSendToAIAnalyst}
          />
        )}

        {activeTab === 'briefing' && (
          <BriefingCenter
            reports={reports}
            selectedReportId={selectedReportId}
            onSelectReport={handleSelectReport}
            onSelectReportOnMap={handleSelectReportOnMap}
            onSendToAIAnalyst={handleSendToAIAnalyst}
          />
        )}

        {activeTab === 'entity-graph' && (
          <EntityGraph
            entities={entities}
            reports={reports}
            onSelectIntelReport={(report) => {
              setSelectedReportId(report.id);
              setActiveTab('briefing');
            }}
          />
        )}

        {activeTab === 'ai-analyst' && (
          <AIAnalystLab
            initialReport={aiReportToAnalyze}
            onIngestNewReport={handleAddReport}
            reports={reports}
            entities={entities}
            onSelectIntelReportById={handleSelectIntelReportById}
          />
        )}

        {activeTab === 'threat-matrix' && (
          <ThreatMatrix
            alerts={alerts}
            entities={entities}
            reports={reports}
            onAcknowledgeAlert={handleAcknowledgeAlert}
            onSelectIntelReportById={handleSelectIntelReportById}
          />
        )}
      </main>

      {/* Persistent Floating Quick Search HUD Button */}
      <button
        onClick={() => setIsGlobalSearchOpen(true)}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-3 py-2 bg-[#0c121e]/95 hover:bg-slate-800 text-slate-300 hover:text-amber-400 border border-slate-700/80 hover:border-amber-400/50 rounded-full shadow-xl shadow-black/80 transition-all font-mono text-xs cursor-pointer group active:scale-95 backdrop-blur-md"
        title="全局情报深度检索 (快捷键: ⌘K 或 /)"
      >
        <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
        <span className="font-semibold text-slate-200 group-hover:text-amber-300">全局检索</span>
        <span className="text-[10px] bg-slate-850 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/80">⌘K</span>
      </button>

      {/* Persistent Global Search Overlay */}
      <GlobalSearchOverlay
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        reports={reports}
        onNavigateToReport={handleGlobalSearchNavigate}
      />

      <NewIntelModal
        isOpen={isNewIntelModalOpen}
        onClose={() => setIsNewIntelModalOpen(false)}
        onAddReport={handleAddReport}
      />
    </div>
  );
}
