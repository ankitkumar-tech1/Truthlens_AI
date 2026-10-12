import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { LinkClaimAnalyzer } from './components/LinkClaimAnalyzer';
import { ImageAnalyzer } from './components/ImageAnalyzer';
import { FactCheckReport, ImageForensicResult } from './types';
import { ShieldCheck, History, Clock } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'link' | 'image'>('link');
  const [history, setHistory] = useState<Array<{ id: string; type: 'LINK' | 'IMAGE'; title: string; verdict: string; timestamp: string }>>([]);

  const addHistoryItem = (item: { id: string; type: 'LINK' | 'IMAGE'; title: string; verdict: string; timestamp: string }) => {
    setHistory(prev => [item, ...prev.slice(0, 4)]);
  };

  const handleLinkReport = (report: FactCheckReport) => {
    addHistoryItem({
      id: report.id,
      type: 'LINK',
      title: report.inputContent.slice(0, 45) + '...',
      verdict: report.verdictTitle,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  const handleImageReport = (report: ImageForensicResult) => {
    addHistoryItem({
      id: report.id,
      type: 'IMAGE',
      title: report.filename,
      verdict: report.verdict === 'AI_GENERATED' ? 'AI-Generated Image' : 'Authentic Photo',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500/30 selection:text-emerald-700 dark:selection:text-emerald-200 transition-colors duration-300">
      {/* Header Bar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-12">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Information Authenticity & Verification System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 dark:from-white dark:via-slate-100 dark:to-slate-400">
            Verify Real vs Fake vs AI Content
          </h1>

          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Verify a news URL or upload an image to check its authenticity.
          </p>
        </div>

        {/* Tab Content */}
        <div className="transition-all duration-300">
          {activeTab === 'link' ? (
            <LinkClaimAnalyzer onReportGenerated={handleLinkReport} />
          ) : (
            <ImageAnalyzer onReportGenerated={handleImageReport} />
          )}
        </div>

        {/* Recent Session History */}
        {history.length > 0 && (
          <div className="bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-6 backdrop-blur-md space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center space-x-2 text-sm font-semibold text-slate-800 dark:text-slate-300">
              <History className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Recent Verifications</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {history.map(item => (
                <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500 text-[10px]">
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{item.type}</span>
                    <span className="flex items-center space-x-1"><Clock className="w-3 h-3" /> <span>{item.timestamp}</span></span>
                  </div>
                  <div className="text-slate-800 dark:text-slate-200 font-medium truncate">{item.title}</div>
                  <div className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{item.verdict}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/60 py-6 text-center text-xs text-slate-500 dark:text-slate-500">
        <p>TruthLens Media Inspection Engine • Fast & Explainable Verification</p>
      </footer>
    </div>
  );
}

export default App;
