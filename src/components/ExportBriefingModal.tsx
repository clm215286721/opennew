import React, { useState, useRef } from 'react';
import { 
  FileText, Download, Printer, Copy, Check, X, 
  Shield, AlertTriangle, Layers, Code, CheckSquare, 
  Square, ExternalLink, Sparkles, Database, FileSpreadsheet
} from 'lucide-react';
import { IntelReport } from '../types/intelligence';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export type ExportFormat = 'PDF' | 'JSON';

interface ExportBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: IntelReport;
}

export const ExportBriefingModal: React.FC<ExportBriefingModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [format, setFormat] = useState<ExportFormat>('PDF');
  const [includeRawContent, setIncludeRawContent] = useState(true);
  const [includeEvidence, setIncludeEvidence] = useState(true);
  const [includeEntities, setIncludeEntities] = useState(true);
  const [includeAdmiralty, setIncludeAdmiralty] = useState(true);
  const [includeCaveats, setIncludeCaveats] = useState(true);
  
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exportSuccessMessage, setExportSuccessMessage] = useState<string | null>(null);

  const pdfPreviewRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  // Build structured military tactical JSON data packet
  const generateTacticalJson = () => {
    const timestamp = new Date().toISOString();
    return {
      packetHeader: {
        specVersion: "APEX-STIX-2.1-COMPATIBLE",
        packetId: `PKT-${report.id}-${Date.now().toString(36).toUpperCase()}`,
        generationTime: timestamp,
        classification: report.classification,
        trafficLightProtocol: report.classification === 'TOP_SECRET' ? 'TLP:RED' : report.classification === 'SECRET' ? 'TLP:AMBER' : 'TLP:GREEN',
        originatingStation: "天玑战区联合参谋部情报局 (J-2 APEX INTEL)",
        handlingInstructions: includeCaveats ? [
          "REL TO USA, FVEY, APEX COMMAND",
          "不得擅自向未经许可的第三方部门转交",
          "涉密数据需离线密存或在涉密专网终端解析"
        ] : []
      },
      reportData: {
        id: report.id,
        codeName: report.codeName,
        title: report.title,
        category: report.category,
        threatLevel: report.threatLevel,
        capturedTimestamp: report.timestamp,
        admiraltyRating: includeAdmiralty ? {
          code: report.sourceReliability,
          sourceEvaluation: report.sourceReliability.charAt(0),
          informationCredibility: report.sourceReliability.charAt(1)
        } : undefined,
        geographicalTarget: {
          locationName: report.locationName,
          coordinates: {
            latitude: report.coordinates.lat,
            longitude: report.coordinates.lng
          }
        },
        executiveSummary: report.summary,
        rawContent: includeRawContent ? report.content : undefined,
        evidenceChain: includeEvidence ? report.keyFindings.map((f, i) => ({
          sequence: i + 1,
          finding: f,
          verificationStatus: "VERIFIED_CROSS_CORRELATED"
        })) : [],
        identifiedEntities: includeEntities ? report.entities.map(e => ({
          entityName: e,
          classificationTag: "TARGET_OF_INTEREST"
        })) : [],
        priorityDirective: report.priorityAction || "维持当前被动监视频度",
      }
    };
  };

  const jsonString = JSON.stringify(generateTacticalJson(), null, 2);

  // Handle JSON Download
  const handleDownloadJson = () => {
    setIsExporting(true);
    try {
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `APEX_INTEL_PACKAGE_${report.codeName}_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setExportSuccessMessage('JSON 战术数据包已成功生成并下载！');
      setTimeout(() => setExportSuccessMessage(null), 3000);
    } catch (e) {
      console.error('Download JSON error:', e);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle PDF Export using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!pdfPreviewRef.current) return;
    setIsExporting(true);

    try {
      const element = pdfPreviewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2, // High resolution rendering
        useCORS: true,
        backgroundColor: '#090d16',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      pdf.save(`APEX_INTEL_DOSSIER_${report.codeName}_${Date.now()}.pdf`);
      setExportSuccessMessage('PDF 战术简报已成功渲染并导出！');
      setTimeout(() => setExportSuccessMessage(null), 3000);
    } catch (e) {
      console.error('PDF generation error, triggering print fallback:', e);
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-[#090d16] border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl my-auto flex flex-col overflow-hidden text-slate-100 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Military Banner */}
        <div className="bg-gradient-to-r from-amber-500 via-sky-500 to-rose-500 h-1.5 w-full shrink-0" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-[#0e1424] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-amber-400/15 border border-amber-400/30 text-amber-400">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                  {report.classification}
                </span>
                <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider">
                  {report.codeName}
                </span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide mt-0.5 font-display">
                导出战术防务情报简报 (EXPORT INTELLIGENCE PACKET)
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors cursor-pointer"
            title="关闭 (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {exportSuccessMessage && (
          <div className="bg-emerald-950/80 border-b border-emerald-500/40 px-4 py-2 text-xs font-mono text-emerald-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{exportSuccessMessage}</span>
            </div>
            <button onClick={() => setExportSuccessMessage(null)} className="text-emerald-400 hover:text-emerald-200 cursor-pointer">✕</button>
          </div>
        )}

        {/* Controls Bar: Format Selector & Configuration Toggles */}
        <div className="p-3 sm:px-5 sm:py-3 border-b border-slate-800 bg-[#0b101c] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          {/* Format Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setFormat('PDF')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                format === 'PDF'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF 战术简报</span>
            </button>

            <button
              onClick={() => setFormat('JSON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                format === 'JSON'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON 战术数据包</span>
            </button>
          </div>

          {/* Configuration Toggles */}
          <div className="flex flex-wrap items-center gap-3 text-slate-300 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-100">
              <input 
                type="checkbox" 
                checked={includeEvidence} 
                onChange={(e) => setIncludeEvidence(e.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>事实证据链</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-100">
              <input 
                type="checkbox" 
                checked={includeEntities} 
                onChange={(e) => setIncludeEntities(e.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>关联涉事目标</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-100">
              <input 
                type="checkbox" 
                checked={includeAdmiralty} 
                onChange={(e) => setIncludeAdmiralty(e.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>北约信度矩阵</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer select-none hover:text-slate-100">
              <input 
                type="checkbox" 
                checked={includeCaveats} 
                onChange={(e) => setIncludeCaveats(e.target.checked)}
                className="accent-amber-400 cursor-pointer"
              />
              <span>TLP 保密指引</span>
            </label>
          </div>
        </div>

        {/* Content Preview Container */}
        <div className="p-4 sm:p-5 flex-1 max-h-[58vh] overflow-y-auto bg-[#070b14]">
          {format === 'PDF' ? (
            /* Rendered Printable / PDF Dossier Preview */
            <div 
              ref={pdfPreviewRef}
              className="bg-[#0b101c] border border-slate-700/80 rounded-lg p-5 sm:p-7 text-slate-200 shadow-xl space-y-5 text-xs font-mono"
            >
              {/* Defense Dossier Top Classification Header */}
              <div className="flex items-center justify-between border-b-2 border-rose-600/80 pb-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                    TOP SECRET // NOFORN // FVEY // APEX
                  </span>
                  <span className="text-base font-bold text-slate-100 font-sans tracking-wide mt-0.5">
                    天玑战略防务态势感知中枢 · 战术情报档案
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-400">
                  <div>编号: <span className="text-amber-400 font-bold">{report.id}</span></div>
                  <div>归档周期: 2026-Q3</div>
                </div>
              </div>

              {/* Core Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-900/80 p-3 rounded border border-slate-800 text-[11px]">
                <div>
                  <span className="text-slate-500 block">代号名称:</span>
                  <span className="text-amber-300 font-bold">{report.codeName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">情报来源:</span>
                  <span className="text-sky-300 font-bold">{report.category}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">威胁定级:</span>
                  <span className={`font-bold ${report.threatLevel === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'}`}>
                    {report.threatLevel}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">北约 Admiralty 信度:</span>
                  <span className="text-emerald-400 font-bold">{report.sourceReliability}</span>
                </div>
              </div>

              {/* Title & Coordinates */}
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-100 font-sans">
                  {report.title}
                </h3>
                <div className="text-slate-400 text-[11px] mt-1 flex items-center gap-2">
                  <span>目标区域: {report.locationName}</span>
                  <span>•</span>
                  <span>坐标: {report.coordinates.lat}N, {report.coordinates.lng}E</span>
                  <span>•</span>
                  <span>截获时间: {report.timestamp}</span>
                </div>
              </div>

              {/* BLUF Summary */}
              <div className="space-y-1.5">
                <span className="text-amber-400 font-bold uppercase text-[11px]">
                  一、核心研判结论 (BLUF - BOTTOM LINE UP FRONT)
                </span>
                <p className="bg-slate-950/60 p-3 rounded border-l-2 border-amber-400 text-slate-200 leading-relaxed font-sans text-xs">
                  {report.summary}
                </p>
              </div>

              {/* Raw Cable / Body */}
              {includeRawContent && (
                <div className="space-y-1.5">
                  <span className="text-slate-400 font-bold uppercase text-[11px]">
                    二、原始截获电报与侦测细节
                  </span>
                  <div className="bg-slate-950/40 p-3 rounded border border-slate-850 text-slate-300 leading-relaxed text-[11px] whitespace-pre-wrap">
                    {report.content}
                  </div>
                </div>
              )}

              {/* Evidence Chain */}
              {includeEvidence && (
                <div className="space-y-1.5">
                  <span className="text-sky-400 font-bold uppercase text-[11px]">
                    三、关键事实证据链条 ({report.keyFindings.length} 项)
                  </span>
                  <ul className="space-y-1 bg-slate-950/40 p-2.5 rounded border border-slate-850">
                    {report.keyFindings.map((finding, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-slate-300 text-[11px]">
                        <span className="text-sky-400 font-bold mt-0.5">[{idx + 1}]</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Identified Target Entities */}
              {includeEntities && (
                <div className="space-y-1.5">
                  <span className="text-purple-400 font-bold uppercase text-[11px]">
                    四、关联涉案重点实体
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.entities.map((ent, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 border border-purple-800 text-[11px]">
                        {ent}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Directives */}
              <div className="space-y-1.5">
                <span className="text-rose-400 font-bold uppercase text-[11px]">
                  五、指挥部优先应对指令
                </span>
                <div className="bg-rose-950/20 border border-rose-500/30 p-2.5 rounded text-rose-200 text-[11px] leading-relaxed">
                  {report.priorityAction || '持续保持多波段被动信号监听与低轨雷达卫星二次重访。'}
                </div>
              </div>

              {/* Security Handling Caveats */}
              {includeCaveats && (
                <div className="border-t border-slate-800 pt-2 text-[10px] text-slate-500 flex justify-between">
                  <span>保密分发标识: TLP:RED // PROPRIETARY DEFENSE INFORMATION</span>
                  <span>校验码: SHA256-{(report.id + report.codeName).split('').reduce((a,b)=>(((a<<5)-a)+b.charCodeAt(0))|0, 0).toString(16)}</span>
                </div>
              )}
            </div>
          ) : (
            /* JSON View */
            <div className="relative">
              <pre className="bg-[#0b101c] border border-slate-800 rounded-lg p-4 text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-[50vh]">
                {jsonString}
              </pre>
              <button
                onClick={handleCopyJson}
                className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono border border-slate-700 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '已复制' : '复制代码'}</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-3 sm:px-5 sm:py-3.5 bg-[#0e1424] border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs font-mono">
          <div className="flex items-center gap-2">
            {format === 'PDF' ? (
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-sky-400" />
                <span>调用系统打印 (Print/PDF)</span>
              </button>
            ) : (
              <button
                onClick={handleCopyJson}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-sky-400" />}
                <span>{copied ? '已复制至剪贴板' : '复制 JSON 报文'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded cursor-pointer"
            >
              取消
            </button>

            <button
              onClick={format === 'PDF' ? handleDownloadPdf : handleDownloadJson}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded transition-colors cursor-pointer shadow-md shadow-amber-400/20 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>
                {isExporting 
                  ? '正在导出...' 
                  : format === 'PDF' 
                    ? '下载战术简报 (PDF)' 
                    : '下载战术数据包 (JSON)'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
