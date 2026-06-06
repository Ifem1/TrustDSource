# Trustdsource - GenLayer Contract Tests
# Run with: python -m pytest tests/contract/test_trustdsource.py

import json
import hashlib
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../intelligent-contract"))

from scoring_engine import (
    calculate_credibility_score,
    determine_verdict,
    score_source_credibility,
    calculate_reputation_delta,
    get_reputation_tier,
)
from credibility_engine import parse_credibility_response, build_claims_prompt
from source_discovery import extract_domain, score_domain
from claim_extractor import parse_claims_response, deduplicate_claims, get_primary_claim


def test_calculate_credibility_score_high():
    score = calculate_credibility_score(85, 90, 88, 92, 8, 5)
    assert score >= 80
    assert score <= 100


def test_calculate_credibility_score_low():
    score = calculate_credibility_score(20, 15, 10, 25, 2, 1)
    assert score < 40


def test_calculate_credibility_score_clamps_max():
    score = calculate_credibility_score(100, 100, 100, 100, 20, 20)
    assert score == 100


def test_determine_verdict_high():
    verdict = determine_verdict(85, "LOW")
    assert verdict == "HIGH_CREDIBILITY"


def test_determine_verdict_moderate():
    verdict = determine_verdict(65, "LOW")
    assert verdict == "MODERATE_CREDIBILITY"


def test_determine_verdict_low():
    verdict = determine_verdict(40, "LOW")
    assert verdict == "LOW_CREDIBILITY"


def test_determine_verdict_misleading():
    verdict = determine_verdict(35, "HIGH")
    assert verdict == "MISLEADING"


def test_determine_verdict_unverified():
    verdict = determine_verdict(0, "LOW")
    assert verdict == "UNVERIFIED"


def test_score_source_credibility_gov():
    score = score_source_credibility("cdc.gov", "government")
    assert score >= 90


def test_score_source_credibility_news():
    score = score_source_credibility("reuters.com", "news")
    assert score >= 85


def test_score_source_credibility_blog():
    score = score_source_credibility("randomblog.com", "blog")
    assert score == 40


def test_calculate_reputation_delta():
    assert calculate_reputation_delta("HIGH_CREDIBILITY") == 15
    assert calculate_reputation_delta("MODERATE_CREDIBILITY") == 10
    assert calculate_reputation_delta("LOW_CREDIBILITY") == 7
    assert calculate_reputation_delta("MISLEADING") == 5
    assert calculate_reputation_delta("UNVERIFIED") == 3


def test_get_reputation_tier_thresholds():
    assert get_reputation_tier(0) == "new"
    assert get_reputation_tier(49) == "new"
    assert get_reputation_tier(50) == "analyst"
    assert get_reputation_tier(200) == "researcher"
    assert get_reputation_tier(500) == "trusted_researcher"
    assert get_reputation_tier(1000) == "verification_expert"


def test_parse_credibility_response_valid():
    response = json.dumps({
        "credibility_score": 82,
        "confidence": 0.91,
        "source_quality": 88,
        "evidence_strength": 85,
        "consistency_score": 90,
        "bias_risk": "LOW",
        "misinformation_risk": "LOW",
        "verdict": "HIGH_CREDIBILITY",
        "reasoning": "Well sourced.",
        "ai_summary": "High quality content.",
        "misinformation_signals": [],
        "bias_signals": []
    })
    result = parse_credibility_response(response)
    assert result["credibility_score"] == 82
    assert result["verdict"] == "HIGH_CREDIBILITY"


def test_parse_credibility_response_invalid():
    result = parse_credibility_response("not json at all")
    assert result["verdict"] == "UNVERIFIED"
    assert result["credibility_score"] == 0


def test_extract_domain():
    assert extract_domain("https://www.reuters.com/world/article") == "reuters.com"
    assert extract_domain("https://bbc.co.uk/news") == "bbc.co.uk"


def test_score_domain_gov():
    assert score_domain("cdc.gov") == 92


def test_score_domain_edu():
    assert score_domain("harvard.edu") == 85


def test_score_domain_unknown():
    score = score_domain("unknownsite.xyz")
    assert score == 50


def test_parse_claims_response_valid():
    claims_json = json.dumps([
        {"claim_text": "The study found a 40% reduction", "claim_type": "statistical", "confidence": 0.92, "is_primary": True},
        {"claim_text": "The policy was enacted in 2022", "claim_type": "event", "confidence": 0.85, "is_primary": False}
    ])
    claims = parse_claims_response(claims_json)
    assert len(claims) == 2
    assert claims[0]["is_primary"] is True
    assert claims[0]["claim_type"] == "statistical"


def test_parse_claims_response_invalid():
    claims = parse_claims_response("not json")
    assert claims == []


def test_deduplicate_claims():
    claims = [
        {"claim_text": "The temperature rose 2 degrees", "confidence": 0.9},
        {"claim_text": "The temperature rose 2 degrees", "confidence": 0.8},
        {"claim_text": "Scientists confirmed the finding", "confidence": 0.85},
    ]
    unique = deduplicate_claims(claims)
    assert len(unique) == 2


def test_get_primary_claim_with_primary():
    claims = [
        {"claim_text": "Secondary claim", "is_primary": False, "confidence": 0.9},
        {"claim_text": "Primary claim", "is_primary": True, "confidence": 0.8},
    ]
    primary = get_primary_claim(claims)
    assert primary == "Primary claim"


def test_get_primary_claim_no_primary():
    claims = [
        {"claim_text": "Most confident", "is_primary": False, "confidence": 0.95},
        {"claim_text": "Less confident", "is_primary": False, "confidence": 0.7},
    ]
    primary = get_primary_claim(claims)
    assert primary == "Most confident"


def test_content_hash_consistency():
    content = "Test article content"
    url = "https://example.com"
    claim = "Test claim"
    hash1 = hashlib.sha256((content + url + claim).encode()).hexdigest()
    hash2 = hashlib.sha256((content + url + claim).encode()).hexdigest()
    assert hash1 == hash2


def test_content_hash_uniqueness():
    hash1 = hashlib.sha256(("content1" + "url1" + "claim1").encode()).hexdigest()
    hash2 = hashlib.sha256(("content2" + "url2" + "claim2").encode()).hexdigest()
    assert hash1 != hash2


if __name__ == "__main__":
    tests = [
        test_calculate_credibility_score_high,
        test_calculate_credibility_score_low,
        test_calculate_credibility_score_clamps_max,
        test_determine_verdict_high,
        test_determine_verdict_moderate,
        test_determine_verdict_low,
        test_determine_verdict_misleading,
        test_determine_verdict_unverified,
        test_score_source_credibility_gov,
        test_score_source_credibility_news,
        test_score_source_credibility_blog,
        test_calculate_reputation_delta,
        test_get_reputation_tier_thresholds,
        test_parse_credibility_response_valid,
        test_parse_credibility_response_invalid,
        test_extract_domain,
        test_score_domain_gov,
        test_score_domain_edu,
        test_score_domain_unknown,
        test_parse_claims_response_valid,
        test_parse_claims_response_invalid,
        test_deduplicate_claims,
        test_get_primary_claim_with_primary,
        test_get_primary_claim_no_primary,
        test_content_hash_consistency,
        test_content_hash_uniqueness,
    ]

    passed = 0
    failed = 0
    for test in tests:
        try:
            test()
            print(f"  PASS  {test.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {test.__name__}: {e}")
            failed += 1
        except Exception as e:
            print(f"  ERROR {test.__name__}: {e}")
            failed += 1

    print(f"\n{passed} passed, {failed} failed out of {len(tests)} tests")
