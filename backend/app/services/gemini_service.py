import base64
import json
import logging
import re
import threading
import time
from typing import Any, Dict, List, Optional, Set, Tuple
from urllib.parse import urlsplit, urlunsplit

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


# --- Domain Authority Configurations ---
AUTHORITATIVE_TIER_1: Set[str] = {
    "snopes.com",
    "politifact.com",
    "factcheck.org",
    "fullfact.org",
    "leadstories.com",
    "checkyourfact.com",
    "reuters.com",
    "apnews.com",
    "afp.com",
    "boomlive.in",
    "altnews.in",
    "vishvasnews.com",
}

AUTHORITATIVE_TIER_2: Set[str] = {
    "bbc.com",
    "bbc.co.uk",
    "npr.org",
    "theguardian.com",
    "nytimes.com",
    "washingtonpost.com",
    "wsj.com",
    "bloomberg.com",
    "nature.com",
    "sciencemag.org",
    "scientificamerican.com",
    "who.int",
    "cdc.gov",
    "nasa.gov",
    "un.org",
    "unesco.org",
    "nih.gov",
    "fda.gov",
    "europa.eu",
}

AUTHORITATIVE_TIER_3: Set[str] = {
    "wikipedia.org",
    "britannica.com",
    "dictionary.com",
    "merriam-webster.com",
}

BLOCKED_DOMAINS: Tuple[str, ...] = (
    "pornhub.com",
    "xvideos.com",
    "xnxx.com",
)

STOPWORDS: Set[str] = {
    "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or",
    "is", "are", "was", "were", "be", "been", "being", "have", "has",
    "had", "do", "does", "did", "this", "that", "these", "those", "it",
    "its", "by", "with", "from", "as", "about", "into", "through",
}


def normalize_url(url: str) -> str:
    """Normalize a URL to prevent false mismatch caused by slashes or query tracking."""
    if not url or not isinstance(url, str):
        return ""
    try:
        parsed = urlsplit(url.strip())
        scheme = (parsed.scheme or "https").lower()
        netloc = (parsed.netloc or "").lower().split(":")[0]
        if netloc.startswith("www."):
            netloc = netloc[4:]
        path = parsed.path.rstrip("/")
        # Filter out common marketing/tracking query parameters
        tracking_prefixes = ("utm_", "ref", "fbclid", "gclid", "source", "amp")
        query_parts = []
        if parsed.query:
            for part in parsed.query.split("&"):
                if "=" in part:
                    k, _ = part.split("=", 1)
                    if not any(k.lower().startswith(p) for p in tracking_prefixes):
                        query_parts.append(part)
                else:
                    query_parts.append(part)
        query = "&".join(sorted(query_parts))
        return urlunsplit((scheme, netloc, path, query, ""))
    except Exception:
        return url.strip().rstrip("/").lower()


def get_domain_authority(url: str) -> int:
    """Assign an objective authority score based on domain category."""
    try:
        host = (urlsplit(url).hostname or "").lower()
        if host.startswith("www."):
            host = host[4:]

        # High priority institutional domains
        if any(marker in host for marker in (".gov", ".edu", ".ac.", ".mil", ".org.in", ".gov.in", ".edu.in")):
            return 90

        for domain in AUTHORITATIVE_TIER_1:
            if host == domain or host.endswith("." + domain):
                return 100

        for domain in AUTHORITATIVE_TIER_2:
            if host == domain or host.endswith("." + domain):
                return 80

        for domain in AUTHORITATIVE_TIER_3:
            if host == domain or host.endswith("." + domain):
                return 65

        return 35
    except Exception:
        return 20


def calculate_relevance(claim: str, title: str, snippet: str) -> int:
    """Compute keyword overlap relevance between a claim and search item."""
    claim_words = {
        w for w in re.findall(r"\w+", claim.lower())
        if len(w) > 2 and w not in STOPWORDS
    }
    if not claim_words:
        return 50

    combined_text = f"{(title or '')} {(snippet or '')}".lower()
    matches = sum(1 for word in claim_words if word in combined_text)
    score = int((matches / len(claim_words)) * 100)

    # Bonus if text mentions explicit fact-checking terms
    if any(term in combined_text for term in ("fact check", "debunk", "verdict", "hoax", "verified")):
        score += 15

    return min(100, score)


# --- Thread-Safe Caches ---
class TTLCache:
    def __init__(self, ttl_seconds: int = 1800, max_size: int = 256):
        self.ttl = ttl_seconds
        self.max_size = max_size
        self._cache: Dict[str, Tuple[float, Any]] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        norm_key = " ".join(key.strip().lower().split())
        with self._lock:
            if norm_key in self._cache:
                timestamp, data = self._cache[norm_key]
                if time.time() - timestamp < self.ttl:
                    return data
                del self._cache[norm_key]
        return None

    def set(self, key: str, value: Any) -> None:
        norm_key = " ".join(key.strip().lower().split())
        with self._lock:
            if len(self._cache) >= self.max_size:
                oldest_key = min(self._cache, key=lambda k: self._cache[k][0])
                del self._cache[oldest_key]
            self._cache[norm_key] = (time.time(), value)

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()


_search_cache = TTLCache(ttl_seconds=1800, max_size=256)
_verification_cache = TTLCache(ttl_seconds=1800, max_size=256)


def clear_caches() -> None:
    """Clear in-memory caches (useful for isolation in tests)."""
    _search_cache.clear()
    _verification_cache.clear()


def search_web_evidence(query: str, max_results: int = 5) -> List[Dict[str, str]]:
    """
    Retrieve, prioritize, and deduplicate authoritative web evidence.
    Returns results deterministically ordered by domain authority and relevance.
    """
    from ddgs import DDGS

    query = query.strip()
    if not query:
        return []

    cached = _search_cache.get(query)
    if cached is not None:
        logger.info("[TruthLens] Serving web evidence from cache for: %s", query[:60])
        return [dict(item) for item in cached]

    evidence_candidates = []
    seen_urls: Set[str] = set()

    # Search queries: primary query first
    queries_to_try = [query]
    # Only try secondary fact-check query if needed
    queries_to_try.append(f"{query} fact check")

    for search_query in queries_to_try:
        try:
            with DDGS(timeout=15) as ddgs:
                results = ddgs.text(
                    search_query,
                    max_results=max_results + 3,
                )
            for item in results or []:
                title = (item.get("title") or "").strip()
                url = (item.get("href") or "").strip()
                snippet = (item.get("body") or "").strip()

                if not title or not (url.startswith("https://") or url.startswith("http://")):
                    continue

                try:
                    parsed = urlsplit(url)
                    host = (parsed.hostname or "").lower()
                    if not host or any(
                        host == domain or host.endswith("." + domain)
                        for domain in BLOCKED_DOMAINS
                    ):
                        continue
                except ValueError:
                    continue

                norm_url = normalize_url(url)
                if norm_url in seen_urls:
                    continue

                seen_urls.add(norm_url)
                authority = get_domain_authority(url)
                relevance = calculate_relevance(query, title, snippet)

                evidence_candidates.append({
                    "title": title,
                    "url": url,
                    "snippet": snippet,
                    "norm_url": norm_url,
                    "authority": authority,
                    "relevance": relevance,
                })

            # If primary query returned plenty of good evidence, don't spam DDGS
            if len(evidence_candidates) >= max_results:
                break

        except Exception as ex:
            logger.warning(
                "[TruthLens] DDGS search query failed for %r: %s",
                search_query[:60],
                ex,
            )
            continue

    # Deterministic sorting: sort primarily by domain authority, then relevance, then URL
    evidence_candidates.sort(
        key=lambda item: (-item["authority"], -item["relevance"], item["norm_url"])
    )

    clean_results = [
        {
            "title": item["title"],
            "url": item["url"],
            "snippet": item["snippet"],
        }
        for item in evidence_candidates[:max_results]
    ]

    logger.info(
        "[TruthLens] Retrieved %d ranked results for query: %s",
        len(clean_results),
        query[:60],
    )

    if clean_results:
        _search_cache.set(query, clean_results)

    return clean_results


def _parse_json_response(content: str) -> dict:
    """Parse a JSON object from an LLM response, including Markdown fences."""
    if not content or not content.strip():
        raise GeminiProviderError("AI provider returned an empty response.")

    cleaned = content.strip()

    # Remove Markdown code fences if present.
    cleaned = re.sub(
        r"\A```(?:json)?[ \t]*\r?\n?",
        "",
        cleaned,
        flags=re.IGNORECASE,
    )
    cleaned = re.sub(r"\r?\n?```[ \t]*\Z", "", cleaned).strip()

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError:
        decoder = json.JSONDecoder()
        data = None

        for index, char in enumerate(cleaned):
            if char != "{":
                continue
            try:
                candidate, _ = decoder.raw_decode(cleaned[index:])
                if isinstance(candidate, dict):
                    data = candidate
                    break
            except json.JSONDecodeError:
                continue

        if data is None:
            logger.error(
                "[TruthLens] AI response was not valid JSON. Length=%d",
                len(cleaned),
            )
            raise GeminiProviderError(
                "AI provider did not return a valid JSON object."
            )

    if not isinstance(data, dict):
        raise GeminiProviderError(
            "AI provider response must be a JSON object."
        )

    return data


def validate_and_calibrate_verification(
    data: dict,
    evidence: List[Dict[str, str]],
    claim: str,
) -> Tuple[GeminiVerificationResult, List[VerificationSource]]:
    """
    Deterministic rule-based evidence validation and score calibration.
    Ensures verdicts and scores strictly reflect the verified evidence.
    """
    allowed_verdicts = {"TRUE", "FALSE", "MISLEADING", "UNVERIFIED"}
    raw_verdict = str(data.get("verdict") or "").strip().upper()
    if raw_verdict not in allowed_verdicts:
        raw_verdict = "UNVERIFIED"

    # Map search evidence URLs for reliable matching
    evidence_by_norm_url: Dict[str, Dict[str, str]] = {}
    evidence_by_domain_path: Dict[str, Dict[str, str]] = {}

    for item in evidence:
        norm = normalize_url(item["url"])
        evidence_by_norm_url[norm] = item
        try:
            p = urlsplit(item["url"])
            host = (p.hostname or "").lower()
            if host.startswith("www."):
                host = host[4:]
            domain_path = f"{host}{p.path.rstrip('/')}"
            evidence_by_domain_path[domain_path] = item
        except Exception:
            pass

    def resolve_source(item: Any) -> Optional[Dict[str, str]]:
        if not isinstance(item, dict):
            return None
        url = str(item.get("url") or "").strip()
        if not url:
            return None
        norm = normalize_url(url)
        if norm in evidence_by_norm_url:
            matched = evidence_by_norm_url[norm]
            return {"title": matched["title"], "url": matched["url"]}
        try:
            p = urlsplit(url)
            host = (p.hostname or "").lower()
            if host.startswith("www."):
                host = host[4:]
            domain_path = f"{host}{p.path.rstrip('/')}"
            if domain_path in evidence_by_domain_path:
                matched = evidence_by_domain_path[domain_path]
                return {"title": matched["title"], "url": matched["url"]}
        except Exception:
            pass
        return None

    def filter_and_resolve_sources(raw_items: Any) -> List[Dict[str, str]]:
        if not isinstance(raw_items, list):
            return []
        resolved = []
        seen = set()
        for it in raw_items:
            res = resolve_source(it)
            if res and res["url"] not in seen:
                seen.add(res["url"])
                resolved.append(res)
        return resolved

    resolved_sources = filter_and_resolve_sources(data.get("sources"))
    resolved_corr_sources = filter_and_resolve_sources(data.get("correction_sources"))

    supporting = [
        str(s).strip() for s in (data.get("supporting_evidence") or [])
        if str(s).strip()
    ]
    contradicting = [
        str(s).strip() for s in (data.get("contradicting_evidence") or [])
        if str(s).strip()
    ]

    summary = str(data.get("summary") or "").strip()
    reasoning = str(data.get("reasoning") or "").strip()

    correct_info = data.get("correct_information")
    if correct_info is not None:
        correct_info = str(correct_info).strip() or None

    correction_explanation = data.get("correction_explanation")
    if correction_explanation is not None:
        correction_explanation = str(correction_explanation).strip() or None

    # If the model didn't explicitly populate sources, but cited evidence items, associate them
    if not resolved_sources and evidence:
        for ev in evidence:
            snippet_lower = ev["snippet"].lower()
            combined_evidence = supporting + contradicting
            if any(ev_text.lower()[:30] in snippet_lower for ev_text in combined_evidence):
                resolved_sources.append({"title": ev["title"], "url": ev["url"]})
                break
        if not resolved_sources and raw_verdict in ("TRUE", "FALSE", "MISLEADING") and evidence:
            # Fall back to top authoritative source from evidence
            resolved_sources.append({"title": evidence[0]["title"], "url": evidence[0]["url"]})

    verdict = raw_verdict

    # Rule-Based Evidence Validation:
    # 1. Never force TRUE/FALSE without supporting/contradicting evidence and verified sources.
    if verdict == "TRUE":
        if not supporting or not resolved_sources:
            verdict = "UNVERIFIED"
            reasoning = reasoning or "Evidence was insufficient to conclusively verify the claim as true."
    elif verdict == "FALSE":
        if not contradicting or not resolved_sources:
            verdict = "UNVERIFIED"
            reasoning = reasoning or "Evidence was insufficient to conclusively disprove the claim."
        else:
            # If correction sources was missing, reuse the contradicting sources
            if not resolved_corr_sources and resolved_sources:
                resolved_corr_sources = resolved_sources.copy()
    elif verdict == "MISLEADING":
        if not resolved_sources:
            verdict = "UNVERIFIED"
            reasoning = reasoning or "Evidence was insufficient to establish misleading context."
        elif not resolved_corr_sources and resolved_sources:
            resolved_corr_sources = resolved_sources.copy()

    # Rule-Based Score Calibration:
    # Ensures trust, risk, and confidence are strictly calibrated with the verdict & evidence.
    raw_trust = data.get("trust_score")
    raw_risk = data.get("risk_score")
    raw_conf = data.get("confidence")

    if verdict == "TRUE":
        # Trust in claim must be high (75-98)
        if isinstance(raw_trust, int) and 70 <= raw_trust <= 98:
            trust_score = raw_trust
        else:
            trust_score = 92
        risk_score = 100 - trust_score
        confidence = raw_conf if (isinstance(raw_conf, int) and 60 <= raw_conf <= 98) else 90
        correct_info = None
        correction_explanation = None
        resolved_corr_sources = []

    elif verdict == "FALSE":
        # Trust in claim must be low (2-25)
        if isinstance(raw_trust, int) and 2 <= raw_trust <= 25:
            trust_score = raw_trust
        elif isinstance(raw_risk, int) and 75 <= raw_risk <= 98:
            trust_score = 100 - raw_risk
        else:
            trust_score = 8
        risk_score = 100 - trust_score
        confidence = raw_conf if (isinstance(raw_conf, int) and 60 <= raw_conf <= 98) else 90

    elif verdict == "MISLEADING":
        if isinstance(raw_trust, int) and 20 <= raw_trust <= 50:
            trust_score = raw_trust
        else:
            trust_score = 35
        risk_score = 100 - trust_score
        confidence = raw_conf if (isinstance(raw_conf, int) and 50 <= raw_conf <= 90) else 75

    else:  # UNVERIFIED
        verdict = "UNVERIFIED"
        trust_score = None
        risk_score = None
        confidence = None
        correct_info = None
        correction_explanation = None
        resolved_corr_sources = []
        if not summary:
            summary = "Insufficient or conflicting reliable evidence found to verify this claim."
        if not reasoning:
            reasoning = "Available web sources do not provide clear consensus or sufficient verified facts."

    res_sources = [
        VerificationSource(title=s["title"], url=s["url"])
        for s in resolved_sources
    ]
    res_corr_sources = [
        VerificationSource(title=s["title"], url=s["url"])
        for s in resolved_corr_sources
    ]

    result = GeminiVerificationResult(
        verdict=verdict,
        trust_score=trust_score,
        risk_score=risk_score,
        confidence=confidence,
        summary=summary,
        reasoning=reasoning,
        supporting_evidence=supporting,
        contradicting_evidence=contradicting,
        sources=res_sources,
        correct_information=correct_info,
        correction_explanation=correction_explanation,
        correction_sources=res_corr_sources,
    )

    return result, res_sources


def analyze_text_with_gemini(
    input_content: str,
    input_type: str,
) -> Tuple[GeminiVerificationResult, List[VerificationSource]]:
    """
    Verify a claim consistently using authoritative web evidence and Groq LLM.
    Results for identical claims with identical evidence are cached and deterministic.
    """
    from groq import Groq

    cache_key = f"{input_type}::{input_content.strip()}"
    cached_verification = _verification_cache.get(cache_key)
    if cached_verification is not None:
        logger.info("[TruthLens] Serving verification from cache for: %s", input_content[:60])
        res, src = cached_verification
        # Return deep copy of cached models
        return (
            GeminiVerificationResult.model_validate(res.model_dump()),
            [VerificationSource.model_validate(s.model_dump()) for s in src],
        )

    api_key = settings.GROQ_API_KEY
    if not api_key:
        raise GeminiAuthError(
            "GROQ_API_KEY is not configured in the backend environment."
        )

    model_name = settings.GROQ_MODEL or "openai/gpt-oss-20b"

    logger.info("[TruthLens] Searching authoritative web evidence for claim: %s", input_content[:60])
    evidence = search_web_evidence(input_content, max_results=5)

    # When search genuinely returns no results, return an UNVERIFIED result without crashing
    if not evidence:
        logger.info("[TruthLens] No web evidence found for claim: %s", input_content[:60])
        result = GeminiVerificationResult(
            verdict="UNVERIFIED",
            trust_score=None,
            risk_score=None,
            confidence=None,
            summary="Insufficient reliable evidence found on the web to verify this claim.",
            reasoning="Web search returned no authoritative sources or matching evidence concerning this claim.",
            supporting_evidence=[],
            contradicting_evidence=[],
            sources=[],
            correct_information=None,
            correction_explanation=None,
            correction_sources=[],
        )
        _verification_cache.set(cache_key, (result, []))
        return result, []

    evidence_text = json.dumps(
        evidence,
        ensure_ascii=False,
        indent=2,
    )

    prompt = f"""You are an objective, rigorous, and consistent fact-checking verification engine for TruthLens AI.

Analyze this claim:
"{input_content}"

Claim type: {input_type}

Provided Web Evidence (ranked by authority and relevance):
{evidence_text}

You must return ONLY one valid JSON object with EXACTLY these keys:
verdict, trust_score, risk_score, confidence, summary, reasoning,
supporting_evidence, contradicting_evidence, sources,
correct_information, correction_explanation, correction_sources.

DETERMINISTIC VERDICT RULES:
1. "TRUE":
   - Use ONLY when the provided evidence directly corroborates and confirms the claim as accurate.
   - Must include supporting_evidence and at least one source from the provided evidence.
   - trust_score: 80 to 98 (high trust in claim).
   - risk_score: 2 to 20 (low risk of misinformation).
   - confidence: 75 to 98.
   - correct_information and correction_explanation must be null, correction_sources must be [].

2. "FALSE":
   - Use when the provided evidence directly contradicts or disproves the claim.
   - Must include contradicting_evidence and at least one source from the provided evidence.
   - trust_score: 2 to 20 (low trust in claim).
   - risk_score: 80 to 98 (high risk of misinformation).
   - confidence: 75 to 98.
   - Provide correct_information and correction_explanation based on the evidence.
   - correction_sources must include the source(s) supporting the correct information.

3. "MISLEADING":
   - Use when the claim contains partial truth but distorts facts, takes information out of context, or makes an unproven exaggeration.
   - trust_score: 25 to 45.
   - risk_score: 55 to 75.
   - confidence: 60 to 85.
   - Provide correct_information, explanation, and sources.

4. "UNVERIFIED":
   - Use ONLY when:
     a) The provided evidence is genuinely insufficient, weak, or does not directly address the claim, OR
     b) Reputable sources in the evidence directly conflict with each other with no consensus.
   - All scores (trust_score, risk_score, confidence) MUST be null.
   - correct_information, correction_explanation must be null, correction_sources must be [].

STRICT CONSTRAINTS:
- Use ONLY facts, titles, and URLs present in the provided evidence. Never invent URLs or evidence.
- Do NOT wrap response in markdown code blocks. Output pure JSON only.
"""

    try:
        client = Groq(api_key=api_key)

        response = client.chat.completions.create(
            model=model_name,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an objective, consistent fact-checking engine. "
                        "Return one valid JSON object only. Never invent sources or URLs."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )

        content = response.choices[0].message.content or ""
        logger.debug("[TruthLens] Groq response length: %d", len(content))

        data = _parse_json_response(content)

        result, verification_sources = validate_and_calibrate_verification(
            data=data,
            evidence=evidence,
            claim=input_content,
        )

        logger.info(
            "[TruthLens] Analysis completed: verdict=%s, trust=%s, risk=%s, sources=%d",
            result.verdict,
            result.trust_score,
            result.risk_score,
            len(verification_sources),
        )

        _verification_cache.set(cache_key, (result, verification_sources))
        return result, verification_sources

    except GeminiVerificationError:
        raise

    except Exception as error:
        logger.exception("[TruthLens] AI verification failed.")
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
    """Inspect an image with Gemini; this feature requires a Gemini key."""
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
