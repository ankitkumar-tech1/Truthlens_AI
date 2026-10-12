import React, { useState } from 'react';
import { Film, ShieldAlert, Sparkles, Layers, Cpu, RefreshCw, Eye } from 'lucide-react';
import { VideoForensicResult } from '../types';

export const VideoInspector: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<VideoForensicResult | null>(null);

  const handleAnalyzeVideo = async () => {
    setLoading(true);
    setReport(null);

    try {
      const res = await fetch('/api/analyze/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: 'viral_political_speech_manipulated.mp4',
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze video clip.');

      const data: VideoForensicResult = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Trigger */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Analysis Phase 4: Video Deepfake & Frame Temporal Inspector</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Spatial Frame Sampling & Temporal Boundary Forensics
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            Samples video keyframes (ViT spatial inspector) and evaluates inter-frame temporal boundary inconsistencies, facial warping, and eye-blink physiological baselines.
          </p>
        </div>

        <div className="pt-2">
          <button
            onClick={handleAnalyzeVideo}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wide px-5 py-3 rounded-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Film className="w-4 h-4" />}
            <span>{loading ? 'Analyzing Video Frames...' : 'Run Video Forensic Benchmark'}</span>
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">Sampling 360 Video Frames & Running TimeSformer Temporal Inspection...</p>
        </div>
      )}

      {/* Result Output */}
      {report && !loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs text-slate-400 font-mono font-bold">Filename: {report.filename}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                Video Deepfake Verdict
              </h2>
            </div>

            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg flex items-center gap-3 shrink-0">
              <ShieldAlert className="w-6 h-6 text-red-600" />
              <div>
                <span className="text-xs font-bold uppercase tracking-wide block">DEEPFAKE VIDEO / FACE-SWAPPED</span>
                <span className="text-[11px] font-medium">
                  Manipulated Frame Ratio: {Math.round(report.manipulatedFramesRatio * 100)}% ({report.frameAnalysisCount} frames analyzed)
                </span>
              </div>
            </div>
          </div>

          {/* Sample Keyframe Grid Simulation */}
          <div className="space-y-3">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Sampled Keyframe Anomaly Sequence</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[45, 90, 135, 180].map((frameNum) => (
                <div key={frameNum} className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center space-y-2">
                  <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 relative overflow-hidden">
                    <Eye className="w-6 h-6 text-blue-600 opacity-60" />
                    <span className="absolute top-1 left-1 bg-red-600 text-white text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded">
                      Anomaly
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono font-bold block">Frame #{frameNum}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Anomalies */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Detected Spatial & Temporal Anomalies</h3>
            <ul className="space-y-2">
              {report.detectedAnomalies.map((anomaly, idx) => (
                <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0"></span>
                  <span className="font-medium">{anomaly}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Traceability Footer */}
          <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-600" />
              <span>Spatial: {report.traceability.spatialModel}</span>
            </div>
            <div>
              <span>Temporal: {report.traceability.temporalEngine}</span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
