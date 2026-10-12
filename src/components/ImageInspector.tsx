import React, { useState } from 'react';
import { Image as ImageIcon, ShieldAlert, CheckCircle2, Upload, Sparkles, Layers, Cpu, Eye, ExternalLink, RefreshCw } from 'lucide-react';
import { ImageForensicResult } from '../types';
import { PRESET_IMAGES } from '../data/presetSamples';

export const ImageInspector: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('sample_synthetic_photo.jpg');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ImageForensicResult | null>(null);

  const handleAnalyzeImage = async (sampleId?: string, customImageBase64?: string, customName?: string) => {
    setLoading(true);
    setReport(null);

    const name = customName || imageName;

    try {
      const res = await fetch('/api/analyze/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleId,
          imageBase64: customImageBase64 || selectedImage,
          imageName: name,
        }),
      });

      if (!res.ok) throw new Error('Failed to analyze image forensics.');

      const data: ImageForensicResult = await res.json();
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageName(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setSelectedImage(result);
        handleAnalyzeImage(undefined, result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Upload Section */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Analysis Phase 2: Image Forensics</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            AI Image Detection & EXIF Audit
          </h1>
          <p className="text-sm text-slate-500 italic mt-1">
            Upload an image or run benchmark test samples to inspect EXIF software markers, Error Level Analysis (ELA) compression maps, and CLIP-ViT logits.
          </p>
        </div>

        {/* Upload & Preset Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          
          {/* File Upload Box */}
          <label className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 p-6 rounded-xl flex flex-col items-center justify-center cursor-pointer transition text-center group">
            <Upload className="w-8 h-8 text-slate-400 group-hover:text-blue-600 mb-2 transition" />
            <span className="text-xs font-bold text-slate-800 group-hover:text-blue-600">
              Click to Upload Image for Inspection
            </span>
            <span className="text-[11px] text-slate-500 mt-1">Supports JPG, PNG, WEBP up to 20MB</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Preset Samples */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Or Test Preloaded Benchmark Samples:</span>
            <div className="space-y-2">
              {PRESET_IMAGES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => {
                    setImageName(sample.filename);
                    handleAnalyzeImage(sample.id, undefined, sample.filename);
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 transition flex items-center justify-between text-xs text-slate-700"
                >
                  <div>
                    <span className="font-bold block text-slate-900">{sample.title}</span>
                    <span className="text-[10px] text-slate-500">{sample.source}</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wide">Test Sample</span>
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
          <p className="text-sm font-bold text-slate-800">Running CLIP-ViT Spatial & Error Level Analysis Forensics...</p>
        </div>
      )}

      {/* Report Result */}
      {report && !loading && (
        <div className="space-y-6">
          
          {/* Main Verdict Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs text-slate-400 font-mono font-bold">Filename: {report.filename}</span>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
                  Forensic Image Analysis Verdict
                </h2>
              </div>

              {/* Verdict Badge */}
              <div className={`px-4 py-2.5 rounded-lg border flex items-center gap-3 shrink-0 ${
                report.verdict === 'AI_GENERATED'
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {report.verdict === 'AI_GENERATED' ? (
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                ) : (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                )}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide block">
                    {report.verdict === 'AI_GENERATED' ? 'AI GENERATED / SYNTHETIC' : 'AUTHENTIC REAL PHOTO'}
                  </span>
                  <span className="text-[11px] font-medium">
                    Model Logit Output: {(report.modelOutputLogit * 100).toFixed(1)}% AI Probability
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* EXIF Metadata Card */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <ImageIcon className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    EXIF Hardware & Software Audit
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Camera Make</span>
                    <span className="font-bold text-slate-800">{report.exifData.cameraMake || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Camera Model</span>
                    <span className="font-bold text-slate-800">{report.exifData.cameraModel || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">Software Signature</span>
                    <span className="font-bold text-blue-600">{report.exifData.software || 'N/A'}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded border border-slate-200">
                    <span className="text-slate-400 font-bold uppercase text-[10px] block">DateTime Tag</span>
                    <span className="font-bold text-slate-800">{report.exifData.dateTimeOriginal || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 text-[11px] font-bold uppercase tracking-wider block">Metadata Findings:</span>
                  {report.exifData.anomalies.map((anomaly, idx) => (
                    <p key={idx} className="text-[11px] text-slate-700 bg-white p-2 rounded border border-slate-200">
                      • {anomaly}
                    </p>
                  ))}
                </div>
              </div>

              {/* Error Level Analysis (ELA) Card */}
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Error Level Analysis (ELA) Compression Map
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.elaAnalysis.description}
                </p>

                {/* ELA Noise Variance */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 font-bold">
                    <span>JPEG Frequency Noise Variance:</span>
                    <span className="font-bold text-blue-600">{Math.round(report.elaAnalysis.compressionVariance * 100)}%</span>
                  </div>

                  {/* Noise bar */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className={`h-full transition-all ${
                        report.elaAnalysis.compressionVariance > 0.5
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${report.elaAnalysis.compressionVariance * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Detected Visual Anomalies */}
            <div className="space-y-3">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Visual Spatial Anomalies & Artifact Flags
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {report.visualAnomaliesDetected.map((anomaly, idx) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-1">
                    <span className="text-[10px] text-blue-600 font-bold block uppercase tracking-wider">Signal #{idx + 1}</span>
                    <p className="text-slate-700 font-medium">{anomaly}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Traceability Footer */}
            <div className="bg-slate-100 border border-slate-200 rounded-xl p-4 text-xs font-mono text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-600" />
                <span>Primary Detector: {report.traceability.primaryModel}</span>
              </div>
              <div>
                <span>Training: {report.traceability.trainingData}</span>
              </div>
              <div>
                <span>License: {report.traceability.license}</span>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
