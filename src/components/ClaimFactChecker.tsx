import React, { useState } from 'react';
import { Search, ShieldAlert, CheckCircle2, AlertTriangle, ExternalLink, Cpu, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { FactCheckReport } from '../types';
import { PRESET_CLAIMS, PresetClaim } from '../data/presetSamples';

export const ClaimFactChecker: React.FC = () => {
  const [inputContent, setInputContent] = useState('');
  const [inputType, setInputType] = useState<'URL' | 'TEXT' | 'CLAIM'>('CLAIM');
  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState<string>('');
  const [report, setReport] = useState<FactCheckReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async (contentToAnalyze?: string, overrideType?: 'URL' | 'TEXT' | 'CLAIM') => {
    const textToSubmit = contentToAnalyze ?? inputContent;
    if (!textToSubmit.trim()) {
      setError('Please enter a news URL, claim, or article text to analyze.');
      return;
    }

    setError(null);
    setLoading(true);
    setReport(null);

    const steps = [
      'Sending the supplied claim to Gemini...',
      'Checking the claim against available evidence...',
      'Validating the structured verification result...'
    ];

    let stepIndex = 0;
    setProgressStep(steps[0]);
    const interval = setInterval(() => {
      stepIndex++;
      if (stepIndex < steps.length) {
        setProgressStep(steps[stepIndex]);
      }
    }, 600);

    try {
      console.log('[TruthLens] User claim:', textToSubmit);
      const res = await fetch('/api/analyze/text-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputContent: textToSubmit,
          inputType: overrideType || inputType,
        }),
      });

      clearInterval(interval);

      const data: unknown = await res.json().catch(() => null);
      if (!res.ok) {
        const errorData = data as { status?: string; message?: string } | null;
        throw new Error(errorData?.status === 'AI_UNAVAILABLE'
          ? 'Verification temporarily unavailable'
          : errorData?.message || 'Failed to analyze claim. Server returned error.');
      }

      if (!data || typeof data !== 'object' || !('success' in data) || data.success !== true) {
        throw new Error('Verification temporarily unavailable');
      }
      setReport(data as FactCheckReport);
    } catch (err: unknown) {
      clearInterval(interval);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred during claim verification.');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: PresetClaim) => {
    setInputContent(preset.content);
    setInputType(preset.type);
    handleAnalyze(preset.content, preset.type);
  };

  const getRiskBadge = (verdict: FactCheckReport['verdict']) => {
    switch (verdict) {
      case 'FALSE':
        return {
          label: 'FALSE',
          bgColor: 'bg-red-50 border-red-200 text-red-700',
          icon: ShieldAlert,
          color: 'text-red-600',
        };
      case 'MISLEADING':
        return {
          label: 'MISLEADING',
          bgColor: 'bg-amber-50 border-amber-200 text-amber-800',
          icon: AlertTriangle,
          color: 'text-amber-600',
        };
      case 'TRUE':
        return {
          label: 'TRUE',
          bgColor: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          icon: CheckCircle2,
          color: 'text-emerald-600',
        };
      case 'UNVERIFIED':
      default:
        return {
          label: 'UNVERIFIED',
          bgColor: 'bg-slate-50 border-slate-200 text-slate-700',
          icon: AlertTriangle,
          color: 'text-slate-600',
        };
    }
  };

  return (
    <div className="space-y-6">

      {/* Top Header & Search Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Analysis Phase 1: Text & URL Classification</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Claim Verification & Evidence Analysis
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            Paste a news URL or statement to perform real-time domain SSL checks, NLP clickbait detection, and search-grounded RAG verification.
          </p>
        </div>

        {/* Input Box */}
        <div className="space-y-4">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            URL or Text Content
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              placeholder="https://daily-truth-observer.co/news/breaking-breakthrough/ or claim text..."
              className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-blue-500 font-mono"
            />
            <button
              onClick={() => handleAnalyze()}
              disabled={loading}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-bold text-sm shadow-md hover:bg-blue-700 transition-colors uppercase tracking-tight flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span>{loading ? 'Analyzing...' : 'Analyze Truth'}</span>
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg flex items-center gap-2 font-medium">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </p>
          )}

          {/* Preset Buttons */}
          <div className="pt-2 border-t border-slate-100">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">Preset Test Scenarios:</span>
            <div className="flex flex-wrap gap-2">
              {PRESET_CLAIMS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md font-medium border border-slate-200 transition-colors"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <div>
            <h3 className="text-base font-bold text-slate-800">TruthLens Analysis Pipeline Running</h3>
            <p className="text-xs text-blue-600 font-mono mt-1 font-semibold">{progressStep}</p>
          </div>
          <div className="max-w-md mx-auto bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div className="bg-blue-600 h-full w-3/4 animate-pulse rounded-full"></div>
          </div>
        </div>
      )}

      {/* Report Result Display */}
      {report && !loading && (
        <div className="space-y-6 animate-fade-in">

          {/* Executive Summary & Risk Gauge Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">

            {/* Header / Risk Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Report ID: {report.id}</span>
                  <span>•</span>
                  <span>{new Date(report.timestamp).toLocaleString()}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  {report.verdictTitle}
                </h2>
              </div>

              {/* Risk Badge */}
              {(() => {
                const badge = getRiskBadge(report.verdict);
                const BadgeIcon = badge.icon;
                return (
                  <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg border ${badge.bgColor} shrink-0`}>
                    <BadgeIcon className={`w-5 h-5 ${badge.color}`} />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide block">
                        {badge.label}
                      </span>
                      <span className="text-xs font-medium">
                        Risk Score: {report.risk_score === null ? 'N/A' : `${report.risk_score}/100`}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Verdict Summary */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Executive Verdict</h3>
              <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-200">
                {report.verdictSummary}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Risk Score</span>
                <span className="text-xl font-bold text-slate-900">{report.risk_score ?? 'N/A'}{report.risk_score === null ? '' : '/100'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Trust Score</span>
                <span className="text-xl font-bold text-slate-900">{report.trust_score ?? 'N/A'}{report.trust_score === null ? '' : '/100'}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Confidence</span>
                <span className="text-xl font-bold text-slate-900">{report.confidence ?? 'N/A'}{report.confidence === null ? '' : '/100'}</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Reasoning</h3>
              <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200">{report.reasoning}</p>
            </div>
            {(report.supporting_evidence.length > 0 || report.contradicting_evidence.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { title: 'Supporting Evidence', items: report.supporting_evidence },
                  { title: 'Contradicting Evidence', items: report.contradicting_evidence },
                ].map(({ title, items }) => items.length > 0 && (
                  <div key={title} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
                    <ul className="space-y-2">
                      {items.map((item, index) => <li key={index} className="text-xs text-slate-700">{item}</li>)}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900">Web Search Evidence</h3>
            <p className="text-xs text-slate-600">
              {report.traceability.searchGroundingActive
                ? `${report.sources.length} grounding source${report.sources.length === 1 ? '' : 's'} returned`
                : 'No grounding sources returned'}
            </p>
          </div>

          {/* RAG Evidence Sources Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Web Search Evidence Sources</h3>
              </div>
            </div>

            {report.sources.length > 0 ? (
              <div className="space-y-3">
                {report.sources.map((source, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 border-l-4 border-blue-500 rounded-r-lg space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{source.title}</span>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold uppercase hover:bg-blue-200 transition flex items-center gap-1"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono truncate block">{source.url}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-500 italic">
                No grounding source results were returned for this claim.
              </div>
            )}
          </div>

          {/* Traceability Footer */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Model: {report.traceability.modelUsed}</span>
            </div>
            <div>
              <span>Execution: {report.traceability.executionTimeMs}ms</span>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
