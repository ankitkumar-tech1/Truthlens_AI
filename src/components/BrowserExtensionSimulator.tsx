import React, { useState } from 'react';
import { Puzzle, ShieldCheck, ShieldAlert, Sparkles, ExternalLink, Globe } from 'lucide-react';

export const BrowserExtensionSimulator: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<'fake' | 'real'>('fake');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Phase 5 Surface Layer: Browser Extension Simulator (Manifest V3)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Inline Real-Time Article Verification
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            This interactive preview demonstrates how the TruthLens AI Browser Extension integrates directly into user news feeds, highlighting claims, evaluating WHOIS/SSL security, and injecting contextual fact-checking widgets inline.
          </p>
        </div>

        {/* Toggle Simulated Web Page */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={() => setActiveArticle('fake')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeArticle === 'fake'
                ? 'bg-red-50 border border-red-200 text-red-700 shadow-sm'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Simulate Browsing Unverified News Site
          </button>
          <button
            onClick={() => setActiveArticle('real')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeArticle === 'real'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 shadow-sm'
                : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Simulate Browsing Verified Reuters Article
          </button>
        </div>
      </div>

      {/* Simulated Browser Frame */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        
        {/* Browser Top Bar */}
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center gap-3 text-xs">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
            <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block"></span>
          </div>

          {/* URL Address Bar */}
          <div className="flex-1 bg-white px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-mono text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate font-medium">
                {activeArticle === 'fake'
                  ? 'https://breaking-daily-truth-leaks.free-news.xyz/article-99412'
                  : 'https://www.reuters.com/technology/space-exploration-mission-report-2026'}
              </span>
            </div>

            {/* Extension Icon in Browser Bar */}
            <div className="flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded text-[10px] text-blue-600 font-bold border border-blue-200">
              <Puzzle className="w-3 h-3" />
              <span>TruthLens Active</span>
            </div>
          </div>
        </div>

        {/* Article Body Content */}
        <div className="p-6 sm:p-8 space-y-6 bg-white">
          
          {/* TruthLens Inline Floating Badge Injection */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            activeArticle === 'fake'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {activeArticle === 'fake' ? (
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                ) : (
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                )}
                <span className="font-bold text-xs uppercase tracking-wider">
                  TruthLens Extension Audit: {activeArticle === 'fake' ? 'HIGH RISK ARTICLE' : 'VERIFIED SOURCE'}
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                Score: {activeArticle === 'fake' ? '84/100 Risk' : '5/100 Risk'}
              </span>
            </div>
            <p className="text-xs text-slate-700 font-medium leading-relaxed">
              {activeArticle === 'fake'
                ? 'Flagged by TruthLens: High-risk TLD (.xyz), clickbait headlines, and zero corroborating wire news coverage found.'
                : 'Verified Domain: Official Reuters wire service domain with valid SSL certificate and transparent editorial attribution.'}
            </p>
          </div>

          {/* Dummy Article Text */}
          <div className="space-y-3">
            <h2 className="text-xl font-bold text-slate-900">
              {activeArticle === 'fake'
                ? 'SHOCKING: Secret Alien Satellite Discovered Orbiting Dark Side of Moon!'
                : 'Global Space Agencies Confirm Next Generation Telescope Data Release'}
            </h2>
            <div className="text-xs text-slate-600 space-y-2 leading-relaxed">
              <p>
                {activeArticle === 'fake'
                  ? 'Government officials are allegedly scrambling after amateur astronomers captured encrypted transmissions from an ancient lunar orbiter. Click now before big pharma and dark web censors take this down!'
                  : 'International astronomical institutes today published verified sensor logs detailing atmospheric spectroscopy findings from the flagship space observatory.'}
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
