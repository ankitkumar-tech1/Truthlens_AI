import unittest
from unittest.mock import MagicMock, patch

from app.schemas.analysis import GeminiVerificationResult, VerificationSource
from app.services.gemini_service import (
    GeminiAuthError,
    GeminiProviderError,
    _parse_json_response,
    analyze_text_with_gemini,
    clear_caches,
    get_domain_authority,
    normalize_url,
    search_web_evidence,
    validate_and_calibrate_verification,
)


class EvidenceAndVerdictTests(unittest.TestCase):
    def setUp(self):
        clear_caches()

    def tearDown(self):
        clear_caches()

    def test_url_normalization(self):
        url1 = "https://www.en.wikipedia.org/wiki/Taj_Mahal/?utm_source=twitter&ref=share#section"
        url2 = "https://en.wikipedia.org/wiki/Taj_Mahal"
        self.assertEqual(normalize_url(url1), normalize_url(url2))

    def test_authoritative_domain_prioritization(self):
        fact_check = "https://www.snopes.com/fact-check/taj-mahal-kanpur/"
        gov = "https://whc.unesco.org/en/list/252"
        edu = "https://www.psit.ac.in/campus"
        wiki = "https://en.wikipedia.org/wiki/Taj_Mahal"
        random_blog = "https://random-unverified-blog.xyz/post/123"

        self.assertGreater(get_domain_authority(fact_check), get_domain_authority(random_blog))
        self.assertGreater(get_domain_authority(gov), get_domain_authority(random_blog))
        self.assertGreater(get_domain_authority(edu), get_domain_authority(random_blog))
        self.assertGreater(get_domain_authority(wiki), get_domain_authority(random_blog))
        self.assertEqual(get_domain_authority(fact_check), 100)
        self.assertEqual(get_domain_authority(gov), 80)
        self.assertEqual(get_domain_authority(edu), 90)

    def test_search_web_evidence_prioritizes_authoritative_sources(self):
        mock_raw_results = [
            {"title": "Random Blog Post", "href": "https://randomblog.com/post", "body": "Some unverified text"},
            {"title": "Snopes Fact Check", "href": "https://snopes.com/fact-check/claim", "body": "Official debunk"},
            {"title": "Wikipedia Entry", "href": "https://en.wikipedia.org/wiki/Claim", "body": "Documented facts"},
        ]

        with patch("ddgs.ddgs.DDGS.text", return_value=mock_raw_results):
            evidence = search_web_evidence("Sample claim", max_results=3)

        self.assertEqual(len(evidence), 3)
        # Snopes (authority 100) must be first
        self.assertEqual(evidence[0]["url"], "https://snopes.com/fact-check/claim")
        # Wikipedia (authority 65) must be second
        self.assertEqual(evidence[1]["url"], "https://en.wikipedia.org/wiki/Claim")
        # Random blog (authority 35) must be last
        self.assertEqual(evidence[2]["url"], "https://randomblog.com/post")

    def test_repeated_identical_claims_return_consistent_verdict_and_scores(self):
        evidence = [
            {
                "title": "UNESCO - Taj Mahal",
                "url": "https://whc.unesco.org/en/list/252",
                "snippet": "The Taj Mahal is located in Agra, Uttar Pradesh, India.",
            }
        ]

        mock_llm_payload = {
            "verdict": "TRUE",
            "trust_score": 95,
            "risk_score": 5,
            "confidence": 92,
            "summary": "The Taj Mahal is located in Agra.",
            "reasoning": "UNESCO documents the Taj Mahal in Agra.",
            "supporting_evidence": ["Located on the right bank of the Yamuna River in Agra."],
            "contradicting_evidence": [],
            "sources": [{"title": "UNESCO - Taj Mahal", "url": "https://whc.unesco.org/en/list/252"}],
            "correct_information": None,
            "correction_explanation": None,
            "correction_sources": [],
        }

        with patch("app.services.gemini_service.settings.GROQ_API_KEY", "test-key"), \
             patch("app.services.gemini_service.search_web_evidence", return_value=evidence):

            mock_groq_choice = MagicMock()
            import json
            mock_groq_choice.message.content = json.dumps(mock_llm_payload)
            mock_response = MagicMock(choices=[mock_groq_choice])

            with patch("groq.Groq") as mock_groq_cls:
                mock_client = MagicMock()
                mock_client.chat.completions.create.return_value = mock_response
                mock_groq_cls.return_value = mock_client

                res1, src1 = analyze_text_with_gemini("Taj Mahal is in Agra", "CLAIM")
                res2, src2 = analyze_text_with_gemini("Taj Mahal is in Agra", "CLAIM")
                res3, src3 = analyze_text_with_gemini("Taj Mahal is in Agra", "CLAIM")

        self.assertEqual(res1.verdict, "TRUE")
        self.assertEqual(res1.verdict, res2.verdict)
        self.assertEqual(res2.verdict, res3.verdict)
        self.assertEqual(res1.trust_score, res2.trust_score)
        self.assertEqual(res1.risk_score, res2.risk_score)
        self.assertEqual(res1.confidence, res2.confidence)
        self.assertEqual(len(src1), len(src2))

    def test_conflicting_evidence_returns_unverified_with_null_scores(self):
        evidence = [
            {
                "title": "Study A",
                "url": "https://reuters.com/news/study-a",
                "snippet": "Study A claims the substance is effective.",
            },
            {
                "title": "Study B",
                "url": "https://apnews.com/news/study-b",
                "snippet": "Study B found no evidence of effectiveness.",
            },
        ]

        llm_response_data = {
            "verdict": "UNVERIFIED",
            "trust_score": None,
            "risk_score": None,
            "confidence": None,
            "summary": "Conflicting evidence from credible sources prevents verification.",
            "reasoning": "Reuters reports positive findings while AP News reports no effect.",
            "supporting_evidence": ["Study A indicates effectiveness."],
            "contradicting_evidence": ["Study B refutes effectiveness."],
            "sources": [
                {"title": "Study A", "url": "https://reuters.com/news/study-a"},
                {"title": "Study B", "url": "https://apnews.com/news/study-b"},
            ],
            "correct_information": None,
            "correction_explanation": None,
            "correction_sources": [],
        }

        result, sources = validate_and_calibrate_verification(
            llm_response_data,
            evidence,
            "The substance is proven to be effective",
        )

        self.assertEqual(result.verdict, "UNVERIFIED")
        self.assertIsNone(result.trust_score)
        self.assertIsNone(result.risk_score)
        self.assertIsNone(result.confidence)
        self.assertEqual(len(sources), 2)
        self.assertIn("Conflicting", result.summary)

    def test_insufficient_evidence_returns_unverified_with_null_scores(self):
        with patch("app.services.gemini_service.settings.GROQ_API_KEY", "test-key"), \
             patch("app.services.gemini_service.search_web_evidence", return_value=[]):

            result, sources = analyze_text_with_gemini(
                "Xylophonic quibble generates ultrasonic resonance in quartz",
                "CLAIM",
            )

        self.assertEqual(result.verdict, "UNVERIFIED")
        self.assertIsNone(result.trust_score)
        self.assertIsNone(result.risk_score)
        self.assertIsNone(result.confidence)
        self.assertEqual(sources, [])
        self.assertIn("Insufficient", result.summary)

    def test_unsupported_true_verdict_demoted_to_unverified(self):
        evidence = [
            {
                "title": "General Topic",
                "url": "https://en.wikipedia.org/wiki/Topic",
                "snippet": "General topic description with no claim mention.",
            }
        ]

        # Model attempts to say TRUE without supporting evidence
        unsupported_true = {
            "verdict": "TRUE",
            "trust_score": 90,
            "risk_score": 10,
            "confidence": 90,
            "summary": "Unsupported claim.",
            "reasoning": "No proof given.",
            "supporting_evidence": [],  # Empty!
            "contradicting_evidence": [],
            "sources": [],
        }

        result, _ = validate_and_calibrate_verification(
            unsupported_true,
            evidence,
            "Unsupported claim text",
        )

        self.assertEqual(result.verdict, "UNVERIFIED")
        self.assertIsNone(result.trust_score)
        self.assertIsNone(result.risk_score)
        self.assertIsNone(result.confidence)

    def test_unsupported_false_verdict_demoted_to_unverified(self):
        evidence = [
            {
                "title": "General Topic",
                "url": "https://en.wikipedia.org/wiki/Topic",
                "snippet": "General topic description with no claim mention.",
            }
        ]

        unsupported_false = {
            "verdict": "FALSE",
            "trust_score": 10,
            "risk_score": 90,
            "confidence": 90,
            "summary": "Unsupported contradiction.",
            "reasoning": "No proof given.",
            "supporting_evidence": [],
            "contradicting_evidence": [],  # Empty!
            "sources": [],
        }

        result, _ = validate_and_calibrate_verification(
            unsupported_false,
            evidence,
            "Unsupported claim text",
        )

        self.assertEqual(result.verdict, "UNVERIFIED")
        self.assertIsNone(result.trust_score)
        self.assertIsNone(result.risk_score)
        self.assertIsNone(result.confidence)

    def test_false_verdict_preserves_false_even_if_correction_sources_empty(self):
        evidence = [
            {
                "title": "UNESCO - Taj Mahal",
                "url": "https://whc.unesco.org/en/list/252",
                "snippet": "Taj Mahal is located in Agra, Uttar Pradesh.",
            }
        ]

        false_data = {
            "verdict": "FALSE",
            "trust_score": 10,
            "risk_score": 90,
            "confidence": 95,
            "summary": "The Taj Mahal is not in Kanpur; it is in Agra.",
            "reasoning": "Official records state Agra.",
            "supporting_evidence": [],
            "contradicting_evidence": ["Taj Mahal is in Agra, 240 km from Kanpur."],
            "sources": [{"title": "UNESCO - Taj Mahal", "url": "https://whc.unesco.org/en/list/252"}],
            "correct_information": "Taj Mahal is in Agra.",
            "correction_explanation": "Claim incorrectly states Kanpur.",
            "correction_sources": [],  # Empty correction_sources from LLM!
        }

        result, sources = validate_and_calibrate_verification(
            false_data,
            evidence,
            "Taj Mahal is in Kanpur",
        )

        self.assertEqual(result.verdict, "FALSE")
        self.assertLessEqual(result.trust_score, 25)
        self.assertGreaterEqual(result.risk_score, 75)
        self.assertEqual(len(sources), 1)
        self.assertEqual(len(result.correction_sources), 1)
        self.assertEqual(result.correction_sources[0].url, "https://whc.unesco.org/en/list/252")

    def test_score_calibration_corrects_inverted_scores_for_false_verdict(self):
        evidence = [
            {
                "title": "Fact Check",
                "url": "https://snopes.com/fact-check/claim",
                "snippet": "Claim is debunked.",
            }
        ]

        inverted_data = {
            "verdict": "FALSE",
            "trust_score": 90,  # Inverted! LLM thought trust in the fact-check
            "risk_score": 10,
            "confidence": 90,
            "summary": "Debunked claim.",
            "reasoning": "Debunked by Snopes.",
            "supporting_evidence": [],
            "contradicting_evidence": ["Claim is false."],
            "sources": [{"title": "Fact Check", "url": "https://snopes.com/fact-check/claim"}],
        }

        result, _ = validate_and_calibrate_verification(
            inverted_data,
            evidence,
            "Debunked claim",
        )

        self.assertEqual(result.verdict, "FALSE")
        # Inverted trust_score of 90 must be corrected to low trust (<= 25)
        self.assertLessEqual(result.trust_score, 25)
        self.assertGreaterEqual(result.risk_score, 75)
        self.assertEqual(result.trust_score + result.risk_score, 100)

    def test_parse_json_response_with_markdown_fences(self):
        wrapped_json = "```json\n{\"verdict\": \"TRUE\", \"summary\": \"Valid\"}\n```"
        parsed = _parse_json_response(wrapped_json)
        self.assertEqual(parsed["verdict"], "TRUE")

    def test_parse_json_response_with_surrounding_conversational_text(self):
        text_with_json = "Here is the fact check result:\n{\"verdict\": \"FALSE\", \"summary\": \"Invalid\"}\nHope this helps!"
        parsed = _parse_json_response(text_with_json)
        self.assertEqual(parsed["verdict"], "FALSE")

    def test_parse_json_response_raises_on_invalid_json(self):
        with self.assertRaises(GeminiProviderError):
            _parse_json_response("This is not JSON at all.")


if __name__ == "__main__":
    unittest.main()
