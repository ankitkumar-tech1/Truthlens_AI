import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, RefreshCw, Layers, Camera } from 'lucide-react';
import { ImageForensicResult } from '../types';
import { analyzeImage } from '../services/api';

interface ImageAnalyzerProps {
  onReportGenerated: (report: ImageForensicResult) => void;
}

const SAMPLE_IMAGES = [
  {
    name: '📸 Canon EOS R5 Authentic Press Photo (Real)',
    sampleId: 'img-2',
    previewUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=800&auto=format&fit=crop',
  },
  {
    name: '🤖 Midjourney v6 AI Diffusion Portrait (AI-Generated)',
    sampleId: 'img-1',
    previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop',
  },
];

export const ImageAnalyzer: React.FC<ImageAnalyzerProps> = ({ onReportGenerated }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [sampleId, setSampleId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImageForensicResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG, WEBP).');
      return;
    }

    setError(null);
    setImageName(file.name);
    setSampleId(undefined);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setReport(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectSample = (sample: typeof SAMPLE_IMAGES[0]) => {
    setError(null);
    setImageName(sample.name);
    setSelectedImage(sample.previewUrl);
    setSampleId(sample.sampleId);
    setReport(null);
  };

  const handleAnalyze = async () => {
    if (!selectedImage) {
      setError('Please upload an image or select a sample image first.');
      return;
    }

    setError(null);
    setLoading(true);
    setReport(null);

    try {
      const data = await analyzeImage(
        selectedImage.startsWith('data:') ? selectedImage : undefined,
        sampleId,
        imageName || 'uploaded_image.jpg'
      );
      data.imageUrl = selectedImage;
      setReport(data);
      onReportGenerated(data);
    } catch (err: any) {
      console.error('Image analysis error:', err);
      setError(err.message || 'Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = () => {
    if (!report) return null;
    const isSynthetic = report.verdict === 'AI_GENERATED';

    if (isSynthetic) {
      return {
        label: 'AI-GENERATED / SYNTHETIC IMAGE',
        bgColor: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
        icon: ShieldAlert,
        desc: 'Diffusion network visual features & Error Level Analysis (ELA) anomalies detected.',
      };
    } else {
      return {
        label: 'AUTHENTIC REAL PHOTO',
        bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        icon: CheckCircle2,
        desc: 'Consistent EXIF sensor metadata and uniform compression grid.',
      };
    }
  };

  const verdict = getVerdictBadge();

  return (
    <div className="space-y-8">
      {/* Upload Container */}
      <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl relative overflow-hidden transition-colors duration-300">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl -z-10" />

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center space-x-3">
            <ImageIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            <span>Upload Image for AI & Deepfake Inspection</span>
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Upload any photo or image to check if it is **Authentic Camera Capture** or **AI-Generated / Synthetic Media**.
          </p>
        </div>

        {/* File Dropzone & Preview */}
        <div className="space-y-6">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-purple-500/60 bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-950/90 rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all group"
            >
              <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 flex items-center justify-center mx-auto mb-4 border border-purple-500/20 transition-all">
                <Upload className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                Click or Drag & Drop Image Here
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
                Supports JPEG, PNG, WEBP up to 25MB
              </p>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-64 h-48 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shrink-0 relative group">
                <img
                  src={selectedImage}
                  alt="Uploaded Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-3 w-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Image Selected</span>
                  <button
                    onClick={() => {
                      setSelectedImage(null);
                      setReport(null);
                    }}
                    className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                  >
                    Change Image
                  </button>
                </div>
                <h4 className="text-slate-800 dark:text-slate-200 text-sm font-medium truncate">{imageName || 'Selected Image'}</h4>
                
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    Format: <span className="text-slate-900 dark:text-white font-medium">JPEG / PNG</span>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                    Forensic Check: <span className="text-slate-900 dark:text-white font-medium">CLIP-ViT + ELA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sample Preset Images */}
          <div>
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
              Or Try Preset Sample Images:
            </span>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_IMAGES.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectSample(sample)}
                  className="bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 hover:border-purple-500/40 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1.5 cursor-pointer"
                >
                  <span>{sample.name}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !selectedImage}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-semibold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-950/20 dark:shadow-purple-950/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running Gemini Vision & CLIP-ViT Forensics...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze Image Authenticity</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Forensic Report View */}
      {report && verdict && (
        <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl dark:shadow-2xl backdrop-blur-xl space-y-6 transition-colors duration-300">
          {/* Verdict Banner */}
          <div className={`p-5 rounded-xl border ${verdict.bgColor} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4`}>
            <div className="flex items-center space-x-3">
              <verdict.icon className="w-8 h-8 shrink-0" />
              <div>
                <h3 className="text-xl font-extrabold tracking-wide uppercase">{verdict.label}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{verdict.desc}</p>
              </div>
            </div>

            <div className="bg-slate-100 dark:bg-slate-950/60 px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-right">
              <div className="text-[10px] uppercase text-slate-500 dark:text-slate-400 font-bold">AI Probability Logit</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {(report.modelOutputLogit * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* ELA Compression & EXIF Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ELA Compression */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <Layers className="w-4 h-4" />
                <span>Error Level Analysis (ELA) Variance</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{report.elaAnalysis.description}</p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Compression Variance Score: <span className="text-slate-900 dark:text-white font-semibold">{(report.elaAnalysis.compressionVariance * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* EXIF Metadata */}
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                <Camera className="w-4 h-4" />
                <span>EXIF Camera Tags Inspection</span>
              </div>
              <div className="text-xs text-slate-700 dark:text-slate-300 space-y-1">
                <div>Camera Make: <span className="text-slate-900 dark:text-white font-medium">{report.exifData.cameraMake}</span></div>
                <div>Software Tag: <span className="text-slate-900 dark:text-white font-medium">{report.exifData.software}</span></div>
              </div>
            </div>
          </div>

          {/* Visual Anomalies List */}
          {report.visualAnomaliesDetected && report.visualAnomaliesDetected.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Visual Anomaly Signals Detected</h4>
              <ul className="space-y-2">
                {report.visualAnomaliesDetected.map((item, idx) => (
                  <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400 shrink-0 mt-1.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
