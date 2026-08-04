"""Rule 4 Phase 9 pediatric overlay fingerprint byte parity (fixed golden references)."""

from __future__ import annotations

import hashlib
import json
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "src"
REPO = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from rule4_phase9_context import evaluate_pediatric_overlay_from_fixture_scenario  # noqa: E402

from ehas2_clinical_engine.rule4.pediatric_overlay.evaluate_pediatric_overlay_adapter import (  # noqa: E402
    evaluate_pediatric_overlay_adapter,
)
from ehas2_clinical_engine.rule4.pediatric_overlay.pediatric_overlay_fingerprint_v1 import (  # noqa: E402
    rule4_pediatric_overlay_fingerprint_v1_hash,
    rule4_pediatric_overlay_fingerprint_v1_payload,
)

FIXTURE = REPO / "fixtures" / "rule4" / "pediatric-overlay-scenarios.v1.json"


def _evaluate_overlay_from_scenario(scenario: dict) -> tuple[dict, dict]:
    return evaluate_pediatric_overlay_from_fixture_scenario(scenario)


class Rule4Phase9FingerprintReferenceTests(unittest.TestCase):
    def test_fingerprint_v1_references(self) -> None:
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        refs = fixture.get("fingerprintV1References") or []
        self.assertGreaterEqual(len(refs), 8)
        for ref in refs:
            scenario = next(s for s in fixture["scenarios"] if s["id"] == ref["scenario_id"])
            out, safety = _evaluate_overlay_from_scenario(scenario)
            payload = rule4_pediatric_overlay_fingerprint_v1_payload(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                d13_hs_active=safety["d13_hs_active"],
                patient_wide_hold=safety["patient_wide_hold"],
                urgent_escalation_required=safety["urgent_escalation_required"],
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            digest = hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()
            fn_digest = rule4_pediatric_overlay_fingerprint_v1_hash(
                ruleset_version=out["ruleset_version"],
                registry_version=out["registry_version"],
                d13_hs_active=safety["d13_hs_active"],
                patient_wide_hold=safety["patient_wide_hold"],
                urgent_escalation_required=safety["urgent_escalation_required"],
                slot_resolutions=list(out["slot_resolutions"]),
                reason_codes=list(out["reason_codes"]),
                limitation_codes=list(out["limitation_codes"]),
            )
            self.assertEqual(payload, ref["canonical_payload"])
            self.assertEqual(digest, ref["pediatric_overlay_sha256"].upper())
            self.assertEqual(fn_digest, ref["pediatric_overlay_sha256"].upper())
            self.assertIn("rule4-pediatric-overlay-fingerprint-v1", ref["canonical_payload"])

    def test_reference_hashes_pairwise_distinct(self) -> None:
        fixture = json.loads(FIXTURE.read_text(encoding="utf-8"))
        by_id = {r["reference_id"]: r["pediatric_overlay_sha256"] for r in fixture["fingerprintV1References"]}
        required = [
            "ref-p13c-d5-allow",
            "ref-p13c-d10-restrict-pass",
            "ref-p13c-d30-prohibit",
            "ref-p13d-d30-restrict-pass",
            "ref-p13e-pass-through",
            "ref-p13b-d13hs",
            "ref-p13b-crisis-d13hs",
            "ref-phase8-fp-mismatch",
        ]
        hashes = [by_id[i] for i in required]
        self.assertEqual(len(set(hashes)), len(hashes))


class Rule4Phase9FingerprintSmokeTests(unittest.TestCase):
    def test_production_adapter_emits_fingerprint(self) -> None:
        out = evaluate_pediatric_overlay_adapter(
            {
                "contract_version": "ehas2-rule4-contract-v1-phase9-pediatric-overlay",
                "ruleset_version": "ehas2-rule4-ruleset-v1-frozen-doc-4c35469",
                "registry_version": "rule4-reason-codes-phase9-pediatric-overlay-subset-v1",
                "label": "PRODUCTION",
                "formula_slot_ids": ["s1"],
                "slot_overlay_records": [],
            }
        )
        self.assertEqual(len(out["deterministic_pediatric_overlay_fingerprint"]), 64)
        self.assertTrue(out["deterministic_pediatric_overlay_fingerprint"].isupper())


if __name__ == "__main__":
    unittest.main()
