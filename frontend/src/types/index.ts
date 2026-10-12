export type RiskLevel = 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' | 'INCONCLUSIVE';

export interface GroundingSource {
  title: string;
  url: string;
  snippet?: string;
  publisher?: string;
}

export interface FactCheckReport {
  success: true;
  status: 'OK';
  id: string;
  timestamp: string;
  inputType: 'URL' | 'TEXT' | 'CLAIM';
  inputContent: string;
  verdict: 'TRUE' | 'FALSE' | 'MISLEADING' | 'UNVERIFIED';
  trust_score: number | null;
  risk_score: number | null;
  confidence: number | null;
  summary: string;
  reasoning: string;
  supporting_evidence: string[];
  contradicting_evidence: string[];
  sources: GroundingSource[];
  verdictTitle: string;
  verdictSummary: string;
  riskLevel: RiskLevel;
  overallScore: number | null;
  traceability: {
    modelUsed: string;
    executionTimeMs: number;
    searchGroundingActive: boolean;
  };
}

export interface ImageForensicResult {
  id: string;
  timestamp: string;
  filename: string;
  imageUrl?: string;
  verdict: 'AI_GENERATED' | 'DIGITALLY_MANIPULATED' | 'LIKELY_REAL' | 'INCONCLUSIVE';
  confidenceBand: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_CONFIDENCE';
  modelOutputLogit: number; // e.g. 0.88 AI probability from CLIP-ViT
  exifData: {
    cameraMake?: string;
    cameraModel?: string;
    software?: string;
    dateTimeOriginal?: string;
    hasExif: boolean;
    anomalies: string[];
  };
  elaAnalysis: {
    compressionVariance: number;
    manipulatedRegionsDetected: boolean;
    description: string;
  };
  visualAnomaliesDetected: string[];
  webGroundingMatches: {
    title: string;
    url: string;
    similarity: string;
  }[];
  traceability: {
    primaryModel: string;
    trainingData: string;
    license: string;
  };
}

export interface AudioForensicResult {
  id: string;
  timestamp: string;
  filename: string;
  durationSeconds: number;
  verdict: 'SYNTHETIC_VOICE' | 'CLONED_AUDIO' | 'AUTHENTIC_HUMAN' | 'INCONCLUSIVE';
  confidenceBand: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_CONFIDENCE';
  wav2vecLogit: number;
  metrics: {
    spectralContinuityScore: number;
    pitchVariance: number;
    breathMarkerPresence: boolean;
    roboticArtifactScore: number;
  };
  signals: string[];
  traceability: {
    modelName: string;
    dataset: string;
  };
}

export interface VideoForensicResult {
  id: string;
  timestamp: string;
  filename: string;
  durationSeconds: number;
  verdict: 'DEEPFAKE_VIDEO' | 'FACE_SWAPPED' | 'AUTHENTIC_VIDEO' | 'INCONCLUSIVE';
  confidenceBand: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_CONFIDENCE';
  frameAnalysisCount: number;
  manipulatedFramesRatio: number; // e.g. 0.42
  detectedAnomalies: string[];
  spatialFlickerScore: number;
  temporalConsistencyScore: number;
  traceability: {
    spatialModel: string;
    temporalEngine: string;
  };
}

export interface ModelMetadataInfo {
  id: string;
  name: string;
  type: string;
  datasets: string;
  benchmark: string;
  license: string;
  limitations: string;
}

export interface PdfScreenshotResult {
  id: string;
  timestamp: string;
  filename: string;
  inputType: 'PDF' | 'SCREENSHOT';
  ocrExtractedText: string;
  extractedClaims: string[];
  detectedEntities: string[];
  verdict: 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' | 'INCONCLUSIVE';
  trustScore: number;
  riskScore: number;
  confidenceBand: 'HIGH_CONFIDENCE' | 'MODERATE_CONFIDENCE' | 'LOW_CONFIDENCE';
  manipulatedRegionsDetected: boolean;
  visualAnomalies: string[];
  evidenceMatches: GroundingSource[];
  isDemo?: boolean;
}

export interface SourceMatrixItem {
  id: string;
  publisher: string;
  domain: string;
  position: 'SUPPORTS' | 'CONTRADICTS' | 'NEUTRAL' | 'UNVERIFIED';
  credibilityScore: number; // 0 to 100
  evidenceQuality: 'HIGH' | 'MEDIUM' | 'LOW';
  headline: string;
  url: string;
  publicationDate?: string;
  recommendation: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface AdminAnalytics {
  totalUsers: number;
  totalAnalyses: number;
  highRiskCount: number;
  averageTrustScore: number;
  activeJobs: number;
  failedJobs: number;
  contentTypeDistribution: { name: string; count: number }[];
  riskDistribution: { name: string; count: number }[];
}

export interface AuditLogItem {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  timestamp: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  details: string;
}

export interface AnalysisHistoryItem {
  id: string;
  timestamp: string;
  inputType: 'TEXT' | 'URL' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF' | 'SCREENSHOT';
  inputSummary: string;
  verdict: string;
  trustScore: number;
  riskScore: number;
  confidence: string;
  isDemo?: boolean;
}
