
import logging
import time
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.schemas.analysis import (
    ImageAnalysisRequest,
    TextUrlAnalysisRequest,
    TextUrlAnalysisResponse,
    TextUrlAnalysisUnavailable,
    VerificationSource,
)
from app.services.forensics import analyze_image_forensics
from app.services.gemini_service import (
    GeminiVerificationError,
    analyze_text_with_gemini,
    inspect_image_vision_notes,
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze/text-url")
def analyze_text_url(payload: TextUrlAnalysisRequest):
    start_time = time.time()
    text = payload.inputContent

    if not text or not text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="inputContent is required and must be a string",
        )

    logger.info("[TruthLens] Received claim for analysis: %s", text[:80])

    content_str = text.strip()
    is_url = (
        payload.inputType == "URL"
        or content_str.startswith("http://")
        or content_str.startswith("https://")
        or ("." in content_str and " " not in content_str)
    )

    input_type_label = "URL" if is_url else "CLAIM"
    grounding_sources = []

    try:
        verification, grounding_sources = analyze_text_with_gemini(
            text, input_type_label
        )
    except GeminiVerificationError as err:
        logger.warning(
            "[TruthLens] Verification error (%s): %s",
            err.error_code,
            err.message,
        )
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content=TextUrlAnalysisUnavailable().model_dump(exclude_none=False),
        )

    verdict_titles = {
        "TRUE": "TRUE - SUPPORTED BY EVIDENCE",
        "FALSE": "FALSE - CONTRADICTED BY EVIDENCE",
        "MISLEADING": "MISLEADING",
        "UNVERIFIED": "UNVERIFIED",
    }

    risk_levels = {
        "TRUE": "LOW_RISK",
        "FALSE": "HIGH_RISK",
        "MISLEADING": "MODERATE_RISK",
        "UNVERIFIED": "INCONCLUSIVE",
    }

    result = TextUrlAnalysisResponse.model_validate(
        {
            "success": True,
            "status": "OK",
            "id": f"report-{int(time.time() * 1000)}",
            "timestamp": datetime.now(timezone.utc)
            .isoformat()
            .replace("+00:00", "Z"),
            "inputType": input_type_label,
            "inputContent": text,
            "verdict": verification.verdict,
            "trust_score": verification.trust_score,
            "risk_score": verification.risk_score,
            "confidence": verification.confidence,
            "summary": verification.summary,
            "reasoning": verification.reasoning,
            "supporting_evidence": verification.supporting_evidence,
            "contradicting_evidence": verification.contradicting_evidence,
            "sources": grounding_sources,
            "correct_information": verification.correct_information,
            "correction_explanation": verification.correction_explanation,
            "correction_sources": verification.correction_sources,
            "verdictTitle": verdict_titles.get(verification.verdict, "UNVERIFIED"),
            "verdictSummary": verification.summary,
            "riskLevel": risk_levels.get(verification.verdict, "INCONCLUSIVE"),
            "overallScore": verification.risk_score,
            "traceability": {
                "modelUsed": settings.GROQ_MODEL or settings.GEMINI_MODEL,
                "executionTimeMs": int(
                    (time.time() - start_time) * 1000
                ),
                "searchGroundingActive": bool(grounding_sources),
            },
        }
    ).model_dump()

    logger.info("[TruthLens] Analysis completed with verdict: %s", verification.verdict)
    return result


@router.post("/analyze/image")
def analyze_image(payload: ImageAnalysisRequest):
    result = analyze_image_forensics(
        image_base64=payload.imageBase64,
        sample_id=payload.sampleId,
        image_name=payload.imageName,
    )

    if payload.imageBase64:
        vision_notes = inspect_image_vision_notes(payload.imageBase64)

        if vision_notes and result.get("visualAnomaliesDetected"):
            result["visualAnomaliesDetected"].append(
                f"Gemini Vision Note: {vision_notes}"
            )

    result["id"] = f"img-report-{int(time.time() * 1000)}"
    result["timestamp"] = datetime.now(timezone.utc).isoformat().replace(
        "+00:00", "Z"
    )
    return result


@router.get("/history")
def get_history():
    return [
        {
            "id": "job-101",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inputType": "URL",
            "inputSummary": (
                "https://nasa.gov/news/webb-telescope-exoplanet-water"
            ),
            "verdict": "Real News Report",
            "trustScore": 95,
            "riskScore": 5,
            "confidence": "HIGH_CONFIDENCE",
            "isDemo": True,
        },
        {
            "id": "job-102",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inputType": "CLAIM",
            "inputSummary": (
                "SHOCKING SECRET: Miracle herb cures overnight!"
            ),
            "verdict": "Fake News / Misleading",
            "trustScore": 15,
            "riskScore": 85,
            "confidence": "HIGH_CONFIDENCE",
            "isDemo": True,
        },
        {
            "id": "job-103",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "inputType": "IMAGE",
            "inputSummary": "Midjourney v6 AI Diffusion Portrait",
            "verdict": "AI-Generated Image",
            "trustScore": 10,
            "riskScore": 90,
            "confidence": "HIGH_CONFIDENCE",
            "isDemo": True,
        },
    ]
