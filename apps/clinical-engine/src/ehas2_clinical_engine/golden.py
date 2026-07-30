from __future__ import annotations

import json
import threading
from pathlib import Path

from .disease_package import synthetic_fixture_dir
from .orchestrator import NineRuleOrchestrator, OrchestratorRun


def golden_cases_path() -> Path:
    return Path(__file__).resolve().parents[4] / "fixtures" / "synthetic" / "clinical" / "golden" / "cases.json"


def load_golden_cases() -> list[dict]:
    return json.loads(golden_cases_path().read_text(encoding="utf-8"))


def _rule_by_number(result: dict, n: int) -> dict:
    return next(r for r in result["rules"] if r["rule_number"] == n)


def evaluate_case(case: dict, result: dict) -> dict:
    expect = case.get("expect") or {}
    failures: list[str] = []
    interp = result.get("clinical_interpretation") or {}
    candidates = interp.get("disease_candidates") or []
    systems = (interp.get("systems") or {}).get("systems") or []
    prak = interp.get("prakriti") or {}
    pol = interp.get("polarity") or {}
    temp = interp.get("temperament") or {}
    warnings = result.get("warnings") or []

    if "min_candidates" in expect:
        if len(candidates) < expect["min_candidates"]:
            failures.append(f"min_candidates expected {expect['min_candidates']} got {len(candidates)}")
        if expect["min_candidates"] == 0 and len(candidates) != 0:
            failures.append("expected zero candidates")

    if expect.get("systems_min") and len(systems) < expect["systems_min"]:
        failures.append(f"systems_min {expect['systems_min']} got {len(systems)}")

    if expect.get("language_hi"):
        hints = (result.get("normalized_evidence") or {}).get("language_hints") or []
        if "hi" not in hints:
            failures.append("expected hindi language hint")

    if expect.get("negated_contains"):
        neg = " ".join((result.get("normalized_evidence") or {}).get("negated_symptoms") or [])
        if expect["negated_contains"] not in neg:
            failures.append("negated symptom missing")

    if "forced_top1" in expect and interp.get("forced_top1") is not False:
        failures.append("forced_top1 must be false")

    if expect.get("rule6"):
        if _rule_by_number(result, 6)["status"] != expect["rule6"]:
            failures.append(f"rule6 expected {expect['rule6']}")

    if expect.get("has_warning_prefix"):
        if not any(str(w).startswith(expect["has_warning_prefix"]) for w in warnings):
            # also check rule6 warnings
            r6w = _rule_by_number(result, 6).get("warnings") or []
            if not any(str(w).startswith(expect["has_warning_prefix"]) for w in r6w):
                failures.append("missing warning prefix")

    if expect.get("safety_warning"):
        sw = (interp.get("safety") or {}).get("warnings") or []
        if expect["safety_warning"] not in sw:
            failures.append("missing safety warning")

    if expect.get("prakriti"):
        if str(prak.get("prakriti")) != expect["prakriti"]:
            failures.append(f"prakriti expected {expect['prakriti']} got {prak.get('prakriti')}")

    if expect.get("prakriti_unknown_or_mixed"):
        if prak.get("status") not in {"UNKNOWN", "MIXED"} and prak.get("prakriti") not in {
            "UNKNOWN",
            "MIXED",
        }:
            failures.append("expected unknown/mixed prakriti")

    if expect.get("polarity"):
        if str(pol.get("polarity")) != expect["polarity"]:
            failures.append(f"polarity expected {expect['polarity']}")

    if expect.get("polarity_mixed_or_unknown"):
        if pol.get("polarity") not in {"MIXED", "UNKNOWN"} and pol.get("status") not in {
            "MIXED",
            "UNKNOWN",
        }:
            failures.append("expected mixed/unknown polarity")

    if expect.get("temperament_not_unknown"):
        if temp.get("temperament") in {None, "UNKNOWN"} or temp.get("status") == "UNKNOWN":
            failures.append("expected temperament evidence")

    if expect.get("temperament") == "UNKNOWN":
        if temp.get("temperament") != "UNKNOWN" and temp.get("status") != "UNKNOWN":
            failures.append("expected unknown temperament")

    if expect.get("beyond_five"):
        if not (interp.get("systems") or {}).get("beyond_five"):
            failures.append("expected beyond_five systems")

    if expect.get("noise_not_top"):
        if candidates and "gene" in str(candidates[0].get("name_english") or "").lower():
            failures.append("noise disease ranked top")

    if expect.get("missing_vitals_warning"):
        if "MISSING_VITALS" not in warnings:
            failures.append("expected MISSING_VITALS")

    if expect.get("image_not_used"):
        if interp.get("image_evidence_used") is not False:
            failures.append("image must not be used")

    if expect.get("report_inactive"):
        if interp.get("report_processing") not in {"INACTIVE", "NOT_CONNECTED"}:
            failures.append("report processing should be inactive")
        if interp.get("report_findings_claimed"):
            failures.append("must not claim report findings")

    # Universal gates
    if result.get("prescription", {}).get("status") != "PRESCRIPTION_ENGINE_NOT_CONNECTED":
        failures.append("prescription must be NOT_CONNECTED")
    if result.get("medicine_output_count") != 0:
        failures.append("medicine_output_count must be 0")
    if result.get("rule_8_status") != "NOT_IMPLEMENTED":
        failures.append("rule 8 must be NOT_IMPLEMENTED")
    if result.get("clinical_readiness") is not False:
        failures.append("clinical_readiness must be false")
    if case.get("label") != "SYNTHETIC" or result.get("label") != "SYNTHETIC":
        failures.append("label must be SYNTHETIC")

    return {
        "id": case["id"],
        "title": case["title"],
        "passed": len(failures) == 0,
        "failures": failures,
        "legacy_comparison": result.get("legacy_comparison", "NOT_COMPARABLE"),
        "output_fingerprint": result.get("output_fingerprint"),
    }


def run_all_golden(*, repetitions: int = 2) -> dict:
    cases = load_golden_cases()
    orch = NineRuleOrchestrator()
    run = OrchestratorRun(
        label="SYNTHETIC",
        package_dir=synthetic_fixture_dir(),
        allow_synthetic_package=True,
        require_full_package=False,
    )
    results = []
    determinism_ok = True
    for case in cases:
        outputs = []
        for _ in range(repetitions):
            outputs.append(orch.orchestrate(case["input"], run))
        fps = [o["output_fingerprint"] for o in outputs]
        if len(set(fps)) != 1:
            determinism_ok = False
        evaluation = evaluate_case(case, outputs[0])
        if not determinism_ok or len(set(fps)) != 1:
            evaluation["failures"].append("determinism_failed")
            evaluation["passed"] = False
        evaluation["determinism_fingerprints"] = fps
        results.append(evaluation)

    passed = sum(1 for r in results if r["passed"])
    return {
        "total": len(results),
        "passed": passed,
        "failed": len(results) - passed,
        "review_required": sum(1 for r in results if r.get("legacy_comparison") == "DIVERGENT_REQUIRES_REVIEW"),
        "determinism": "PASS" if determinism_ok and all(r["passed"] or "determinism_failed" not in r["failures"] for r in results) else "FAIL",
        "cases": results,
        "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
        "clinical_readiness": False,
    }


def run_timeout_case() -> str:
    orch = NineRuleOrchestrator()
    ev = threading.Event()
    ev.set()
    run = OrchestratorRun(
        label="SYNTHETIC",
        package_dir=synthetic_fixture_dir(),
        cancel_event=ev,
        allow_synthetic_package=True,
    )
    try:
        orch.orchestrate({"chief_complaint": "fever", "symptoms": ["fever"]}, run)
        return "UNEXPECTED_SUCCESS"
    except Exception as exc:  # noqa: BLE001
        return type(exc).__name__ + ":" + str(exc)
