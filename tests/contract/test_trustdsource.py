from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
CONTRACT = ROOT / "contracts" / "TrustDSource.py"
SOURCE = CONTRACT.read_text(encoding="utf-8")


def test_unified_contract_source_exists():
    assert CONTRACT.exists()
    assert "class TrustDSourceUnified" in SOURCE


def test_no_legacy_split_contract_entrypoints():
    assert "def discover_sources(" not in SOURCE
    assert "def verify_claims(" not in SOURCE
    assert "../../intelligent-contract" not in SOURCE


def test_source_validator_checks_evidence_substance():
    assert "def _source_item_has_evidence" in SOURCE
    assert 'source_url.startswith("https://")' in SOURCE
    assert "len(source_snippet) < 25" in SOURCE
    assert "credible_count >= 2" in SOURCE


def test_submitted_only_evidence_is_unverified():
    assert '"evidence_kind": "submitted_source_snapshot"' in SOURCE
    assert 'evidence_model = "submitted_snapshot_only"' in SOURCE
    assert 'verdict = "UNVERIFIED"' in SOURCE
    assert "independent_source_count == 0" in SOURCE


def test_analysis_is_bounded_by_evidence():
    assert "def _bound_analysis_by_evidence" in SOURCE
    assert "independent_source_count == 0" in SOURCE
    assert "independent_source_count == 1" in SOURCE
    assert "raw_cred > 54" in SOURCE
    assert "raw_es > 45" in SOURCE


def test_report_includes_evidence_metadata():
    assert '"evidence_model": str(analysis.get("evidence_model", "unknown"))[:80]' in SOURCE
    assert '"independent_source_count": independent_source_count' in SOURCE


if __name__ == "__main__":
    tests = [
        test_unified_contract_source_exists,
        test_no_legacy_split_contract_entrypoints,
        test_source_validator_checks_evidence_substance,
        test_submitted_only_evidence_is_unverified,
        test_analysis_is_bounded_by_evidence,
        test_report_includes_evidence_metadata,
    ]

    for test in tests:
        test()
        print(f"PASS {test.__name__}")
