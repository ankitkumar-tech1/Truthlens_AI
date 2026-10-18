import React, { useState, useEffect } from 'react';
import { History, Search, Download, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { AnalysisHistoryItem } from '../types';
import { fetchAnalysisHistory } from '../services/api';

export const AnalysisHistory: React.FC = () => {
  const [historyItems, setHistoryItems] = useState<AnalysisHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await fetchAnalysisHistory();
        setHistoryItems(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const filtered = historyItems.filter((item) => {
    const matchesSearch = item.inputSummary.toLowerCase().includes(searchTerm.toLowerCase()) || item.verdict.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.inputType === filterType;
    return matchesSearch && matchesType;
  });

  const getVerdictBadge = (verdict: string) => {
    if (verdict.includes('HIGH') || verdict.includes('AI') || verdict.includes('SYNTHETIC') || verdict.includes('DEEPFAKE') || verdict.includes('Fake')) {
      return (
        <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-1 w-fit">
          <ShieldAlert className="w-3 h-3 text-red-600" />
          {verdict}
        </span>
      );
    }
    return (
      <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide flex items-center gap-1 w-fit">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        {verdict}
      </span>
    );
  };

  const handleDownloadReport = (item: AnalysisHistoryItem) => {
    const reportText = `====================================================
TRUTHLENS AI — MULTIMODAL VERIFICATION REPORT
====================================================
Report ID: ${item.id}
Date: ${item.timestamp}
Input Type: ${item.inputType}
Content: ${item.inputSummary}

VERDICT: ${item.verdict}
Trust Score: ${item.trustScore}/100
Risk Score: ${item.riskScore}/100
Confidence: ${item.confidence}

EXECUTIVE SUMMARY:
Analyzed using Web Search Evidence RAG, domain WHOIS/SSL checks, and multimodal neural classifiers.

DISCLAIMER:
AI-generated analysis is advisory and should not be treated as absolute proof of authenticity.
====================================================`;

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `truthlens_report_${item.id}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 shadow-sm space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <History className="w-4 h-4" />
            <span>Audit Trail & Historical Archive</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Verification Jobs History & Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 italic mt-1">
            Review past claim investigations, download traceable report text, and re-inspect forensic logs.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">

          {/* Search Box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by claim keyword, URL, or verdict..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition font-medium"
            />
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium shrink-0">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterType === 'ALL' ? 'bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              All Types
            </button>
            <button
              onClick={() => setFilterType('CLAIM')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterType === 'CLAIM' ? 'bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Claims
            </button>
            <button
              onClick={() => setFilterType('URL')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterType === 'URL' ? 'bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              URLs
            </button>
            <button
              onClick={() => setFilterType('IMAGE')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${filterType === 'IMAGE' ? 'bg-white dark:bg-slate-800 shadow text-emerald-600 dark:text-emerald-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Images
            </button>
          </div>

        </div>
      </div>

      {/* History Table */}
      {loading ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center space-y-3 shadow-sm">
          <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Loading analysis history archive...</span>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300 border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold text-[10px]">
                <tr>
                  <th className="p-4">Job ID</th>
                  <th className="p-4">Input Type</th>
                  <th className="p-4">Summary / Target Content</th>
                  <th className="p-4">Verdict</th>
                  <th className="p-4">Trust Score</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Report Export</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">{item.id}</td>
                    <td className="p-4">
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {item.inputType}
                      </span>
                    </td>
                    <td className="p-4 max-w-sm">
                      <span className="font-bold text-slate-900 dark:text-white block truncate">{item.inputSummary}</span>
                      {item.isDemo && (
                        <span className="text-[9px] text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wider">DEMO BENCHMARK CASE</span>
                      )}
                    </td>
                    <td className="p-4">{getVerdictBadge(item.verdict)}</td>
                    <td className="p-4">
                      <span className={`font-bold ${item.trustScore > 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {item.trustScore}/100
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">{new Date(item.timestamp).toLocaleString()}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleDownloadReport(item)}
                        className="inline-flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 px-3 py-1.5 rounded-lg transition font-bold text-[11px] cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Download Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
