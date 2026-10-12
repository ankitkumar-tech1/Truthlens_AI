import React, { useEffect, useState } from 'react';
import { Database, ShieldCheck, Cpu, ExternalLink, AlertTriangle } from 'lucide-react';
import { ModelMetadataInfo } from '../types';

export const ModelRegistry: React.FC = () => {
  const [models, setModels] = useState<ModelMetadataInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/models-info')
      .then((res) => res.json())
      .then((data) => {
        setModels(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Database className="w-4 h-4" />
            <span>Auditable Model & Pipeline Registry (MODELS.md)</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Transparent AI Architectures, Datasets & Benchmarks
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            In strict compliance with Explainable AI mandates, TruthLens AI documents every pretrained model, dataset base (LIAR, WELFake, FaceForensics++, ASVspoof), benchmark accuracy metric, license, and known limitation.
          </p>
        </div>
      </div>

      {/* Model Cards */}
      {loading ? (
        <div className="text-center py-12 text-slate-500 text-sm font-medium">Loading Model Registry Data...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {models.map((model) => (
            <div key={model.id} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-blue-600" />
                    <h2 className="text-base font-bold text-slate-900">{model.name}</h2>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 uppercase tracking-wider">
                    {model.type}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Training Datasets</span>
                    <p className="text-slate-800 font-medium mt-0.5">{model.datasets}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Tested Accuracy Benchmark</span>
                    <p className="text-emerald-600 font-bold font-mono mt-0.5">{model.benchmark}</p>
                  </div>

                  <div>
                    <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider block">Known Limitations</span>
                    <p className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mt-0.5 font-medium leading-relaxed">
                      {model.limitations}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono font-bold">
                <span>License: {model.license}</span>
                <span className="text-blue-600 uppercase tracking-wider">Audited Component</span>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
