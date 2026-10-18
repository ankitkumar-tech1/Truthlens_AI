import React from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, Calculator, FileText } from 'lucide-react';

interface ScoringModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ScoringModal: React.FC<ScoringModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">TruthLens Risk Scoring Architecture</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            In strict compliance with our <strong className="text-slate-900 font-bold">Traceable & Explainable AI Rules</strong>, TruthLens AI avoids uncalibrated single confidence numbers. Instead, every report displays a transparent 0–100 Risk Index derived from 4 quantitative penalty categories:
          </p>

          <div className="space-y-3">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-600 block">1. Domain & SSL Infrastructure Penalty (Max 25 pts)</span>
              <p className="text-slate-600">
                Evaluates transport SSL certificates, WHOIS domain registration age, top-level domain risk categories (.xyz, .top, .bizarre), and Google Safe Browsing blacklist registries.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-600 block">2. Linguistic Clickbait & Sensationalism Penalty (Max 20 pts)</span>
              <p className="text-slate-600">
                Calculates ALL-CAPS letter density, exclamation mark frequency, and matches sensational alarmist trigger phrases ("SHOCKING SECRET", "OVERNIGHT CURE").
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-600 block">3. Source Corroboration & Wire Search Penalty (Max 35 pts)</span>
              <p className="text-slate-600">
                Queries Web Search Evidence to cross-reference claims against major news wire services (Reuters, AP, BBC, Snopes, PolitiFact, CDC, NASA). Absence of corroborating coverage adds penalty points.
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-blue-600 block">4. Internal Logic & Semantic Consistency Penalty (Max 20 pts)</span>
              <p className="text-slate-600">
                Evaluates internal claim contradictions or unverified statistical jumps.
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-400 block uppercase tracking-wider text-[10px]">Qualitative Risk Bands</span>
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-bold">
              <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-red-700">
                <span className="block font-bold">60 – 100</span>
                <span>HIGH RISK</span>
              </div>
              <div className="bg-amber-50 border border-amber-200 p-2 rounded-lg text-amber-700">
                <span className="block font-bold">31 – 59</span>
                <span>MODERATE RISK</span>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 p-2 rounded-lg text-emerald-700">
                <span className="block font-bold">0 – 30</span>
                <span>LOW RISK</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-5 py-2.5 rounded-lg transition cursor-pointer shadow-sm"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
