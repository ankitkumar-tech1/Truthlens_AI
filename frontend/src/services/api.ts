import { FactCheckReport, ImageForensicResult, AnalysisHistoryItem } from '../types';

export class AnalysisApiError extends Error {
  status: string;
  statusCode: number;

  constructor(message: string, status: string = 'AI_UNAVAILABLE', statusCode: number = 503) {
    super(message);
    this.name = 'AnalysisApiError';
    this.status = status;
    this.statusCode = statusCode;
  }
}

export async function analyzeTextUrl(inputContent: string, inputType?: string): Promise<FactCheckReport> {
  console.log('[TruthLens] User claim:', inputContent);
  const response = await fetch('/api/analyze/text-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      inputContent,
      inputType,
    }),
  });

  const data: any = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || `Server returned HTTP ${response.status}`;
    const statusStr = data?.status || 'AI_UNAVAILABLE';
    throw new AnalysisApiError(errorMsg, statusStr, response.status);
  }

  if (!data || typeof data !== 'object' || data.success !== true) {
    throw new AnalysisApiError('Verification temporarily unavailable', 'AI_UNAVAILABLE', 503);
  }

  return data as FactCheckReport;
}

export async function analyzeImage(
  imageBase64?: string,
  sampleId?: string,
  imageName?: string
): Promise<ImageForensicResult> {
  const response = await fetch('/api/analyze/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64,
      sampleId,
      imageName: imageName || 'uploaded_image.jpg',
    }),
  });

  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchAnalysisHistory(): Promise<AnalysisHistoryItem[]> {
  const response = await fetch('/api/history');
  if (!response.ok) {
    throw new Error(`Server returned HTTP ${response.status}`);
  }
  return response.json();
}
