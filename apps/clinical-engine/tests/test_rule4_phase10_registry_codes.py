from __future__ import annotations

import json
import unittest
from pathlib import Path

REPO = Path(__file__).resolve().parents[3]
PHASE10_REGISTRY = (
    REPO / "fixtures" / "rule4" / "reason-code-registry.phase10-doctor-review-issuance-subset.v1.json"
)


class Rule4Phase10RegistryCodes(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.registry = json.loads(PHASE10_REGISTRY.read_text(encoding="utf-8"))
        from ehas2_clinical_engine.rule4.registry_loader import load_reason_code_registry

        merged = load_reason_code_registry()
        cls.reason_set = {e["code"] for e in merged["reasonCodes"]}
        cls.limitation_set = {e["code"] for e in merged["limitationCodes"]}

    def test_phase10_reason_codes_known(self) -> None:
        for entry in self.registry["reasonCodes"]:
            with self.subTest(code=entry["code"]):
                self.assertIn(entry["code"], self.reason_set)

    def test_phase10_limitation_codes_known(self) -> None:
        for entry in self.registry["limitationCodes"]:
            with self.subTest(code=entry["code"]):
                self.assertIn(entry["code"], self.limitation_set)


if __name__ == "__main__":
    unittest.main()
