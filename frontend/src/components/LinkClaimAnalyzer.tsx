import React, { useState } from 'react';
import { Search, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Globe, ExternalLink, RefreshCw, FileText, ArrowRight } from 'lucide-react';
import { FactCheckReport } from '../types';
import { analyzeTextUrl } from '../services/api';

interface LinkClaimAnalyzerProps {
  onReportGenerated: (report: FactCheckReport) => void;
}

const PRESET_SAMPLES = [
  {
    label: '🚀 NASA Webb Telescope Discovery (Verified)',
    url: 'https://www.nasa.gov/missions/webb/nasa-webb-telescope-captures-deepest-view-of-universe/',
    type: 'URL',
  },
  {
    label: '⚠️ Viral Shocking Miracle Cure Claim (Fake)',
    url: 'SHOCKING SECRET: Scientists ban overnight miracle herb curing all diseases!',
    type: 'CLAIM',
  },
  {
    label: '🤖 AI-Generated Tech Press Release (Synthetic)',
    url: 'https://tech-daily-leak.xyz/ai-breaks-quantum-encryption-overnight',
    type: 'URL',
  },
];

export const LinkClaimAnalyzer: React.FC<LinkClaimAnalyzerProps> = ({ onReportGenerated }) => {
  const [inputContent, setInputContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FactCheckReport | null>(null);

  const handleAnalyze = async (contentToAnalyze?: string) => {
    const text = contentToAnalyze || inputContent;
    if (!text.trim()) {
      setError('Please enter a valid news URL or claim text.');
      return;
    }

    setError(null);
    setLoading(true);
    setReport(null);

    try {
      const inputType = text.startsWith('http') || text.includes('.com') || text.includes('.org') ? 'URL' : 'CLAIM';
      const data = await analyzeTextUrl(text, inputType);
      setReport(data);
      onReportGenerated(data);
    } catch (err: any) {
      console.error('Analysis error:', err);
      const msg = err instanceof Error ? err.message : 'Failed to complete analysis. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = () => {
    if (!report) return null;
    const verdicts = {
      TRUE: {
        label: 'VERIFIED TRUE',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        icon: CheckCircle2,
      },
      FALSE: {
        label: 'VERIFIED FALSE',
        bgColor: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
        icon: ShieldAlert,
      },
      MISLEADING: {
        label: 'MISLEADING',
        bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        icon: AlertTriangle,
      },
      UNVERIFIED: {
        label: 'UNVERIFIED',
        bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        icon: AlertTriangle,
      },
    };
    return {
      ...verdicts[report.verdict],
      desc: `Gemini classified this claim as ${report.verdict.toLowerCase()}.`,
    };
  };

  const verdict = getVerdictBadge();

  return (
    <div className="space-y-8">
      {/* Input Box */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-3xl -z-10" />
        
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
            <Search className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <span>Analyze News Article or Link</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
             Paste any information or claim to verify its accuracy and reliability.
          </p>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <div className="relative">
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
              placeholder="Paste article URL (e.g. https://reuters.com/...) or enter news headline / claim text here..."
              rows={3}
              className="w-full bg-slate-50 dark:bg-slate-950/90 border border-slate-300 dark:border-slate-800 focus:border-emerald-500/60 focus:ring-2 focus:ring-emerald-500/20 rounded-xl p-4 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm resize-none transition-all outline-none"
            />
          </div>

          {/* Quick Preset Samples */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Try Preset Benchmark Samples:
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInputContent(sample.url);
                    handleAnalyze(sample.url);
                  }}
                  className="bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-emerald-500/40 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{sample.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
              <div className="space-y-1">
                <div className="font-semibold text-rose-700 dark:text-rose-300 text-sm">Verification temporarily unavailable</div>
                <div className="text-slate-600 dark:text-slate-300 leading-relaxed">{error}</div>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={() => handleAnalyze()}
            disabled={loading || !inputContent.trim()}
            className="w-full bg-gradient-to-r from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-emerald-950/20 dark:shadow-emerald-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running Gemini AI Grounded Search & Fact-Check...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Link / Claim Now</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Result Card */}
      {report && verdict && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 transition-colors duration-300">
          {/* Header Verdict Badge */}
          <div className={`p-5 rounded-xl border ${verdict.bgColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="flex items-center space-x-3">
              <verdict.icon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-xl font-extrabold tracking-wide uppercase">{verdict.label}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{verdict.desc}</p>
              </div>
            </div>

            {/* Score Pill */}
            <div className="flex items-center space-x-3 bg-slate-100 dark:bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10">
              <div className="text-right">
                <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Risk Score</div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {report.risk_score === null ? 'N/A' : `${report.risk_score}/100`}
                </div>
              </div>
              <div className="text-right border-l border-slate-300 dark:border-slate-800 pl-3">
                <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">Trust Score</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {report.trust_score === null ? 'N/A' : `${report.trust_score}/100`}
                </div>
              </div>
            </div>
          </div>

          {/* Verdict Summary */}
          <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-300 mb-1 flex items-center space-x-2">
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Executive Investigation Summary</span>
            </h4>
            <p className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed">{report.verdictSummary}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-300">Verification Confidence</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">
                {report.confidence === null ? 'Not available' : `${report.confidence}/100`}
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-800 dark:text-slate-300">
                <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Google Search grounding</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {report.traceability.searchGroundingActive
                  ? `${report.sources.length} grounding source${report.sources.length === 1 ? '' : 's'} returned`
                  : 'No grounding sources returned'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Model: {report.traceability.modelUsed}</div>
            </div>
          </div>

          {report.reasoning && (
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-2">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reasoning</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300">{report.reasoning}</p>
            </div>
          )}

          {(report.supporting_evidence.length > 0 || report.contradicting_evidence.length > 0) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: 'Supporting Evidence', evidence: report.supporting_evidence },
                { title: 'Contradicting Evidence', evidence: report.contradicting_evidence },
              ].map(({ title, evidence }) => evidence.length > 0 && (
                <div key={title} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{title}</h4>
                  <ul className="space-y-2">
                    {evidence.map((item, index) => (
                      <li key={index} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                        <ArrowRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {report.sources.length > 0 && (
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Google Search grounding sources</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between transition-all group"
                  >
                    <span className="truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400">{src.title}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-400 dark:text-slate-500 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 ml-2" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
