
import base64
import json
import logging
import re
from typing import List, Tuple

from app.core.config import settings
from app.schemas.analysis import GeminiVerificationResult, VerificationSource

logger = logging.getLogger(__name__)


class GeminiVerificationError(Exception):
    def __init__(
        self,
        message: str,
        status_code: int = 503,
        error_code: str = "AI_PROVIDER_ERROR",
    ):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_code = error_code


class GeminiQuotaExceededError(GeminiVerificationError):
    def __init__(self, message: str = "Groq API rate limit or quota reached."):
        super().__init__(message, 429, "AI_QUOTA_EXCEEDED")


class GeminiAuthError(GeminiVerificationError):
    def __init__(self, message: str = "Groq API authentication failed."):
        super().__init__(message, 401, "AI_AUTH_ERROR")


class GeminiModelNotFoundError(GeminiVerificationError):
    def __init__(self, message: str = "Configured AI model was not found."):
        super().__init__(message, 404, "AI_MODEL_ERROR")


class GeminiProviderError(GeminiVerificationError):
    def __init__(self, message: str = "AI provider encountered an error."):
        super().__init__(message, 503, "AI_PROVIDER_ERROR")


def search_web_evidence(query: str, max_results: int = 5) -> list:
    """Search for real web results. Results must be treated as unverified leads."""
    try:
        from ddgs import DDGS

        results = DDGS().text(query, max_results=max_results)
        evidence = []

        for item in results:
            title = item.get("title", "")
            url = item.get("href", "")
            snippet = item.get("body", "")

            if (
                title
                and url
                and url.startswith("https://")
                and not any(
                    term in url.lower()
                    for term in (
                        "pornhub.com",
                        "xvideos.com",
                        "xnxx.com",
                    )
                )
            ):
                evidence.append(
                    {
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                    }
                )

        return evidence

    except Exception:
        logger.exception("[TruthLens] Web search failed.")
        return []


def _parse_json_response(content: str) -> dict:
    """Parse a JSON object even if the model wraps it in Markdown fences."""
    if not content:
        raise GeminiProviderError("Groq returned an empty response.")

    cleaned = content.strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*|\s*```$",
        "",
        cleaned,
        flags=re.IGNORECASE,
    ).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")

        if start < 0 or end <= start:
            raise GeminiProviderError(
                "Groq did not return a valid JSON object."
            )

        try:
            data = json.loads(cleaned[start : end + 1])
        except json.JSONDecodeError as error:
            logger.error(
                "[TruthLens] Invalid Groq JSON near position %s",
                error.pos,
            )
            raise GeminiProviderError(
                "Groq returned invalid JSON. Please try again."
            ) from error

    if not isinstance(data, dict):
        raise GeminiProviderError(
            "Groq response must be a JSON object."
        )

    return data


def analyze_text_with_gemini(
    input_content: str,
    input_type: str,
) -> Tuple[GeminiVerificationResult, List[VerificationSource]]:
    """Verify a claim using Groq and web-search evidence."""
    from groq import Groq

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GeminiAuthError(
            "GROQ_API_KEY is not configured in the backend environment."
        )

    model_name = settings.GROQ_MODEL or "openai/gpt-oss-20b"

    logger.info("[TruthLens] Searching web evidence for claim.")

    # Search the claim as written; search results are not automatically trusted.
    evidence = search_web_evidence(input_content, max_results=5)

    if not evidence:
        raise GeminiProviderError(
            "Web search returned no usable results. Please try again."
        )

    evidence_text = json.dumps(
        evidence,
        ensure_ascii=False,
        indent=2,
    )

    prompt = f"""
You are a cautious factual verification assistant for TruthLens AI.

Return ONLY one valid JSON object. Do not use Markdown fences.

Analyze this claim:
{input_content}

Claim type: {input_type}

Use ONLY these web search results as evidence:
{evidence_text}

Required JSON keys:
verdict, trust_score, risk_score, confidence, summary, reasoning,
supporting_evidence, contradicting_evidence, sources,
correct_information, correction_explanation, correction_sources.

Rules:
- verdict must be TRUE, FALSE, MISLEADING, or UNVERIFIED.
- Scores must be integers from 0 to 100, or null.
- supporting_evidence and contradicting_evidence must be arrays of strings.
- sources and correction_sources must be arrays of objects containing title and url.
- Use only URLs included in the supplied search results.
- Never invent facts, URLs, sources, or evidence.
- Treat snippets as leads, not definitive proof.
- Prefer reliable, relevant, authoritative evidence.
- Irrelevant results do not support or refute a claim.
- If evidence is irrelevant, weak, or insufficient, use UNVERIFIED,
  set all scores to null, and leave correction fields null or empty.
- TRUE requires relevant evidence supporting the claim.
- FALSE or MISLEADING requires relevant evidence contradicting the claim.
- For FALSE or MISLEADING, provide a correction only when the supplied
  evidence supports it. Include its actual supporting URLs in correction_sources.
- Every required key must be present.
- Use double quotes for JSON keys and string values.
- Return JSON only.
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
                        "Return one valid JSON object only. Never invent "
                        "evidence or URLs. Treat irrelevant search results "
                        "as no evidence."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )

        content = response.choices[0].message.content
        data = _parse_json_response(content)

        allowed_verdicts = {
            "TRUE",
            "FALSE",
            "MISLEADING",
            "UNVERIFIED",
        }

        if data.get("verdict") not in allowed_verdicts:
            data["verdict"] = "UNVERIFIED"

        # Keep only URLs returned by the search function.
        allowed_urls = {item["url"] for item in evidence}

        def filter_sources(items):
            if not isinstance(items, list):
                return []

            filtered = []
            for item in items:
                if not isinstance(item, dict):
                    continue

                title = item.get("title")
                url = item.get("url")

                if title and url in allowed_urls:
                    filtered.append({"title": title, "url": url})

            return filtered

        data["sources"] = filter_sources(data.get("sources"))
        data["correction_sources"] = filter_sources(
            data.get("correction_sources")
        )

        # Do not accept a verdict when none of the search results
        # has been selected as relevant by the model.
        if not data["sources"]:
            data["verdict"] = "UNVERIFIED"

        if data["verdict"] in {"FALSE", "MISLEADING"}:
            if not data["correction_sources"]:
                data["verdict"] = "UNVERIFIED"

        if data["verdict"] == "UNVERIFIED":
            data["trust_score"] = None
            data["risk_score"] = None
            data["confidence"] = None
            data["correct_information"] = None
            data["correction_explanation"] = None
            data["correction_sources"] = []

        # Normalize required fields before schema validation.
        for field in (
            "supporting_evidence",
            "contradicting_evidence",
        ):
            if not isinstance(data.get(field), list):
                data[field] = []

        for field in ("summary", "reasoning"):
            if not isinstance(data.get(field), str):
                data[field] = ""

        for field in ("trust_score", "risk_score", "confidence"):
            value = data.get(field)
            if value is not None and (
                not isinstance(value, int)
                or isinstance(value, bool)
                or not 0 <= value <= 100
            ):
                data[field] = None

        # Ensure a non-verified result cannot carry unsupported scores.
        if data["verdict"] == "UNVERIFIED":
            data["trust_score"] = None
            data["risk_score"] = None
            data["confidence"] = None

        result = GeminiVerificationResult.model_validate(data)

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
                    "[TruthLens] Could not parse source: %s",
                    item.get("url"),
                )

        logger.info(
            "[TruthLens] Groq analysis completed; search results: %d",
            len(evidence),
        )

        return result, verification_sources

    except GeminiVerificationError:
        raise

    except Exception as error:
        logger.exception("[TruthLens] Groq verification failed.")

        # Log provider response details when the SDK exposes them.
        if hasattr(error, "body"):
            logger.error("[TruthLens] Groq error body: %s", error.body)

        if hasattr(error, "response"):
            logger.error(
                "[TruthLens] Groq error response: %s",
                error.response,
            )

        error_text = str(error).lower()

        if (
            "401" in error_text
            or "authentication" in error_text
            or "api key" in error_text
        ):
            raise GeminiAuthError(
                "Groq authentication failed. Check GROQ_API_KEY."
            ) from error

        if (
            "429" in error_text
            or "rate limit" in error_text
            or "quota" in error_text
        ):
            raise GeminiQuotaExceededError(
                "Groq API rate limit or quota reached."
            ) from error

        if "model_not_found" in error_text or "404" in error_text:
            raise GeminiModelNotFoundError(
                f"Groq model is unavailable: {model_name}"
            ) from error

        raise GeminiProviderError(
            f"Groq verification failed: {error}"
        ) from error


def inspect_image_vision_notes(image_base64: str) -> str:
    """Inspect an image with Gemini; this feature still requires a Gemini key."""
    api_key = settings.GEMINI_API_KEY

    if not api_key or not image_base64:
        return ""

    pure_base64 = (
        image_base64.split("base64,", 1)[1]
        if "base64," in image_base64
        else image_base64
    )

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
                    mime_type=mime_type,
                ),
                (
                    "Inspect this image for visual indicators of AI generation, "
                    "such as unnatural lighting, inconsistent details, or "
                    "distortions. Explain briefly that visual inspection alone "
                    "cannot establish authenticity with certainty."
                ),
            ],
        )

        return response.text or ""

    except Exception as error:
        logger.warning(
            "[TruthLens] Vision inspection skipped: %s",
            error,
        )
        return ""
