import unittest
from unittest.mock import call, patch

from fastapi.testclient import TestClient

from app.main import app
from app.schemas.analysis import GeminiVerificationResult, VerificationSource
from app.services.gemini_service import GeminiVerificationError


class TextAnalysisRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_gemini_failure_returns_unavailable_without_scores_or_sources(self):
        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            side_effect=GeminiVerificationError("Gemini quota exceeded"),
        ):
            response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": "PSIT is located in Kanpur.", "inputType": "CLAIM"},
            )

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.json(),
            {
                "success": False,
                "status": "AI_UNAVAILABLE",
                "message": "AI verification is temporarily unavailable.",
                "verdict": "UNVERIFIED",
                "trust_score": None,
                "risk_score": None,
                "confidence": None,
                "sources": [],
                "supporting_evidence": [],
                "contradicting_evidence": [],
            },
        )

    def test_consecutive_claims_use_their_own_gemini_results(self):
        true_result = GeminiVerificationResult(
            verdict="TRUE",
            trust_score=92,
            risk_score=8,
            confidence=90,
            summary="The claim is supported.",
            reasoning="The supplied claim matches the source.",
            supporting_evidence=["The institute's official website gives its location."],
            contradicting_evidence=[],
            sources=[],
        )
        false_result = GeminiVerificationResult(
            verdict="FALSE",
            trust_score=12,
            risk_score=88,
            confidence=95,
            summary="The claimed location is contradicted.",
            reasoning="The supplied location differs from the official location.",
            supporting_evidence=[],
            contradicting_evidence=["The institute is not located in Mumbai."],
            sources=[],
        )
        first_claim = "PSIT is located in Kanpur, Uttar Pradesh."
        second_claim = "PSIT is located in Mumbai."

        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            side_effect=[(true_result, []), (false_result, [])],
        ) as analyze:
            first_response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": first_claim, "inputType": "CLAIM"},
            )
            second_response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": second_claim, "inputType": "CLAIM"},
            )

        self.assertEqual(first_response.status_code, 200)
        self.assertEqual(second_response.status_code, 200)
        self.assertEqual(first_response.json()["inputContent"], first_claim)
        self.assertEqual(first_response.json()["verdict"], "TRUE")
        self.assertEqual(first_response.json()["risk_score"], 8)
        self.assertEqual(second_response.json()["inputContent"], second_claim)
        self.assertEqual(second_response.json()["verdict"], "FALSE")
        self.assertEqual(second_response.json()["risk_score"], 88)
        analyze.assert_has_calls(
            [call(first_claim, "CLAIM"), call(second_claim, "CLAIM")]
        )

    def test_only_returned_grounding_sources_enable_grounding_status(self):
        result = GeminiVerificationResult(
            verdict="UNVERIFIED",
            trust_score=None,
            risk_score=None,
            confidence=None,
            summary="There is not enough evidence.",
            reasoning="No reliable evidence was returned.",
            supporting_evidence=[],
            contradicting_evidence=[],
            sources=[],
        )
        sources = [
            VerificationSource(
                title="Official source",
                url="https://example.edu/location",
            )
        ]

        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            return_value=(result, sources),
        ):
            response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": "A claim needing verification.", "inputType": "CLAIM"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["sources"], [source.model_dump() for source in sources])
        self.assertTrue(response.json()["traceability"]["searchGroundingActive"])

    def test_repeated_identical_claims_via_api_return_consistent_results(self):
        result = GeminiVerificationResult(
            verdict="TRUE",
            trust_score=94,
            risk_score=6,
            confidence=92,
            summary="Verified factual claim.",
            reasoning="Supported by authoritative documentation.",
            supporting_evidence=["Official records confirm the location."],
            contradicting_evidence=[],
            sources=[VerificationSource(title="Official Org", url="https://example.org/entry")],
        )
        sources = [VerificationSource(title="Official Org", url="https://example.org/entry")]
        claim = "Paris is the capital of France."

        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            return_value=(result, sources),
        ) as mock_analyze:
            resp1 = self.client.post("/api/analyze/text-url", json={"inputContent": claim, "inputType": "CLAIM"})
            resp2 = self.client.post("/api/analyze/text-url", json={"inputContent": claim, "inputType": "CLAIM"})

        self.assertEqual(resp1.status_code, 200)
        self.assertEqual(resp2.status_code, 200)
        data1 = resp1.json()
        data2 = resp2.json()

        self.assertEqual(data1["verdict"], data2["verdict"])
        self.assertEqual(data1["trust_score"], data2["trust_score"])
        self.assertEqual(data1["risk_score"], data2["risk_score"])
        self.assertEqual(data1["confidence"], data2["confidence"])
        self.assertEqual(data1["riskLevel"], data2["riskLevel"])
        self.assertEqual(data1["verdictTitle"], data2["verdictTitle"])
        self.assertEqual(data1["sources"], data2["sources"])

    def test_conflicting_evidence_via_api_returns_unverified_with_null_scores(self):
        conflicting_result = GeminiVerificationResult(
            verdict="UNVERIFIED",
            trust_score=None,
            risk_score=None,
            confidence=None,
            summary="Evidence from reliable sources is conflicting.",
            reasoning="Sources directly contradict each other with no scientific consensus.",
            supporting_evidence=["Study X reports positive correlation."],
            contradicting_evidence=["Study Y reports no correlation."],
            sources=[
                VerificationSource(title="Journal X", url="https://nature.com/study-x"),
                VerificationSource(title="Journal Y", url="https://sciencemag.org/study-y"),
            ],
        )
        sources = [
            VerificationSource(title="Journal X", url="https://nature.com/study-x"),
            VerificationSource(title="Journal Y", url="https://sciencemag.org/study-y"),
        ]

        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            return_value=(conflicting_result, sources),
        ):
            response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": "Debated scientific correlation", "inputType": "CLAIM"},
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "UNVERIFIED")
        self.assertIsNone(data["trust_score"])
        self.assertIsNone(data["risk_score"])
        self.assertIsNone(data["confidence"])
        self.assertIsNone(data["overallScore"])
        self.assertEqual(data["riskLevel"], "INCONCLUSIVE")
        self.assertEqual(data["verdictTitle"], "UNVERIFIED")
        self.assertEqual(len(data["sources"]), 2)

    def test_insufficient_evidence_via_api_returns_unverified_with_null_scores(self):
        insufficient_result = GeminiVerificationResult(
            verdict="UNVERIFIED",
            trust_score=None,
            risk_score=None,
            confidence=None,
            summary="Insufficient reliable evidence found on the web to verify this claim.",
            reasoning="No reliable sources or corroborating documentation exist.",
            supporting_evidence=[],
            contradicting_evidence=[],
            sources=[],
        )

        with patch(
            "app.api.routes.analyze.analyze_text_with_gemini",
            return_value=(insufficient_result, []),
        ):
            response = self.client.post(
                "/api/analyze/text-url",
                json={"inputContent": "Random obscure unverified statement", "inputType": "CLAIM"},
            )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["verdict"], "UNVERIFIED")
        self.assertIsNone(data["trust_score"])
        self.assertIsNone(data["risk_score"])
        self.assertIsNone(data["confidence"])
        self.assertEqual(data["sources"], [])
        self.assertEqual(data["riskLevel"], "INCONCLUSIVE")

    def test_image_analysis_endpoint_preserved(self):
        response = self.client.post(
            "/api/analyze/image",
            json={"imageName": "sample.jpg", "sampleId": "1"},
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertIn("verdict", data)
        self.assertIn("confidenceBand", data)
        self.assertIn("modelOutputLogit", data)


if __name__ == "__main__":
    unittest.main()
