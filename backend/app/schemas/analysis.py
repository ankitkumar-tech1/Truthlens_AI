from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any, Literal

VerificationVerdict = Literal["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"]


class TextUrlAnalysisRequest(BaseModel):
    inputContent: str
    inputType: Optional[str] = None


class VerificationSource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str
    url: str


class GeminiVerificationResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    verdict: VerificationVerdict
    trust_score: Optional[int] = Field(ge=0, le=100)
    risk_score: Optional[int] = Field(ge=0, le=100)
    confidence: Optional[int] = Field(ge=0, le=100)
    summary: str
    reasoning: str
    supporting_evidence: List[str]
    contradicting_evidence: List[str]
    sources: List[VerificationSource]
    correct_information: Optional[str] = None
    correction_explanation: Optional[str] = None
    correction_sources: List[VerificationSource] = Field(default_factory=list)


class TextUrlAnalysisResponse(BaseModel):
    success: Literal[True]
    status: Literal["OK"]
    id: str
    timestamp: str
    inputType: str
    inputContent: str
    verdict: VerificationVerdict
    trust_score: Optional[int]
    risk_score: Optional[int]
    confidence: Optional[int]
    summary: str
    reasoning: str
    supporting_evidence: List[str]
    contradicting_evidence: List[str]
    sources: List[VerificationSource]
    correct_information: Optional[str] = None
    correction_explanation: Optional[str] = None
    correction_sources: List[VerificationSource] = Field(default_factory=list)
    verdictTitle: str
    verdictSummary: str
    riskLevel: str
    overallScore: Optional[int]
    traceability: Dict[str, Any]


class TextUrlAnalysisUnavailable(BaseModel):
    success: Literal[False] = False
    status: str = "AI_UNAVAILABLE"
    message: str = "AI verification is temporarily unavailable."
    verdict: Literal["UNVERIFIED"] = "UNVERIFIED"
    trust_score: None = None
    risk_score: None = None
    confidence: None = None
    sources: List[VerificationSource] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    contradicting_evidence: List[str] = Field(default_factory=list)
    
    correct_information: None = None
    correction_explanation: None = None
    correction_sources: List[VerificationSource] = Field(
        default_factory=list
    )



class ImageAnalysisRequest(BaseModel):
    imageBase64: Optional[str] = None
    sampleId: Optional[str] = None
    imageName: Optional[str] = None

class ExifData(BaseModel):
    cameraMake: Optional[str] = None
    cameraModel: Optional[str] = None
    software: Optional[str] = None
    dateTimeOriginal: Optional[str] = None
    hasExif: bool
    anomalies: List[str]

class ElaAnalysis(BaseModel):
    compressionVariance: float
    manipulatedRegionsDetected: bool
    description: str

class ImageTraceability(BaseModel):
    primaryModel: str
    trainingData: str
    license: str

class ImageForensicResult(BaseModel):
    id: str
    timestamp: str
    filename: str
    verdict: Literal["AI_GENERATED", "LIKELY_REAL", "DIGITALLY_MANIPULATED", "INCONCLUSIVE"]
    confidenceBand: str
    modelOutputLogit: float
    exifData: ExifData
    elaAnalysis: ElaAnalysis
    visualAnomaliesDetected: List[str]
    webGroundingMatches: List[Dict[str, Any]]
    traceability: ImageTraceability

class HealthResponse(BaseModel):
    status: str
    backend: str
    gemini_configured: bool
    gemini_model: str
    timestamp: str
