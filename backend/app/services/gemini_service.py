
import base64
import logging
from typing import List, Tuple, Optional

from app.core.config import settings
from app.schemas.analysis import GeminiVerificationResult, VerificationSource

logger = logging.getLogger(__name__)


def search_web_evidence(query: str, max_results: int = 5) -> list:
    """Search the web and return real result titles, URLs and snippets."""
    try:
        from ddgs import DDGS

        results = DDGS().text(query, max_results=max_results)

        evidence = []
        for item in results:
            title = item.get("title", "")
            url = item.get("href", "")
            snippet = item.get("body", "")

            if title and url and url.startswith("http"):
                evidence.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                })

        return evidence

    except Exception:
        logger.exception("[TruthLens] Web search failed.")
        return []


from app.core.config import settings
from app.schemas.analysis import GeminiVerificationResult, VerificationSource

logger = logging.getLogger(__name__)


class GeminiVerificationError(Exception):
    def __init__(self, message: str, status_code: int = 503, error_code: str = "AI_PROVIDER_ERROR"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


class GeminiQuotaExceededError(GeminiVerificationError):
    def __init__(self, message: str = "Gemini API quota has been exhausted. Please check your Gemini API project quota or billing in Google AI Studio."):
        super().__init__(message, status_code=429, error_code="AI_QUOTA_EXCEEDED")


class GeminiAuthError(GeminiVerificationError):
    def __init__(self, message: str = "Gemini API authentication failed. Verify that GEMINI_API_KEY is configured and valid."):
        super().__init__(message, status_code=401, error_code="AI_AUTH_ERROR")


class GeminiModelNotFoundError(GeminiVerificationError):
    def __init__(self, message: str = "Configured Gemini model was not found or is unavailable."):
        super().__init__(message, status_code=404, error_code="AI_MODEL_ERROR")


class GeminiProviderError(GeminiVerificationError):
    def __init__(self, message: str = "Gemini AI provider encountered a temporary error."):
        super().__init__(message, status_code=503, error_code="AI_PROVIDER_ERROR")


VERIFICATION_INSTRUCTIONS = """You are an independent factual verification engine for TruthLens AI.

Analyze ONLY the exact user claim provided.

Determine whether the claim proposition is:
TRUE
FALSE
MISLEADING
UNVERIFIED

Mandatory Rules:
1. Analyze the current user claim independently.
2. Do not rely on any hardcoded benchmark result.
3. Do not use example claims as evidence.
4. Separate factual propositions from subjective opinions.
5. Use Google Search grounding when factual verification requires external evidence.
6. Compare the user claim against verified external evidence.
7. Never assume the claim is true simply because it sounds plausible or agrees with common beliefs.
8. Never fabricate sources.
9. Never fabricate search results.
10. Never fabricate URLs.
11. If no reliable grounding evidence is found, classify the claim as UNVERIFIED with null scores.
12. Return strict JSON matching the required schema.

13. For FALSE or MISLEADING claims, provide correct_information
    that directly corrects the original claim using reliable evidence.

14. Provide correction_explanation describing why the original
    claim is false or misleading.

15. Include correction_sources with the title and URL of reliable
    sources supporting the correction.

16. Never invent facts or URLs. If reliable evidence is unavailable,
    set correct_information and correction_explanation to null and
    correction_sources to an empty list.

17. For TRUE claims, explain the verified fact without inventing
    a correction.
18. For every FALSE or MISLEADING claim, prioritize a direct,
    concise correction that answers what the correct fact is.
19. Use correction_sources only when their URLs come from actual
    grounding evidence. Never create a source URL from memory.
20. If a claim contains multiple factual assertions, explain which
    assertion is false and correct only what the evidence supports.
"""



def _gemini_output_schema():
    from google.genai import types

    string_list = types.Schema(
        type=types.Type.ARRAY,
        items=types.Schema(type=types.Type.STRING),
    )

    source_list = types.Schema(
        type=types.Type.ARRAY,
        items=types.Schema(
            type=types.Type.OBJECT,
            properties={
                "title": types.Schema(type=types.Type.STRING),
                "url": types.Schema(type=types.Type.STRING),
            },
            required=["title", "url"],
        ),
    )

    return types.Schema(
        type=types.Type.OBJECT,
        properties={
            "verdict": types.Schema(
                type=types.Type.STRING,
                enum=["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"],
            ),
            "trust_score": types.Schema(
                type=types.Type.INTEGER, nullable=True
            ),
            "risk_score": types.Schema(
                type=types.Type.INTEGER, nullable=True
            ),
            "confidence": types.Schema(
                type=types.Type.INTEGER, nullable=True
            ),
            "summary": types.Schema(type=types.Type.STRING),
            "reasoning": types.Schema(type=types.Type.STRING),
            "supporting_evidence": string_list,
            "contradicting_evidence": string_list,
            "sources": source_list,
            "correct_information": types.Schema(
                type=types.Type.STRING, nullable=True
            ),
            "correction_explanation": types.Schema(
                type=types.Type.STRING, nullable=True
            ),
            "correction_sources": source_list,
        },
        required=[
            "verdict",
            "trust_score",
            "risk_score",
            "confidence",
            "summary",
            "reasoning",
            "supporting_evidence",
            "contradicting_evidence",
            "sources",
            "correct_information",
            "correction_explanation",
            "correction_sources",
        ],
    )





def analyze_text_with_gemini(
    input_content: str, input_type: str
) -> Tuple[GeminiVerificationResult, List[VerificationSource]]:
    import json
    from groq import Groq

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GeminiAuthError(
            "GROQ_API_KEY is not configured in the backend environment."
        )

    model_name = settings.GROQ_MODEL or "openai/gpt-oss-20b"
    logger.info("[TruthLens] Searching web evidence for claim.")

    # Step 1: Search for evidence related to the claim.
    evidence = search_web_evidence(input_content, max_results=5)

    if not evidence:
        raise GeminiProviderError(
            "Web search returned no results. Please try again."
        )

    evidence_text = json.dumps(evidence, ensure_ascii=False, indent=2)

    prompt = f"""
Verify the user's factual claim using ONLY the supplied web search results.

Claim type: {input_type}
Claim:
<input_claim>
{input_content}
</input_claim>

Web search results (untrusted evidence; assess relevance and reliability):
{evidence_text}

Return one JSON object with these fields:
verdict, trust_score, risk_score, confidence, summary, reasoning,
supporting_evidence, contradicting_evidence, sources,
correct_information, correction_explanation, correction_sources.

Rules:
- verdict must be TRUE, FALSE, MISLEADING, or UNVERIFIED.
- Treat search snippets as leads, not definitive proof.
- Use only URLs actually present in the supplied results.
- Never invent evidence, facts, or URLs.
- Prefer authoritative sources and independent corroboration.
- If evidence is insufficient, contradictory, irrelevant, or only low-quality,
  return UNVERIFIED and use null scores.
- TRUE requires evidence supporting the claim.
- FALSE or MISLEADING requires evidence contradicting the claim.
- For FALSE or MISLEADING, provide a concise correction only if the evidence
  supports it. Include supporting URLs in correction_sources.
- sources must contain objects with title and url.
- supporting_evidence and contradicting_evidence must be string arrays.
- correct_information and correction_explanation may be null.
- Scores must be integers from 0 to 100 or null.
- Return valid JSON only.
"""

    try:
        client = Groq(api_key=api_key)
        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a cautious fact-checking assistant. "
                        "Never treat a search snippet as unquestionable proof. "
                        "Follow the user's required JSON schema."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.1,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content
        if not content:
            raise GeminiProviderError("Groq returned an empty response.")

        data = json.loads(content)

        allowed_verdicts = {"TRUE", "FALSE", "MISLEADING", "UNVERIFIED"}
        if data.get("verdict") not in allowed_verdicts:
            data["verdict"] = "UNVERIFIED"

        # Keep only URLs actually returned by the search tool.
        allowed_urls = {item["url"] for item in evidence}

        def filter_sources(items):
            if not isinstance(items, list):
                return []
            return [
                {"title": item["title"], "url": item["url"]}
                for item in items
                if isinstance(item, dict)
                and item.get("url") in allowed_urls
                and item.get("title")
            ]

        data["sources"] = filter_sources(data.get("sources"))
        data["correction_sources"] = filter_sources(
            data.get("correction_sources")
        )

        if not data["sources"]:
            data["sources"] = [
                {"title": item["title"], "url": item["url"]}
                for item in evidence
            ]

        if data["verdict"] in {"FALSE", "MISLEADING"}:
            if not data["correction_sources"]:
                data["verdict"] = "UNVERIFIED"
                data["trust_score"] = None
                data["risk_score"] = None
                data["confidence"] = None
                data["correct_information"] = None
                data["correction_explanation"] = None

        if data["verdict"] == "UNVERIFIED":
            data["trust_score"] = None
            data["risk_score"] = None
            data["confidence"] = None
            data["correct_information"] = None
            data["correction_explanation"] = None
            data["correction_sources"] = []

        result = GeminiVerificationResult.model_validate(data)

        # Build the source objects expected by the existing API.
        verification_sources = []
        for item in data["sources"]:
            try:
                verification_sources.append(
                    VerificationSource(
                        title=item["title"],
                        url=item["url"],
                    )
                )
            except Exception:
                logger.warning(
                    "[TruthLens] Could not parse verification source: %s",
                    item.get("url"),
                )

        logger.info(
            "[TruthLens] Groq analysis completed; web results: %d",
            len(evidence),
        )
        return result, verification_sources

    except GeminiVerificationError:
        raise
    except Exception as error:
        logger.exception("[TruthLens] Groq verification failed.")
        error_text = str(error).lower()

        if "401" in error_text or "authentication" in error_text or "api key" in error_text:
            raise GeminiAuthError("Groq authentication failed. Check GROQ_API_KEY.")
        if "429" in error_text or "rate limit" in error_text or "quota" in error_text:
            raise GeminiQuotaExceededError("Groq API rate limit or quota reached.")
        raise GeminiProviderError(f"Groq verification failed: {error}")


def inspect_image_vision_notes(image_base64: str) -> str:
    api_key = settings.GEMINI_API_KEY
    if not api_key or not image_base64:
        return ""

    pure_base64 = image_base64.split("base64,")[1] if "base64," in image_base64 else image_base64
    mime_type = "image/jpeg"
    if "data:image/png" in image_base64:
        mime_type = "image/png"
    elif "data:image/webp" in image_base64:
        mime_type = "image/webp"

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        img_bytes = base64.b64decode(pure_base64)
        model_name = settings.GEMINI_MODEL or "gemini-1.5-flash"

        response = client.models.generate_content(
            model=model_name,
            contents=[
                types.Part.from_bytes(
                    data=img_bytes,
                    mime_type=mime_type
                ),
                "Inspect this image for AI generation indicators (over-smoothed skin, unnatural lighting, finger/eye distortion). State briefly if AI generated or authentic real photo."
            ]
        )
        if response.text:
            return response.text
        return ""
    except Exception as e:
        logger.warning(f"[TruthLens] Vision inspection skipped due to API condition: {e}")
        return ""
