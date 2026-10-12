import React, { useState } from 'react';
import { Mic, ShieldAlert, CheckCircle2, Play, Pause, Sparkles, Activity, Cpu, RefreshCw } from 'lucide-react';
import { AudioForensicResult } from '../types';
import { PRESET_AUDIO } from '../data/presetSamples';

export const AudioInspector: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState<string>('aud-1');
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<AudioForensicResult | null>(null);

  const handleAnalyzeAudio = async (presetId: string) => {
    setSelectedPreset(presetId);
    setLoading(true);
    setReport(null);

    const sample = PRESET_AUDIO.find(a => a.id === presetId);

    try {
      const res = await fetch('/api/analyze/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId: presetId,
          filename: sample?.filename || 'recording.wav',
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze audio.');

      const data: AudioForensicResult = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Preset Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Analysis Phase 3: Audio & Voice Clone Detection</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Acoustic Spectral Analysis & Voice Clone Inspection
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            Analyze audio samples for synthetic vocoder artifacts (ElevenLabs/VALL-E), pitch micro-tremor variance, and breath markers.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {PRESET_AUDIO.map((sample) => (
            <button
              key={sample.id}
              onClick={() => handleAnalyzeAudio(sample.id)}
              className={`p-4 rounded-xl border text-left transition space-y-1 ${
                selectedPreset === sample.id
                  ? 'bg-blue-50/60 border-blue-500 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">{sample.title}</span>
                <span className="text-[10px] text-blue-600 font-mono font-bold">{sample.duration}</span>
              </div>
              <p className="text-[11px] text-slate-500">{sample.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4 shadow-sm">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-800">Running Wav2Vec2 Acoustic Spectral Inspection...</p>
        </div>
      )}

      {/* Forensic Report Output */}
      {report && !loading && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            
            {/* Header / Verdict */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs text-slate-400 font-mono font-bold">Filename: {report.filename}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  Audio Acoustic Verdict
                </h2>
              </div>

              <div className={`px-4 py-2.5 rounded-lg border flex items-center gap-3 shrink-0 ${
                report.verdict === 'SYNTHETIC_VOICE'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {report.verdict === 'SYNTHETIC_VOICE' ? (
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide block">
                    {report.verdict === 'SYNTHETIC_VOICE' ? 'SYNTHETIC VOICE / CLONED AUDIO' : 'AUTHENTIC HUMAN SPEECH'}
                  </span>
                  <span className="text-[11px] font-medium">
                    ASVspoof Model Logit: {(report.wav2vecLogit * 100).toFixed(1)}% Synthetic Likelihood
                  </span>
                </div>
              </div>
            </div>

            {/* Audio Spectrum Wave Visualizer */}
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition shadow-sm"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <span className="text-xs font-bold text-slate-800">
                    {isPlaying ? 'Playing Audio Sample & Rendering Spectrum...' : 'Click to Play Audio Sample'}
                  </span>
                </div>
                <span className="text-xs text-slate-400 font-mono font-bold">{report.durationSeconds}s Duration</span>
              </div>

              {/* Animated Spectral Wave Bars */}
              <div className="flex items-end justify-between h-16 gap-1 px-2">
                {[40, 65, 80, 45, 90, 30, 75, 85, 50, 95, 60, 40, 70, 85, 30, 90, 65, 50, 80, 45, 95, 60].map((h, i) => (
                  <div
                    key={i}
                    className={`w-full rounded-t transition-all ${
                      isPlaying ? 'animate-pulse bg-blue-600' : 'bg-slate-300'
                    }`}
                    style={{ height: isPlaying ? `${Math.min(100, h * (1 + Math.sin(i)))}%` : `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>

            {/* Acoustic Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Spectral Continuity</span>
                <span className="text-base font-bold text-slate-900">{Math.round(report.metrics.spectralContinuityScore * 100)}%</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Pitch Micro-Tremor</span>
                <span className="text-base font-bold text-slate-900">{report.metrics.pitchVariance} Hz</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Breath Markers</span>
                <span className={`text-base font-bold ${report.metrics.breathMarkerPresence ? 'text-emerald-600' : 'text-red-600'}`}>
                  {report.metrics.breathMarkerPresence ? 'Detected' : 'Missing'}
                </span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Vocoder Artifacts</span>
                <span className="text-base font-bold text-slate-900">{Math.round(report.metrics.roboticArtifactScore * 100)}%</span>
              </div>
            </div>

            {/* Signals List */}
            <div className="space-y-2">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Acoustic Signal Breakdown</h3>
              <ul className="space-y-2">
                {report.signals.map((signal, idx) => (
                  <li key={idx} className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200 flex items-start gap-2">
                    <Activity className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{signal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Traceability Footer */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Model Checkpoint: {report.traceability.modelName}</span>
              </div>
              <div>
                <span>Benchmark: {report.traceability.dataset}</span>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
