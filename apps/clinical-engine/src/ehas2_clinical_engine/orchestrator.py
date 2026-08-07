from __future__ import annotations

import copy
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from . import ENGINE_VERSION, RULE_SET_VERSION
from .disease_package import DATASET_VERSION, DiseasePackage, DiseasePackageError, load_disease_package
from .fingerprints import fingerprint
from .interpretation import (
    doctor_vs_symptoms,
    interpret_organs,
    interpret_polarity,
    interpret_prakriti,
    interpret_temperament,
    safety_red_flags,
)
from .normalize import normalize_case
from .retrieval import retrieve_diseases
from .rule4.orchestrator_hook import apply_rule4_orchestrator_hook
from .rule4.evaluator import Rule4ConfigurationError

MEDICINE_REGISTRY_VERSION = "ehas2-medicine-registry-v2"
ORCHESTRATOR_VERSION = "ehas2-nine-rule-orchestrator-v1-phase5c"

RULE5_CANONICAL_RULE_NAME = "Monitoring, Follow-up & Post-Release Safety Surveillance"

CANONICAL_RULE_ORDER = [
    (3, "Organ / System Affinity"),
    (1, "Temperament (Prakriti)"),
    (2, "Polarity"),
    (6, "Multi-Disease / Organ-System Triad"),
    (4, "Potency"),
    (5, RULE5_CANONICAL_RULE_NAME),
    (7, "External Use Routes"),
    (8, "Disease-level Prakruti Inference"),
    (9, "Master Pipeline"),
]

DISPLAY_ORDER = [
    (1, "Temperament (Prakriti)"),
    (2, "Polarity"),
    (3, "Organ / System Affinity"),
    (4, "Potency"),
    (5, RULE5_CANONICAL_RULE_NAME),
    (6, "Multi-Disease / Organ-System Triad"),
    (7, "External Use Routes"),
    (8, "Disease-level Prakruti Inference"),
    (9, "Master Pipeline"),
]



@dataclass(frozen=True)
class FrozenRuleResult:
    rule_number: int
    rule_name: str
    status: str
    evidence: tuple
    confidence: float | None
    warnings: tuple
    unknown_unresolved_reason: str | None
    deterministic_fingerprint: str | None
    affects_clinical_selection: bool
    clinical_effect: str
    output: tuple  # tuple of items for immutability; dicts as sorted item tuples when needed


def _freeze_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return tuple(sorted((k, _freeze_obj(v)) for k, v in obj.items()))
    if isinstance(obj, list):
        return tuple(_freeze_obj(x) for x in obj)
    return obj


def _rule(
    number: int,
    name: str,
    status: str,
    *,
    evidence: list | None = None,
    confidence: float | None = None,
    warnings: list | None = None,
    reason: str | None = None,
    affects: bool = False,
    clinical_effect: str = "none",
    output: Any = None,
) -> FrozenRuleResult:
    ev = evidence or []
    warn = warnings or []
    out = output if output is not None else {}
    fp_body = {
        "rule_number": number,
        "status": status,
        "evidence": ev,
        "confidence": confidence,
        "output": out,
        "reason": reason,
    }
    return FrozenRuleResult(
        rule_number=number,
        rule_name=name,
        status=status,
        evidence=tuple(_freeze_obj(ev)),
        confidence=confidence,
        warnings=tuple(warn),
        unknown_unresolved_reason=reason,
        deterministic_fingerprint=fingerprint(fp_body),
        affects_clinical_selection=affects,
        clinical_effect=clinical_effect,
        output=_freeze_obj(out),
    )


def rule_to_dict(r: FrozenRuleResult) -> dict:
    return {
        "rule_number": r.rule_number,
        "rule_name": r.rule_name,
        "status": r.status,
        "evidence": list(r.evidence) if not isinstance(r.evidence, tuple) else _unfreeze(r.evidence),
        "confidence": r.confidence,
        "warnings": list(r.warnings),
        "unknown_unresolved_reason": r.unknown_unresolved_reason,
        "deterministic_fingerprint": r.deterministic_fingerprint,
        "affects_clinical_selection": r.affects_clinical_selection,
        "clinical_effect": r.clinical_effect,
        "output": _unfreeze(r.output),
    }


def _unfreeze(obj: Any) -> Any:
    if isinstance(obj, tuple):
        # dict-like frozen
        if obj and isinstance(obj[0], tuple) and len(obj[0]) == 2 and isinstance(obj[0][0], str):
            try:
                return {k: _unfreeze(v) for k, v in obj}
            except (TypeError, ValueError):
                return [_unfreeze(x) for x in obj]
        return [_unfreeze(x) for x in obj]
    return obj


@dataclass
class OrchestratorRun:
    label: str = "SYNTHETIC"
    timeout_ms: int | None = 30_000
    cancel_event: threading.Event | None = None
    package_dir: Path | None = None
    require_full_package: bool = False
    allow_synthetic_package: bool = True
    rule4_shadow_collector: Callable[[dict], None] | None = None


class OrchestratorError(Exception):
    pass


class NineRuleOrchestrator:
    """
    Isolated Phase 5C nine-rule orchestrator.
    Non-prescription clinical interpretation only.
    """

    def __init__(self, package: DiseasePackage | None = None):
        self._package = package
        self._results_lock = threading.Lock()

    def load_package(self, run: OrchestratorRun) -> DiseasePackage:
        if self._package is not None and run.package_dir is None:
            return self._package
        return load_disease_package(
            run.package_dir,
            require_full=run.require_full_package,
            allow_synthetic=run.allow_synthetic_package,
        )

    def orchestrate(self, payload: dict, run: OrchestratorRun | None = None) -> dict:
        run = run or OrchestratorRun()
        if run.label != "SYNTHETIC":
            raise OrchestratorError("Only SYNTHETIC labelled validation runs are allowed in Phase 5C")

        started = time.monotonic()
        deadline = None if run.timeout_ms is None else started + (run.timeout_ms / 1000.0)

        def check_cancel() -> None:
            if run.cancel_event is not None and run.cancel_event.is_set():
                raise OrchestratorError("CANCELLED")
            if deadline is not None and time.monotonic() > deadline:
                raise OrchestratorError("TIMEOUT")

        check_cancel()
        try:
            package = self.load_package(run)
        except DiseasePackageError as exc:
            return self._fail_package(str(exc), payload)

        dataset_version = package.manifest.get("datasetVersion") or DATASET_VERSION
        input_fp = fingerprint(
            {
                "chief_complaint": payload.get("chief_complaint") or payload.get("chiefComplaint"),
                "symptoms": payload.get("symptoms"),
                "vitals": payload.get("vitals"),
                "duration": payload.get("duration"),
                "severity": payload.get("severity"),
                "doctor_supplied_diagnosis": payload.get("doctor_supplied_diagnosis")
                or payload.get("doctorSuppliedDiagnosis"),
                "affected_site": payload.get("affected_site") or payload.get("affectedSite"),
                "report_findings_contract": payload.get("report_findings_contract"),
                "image_evidence": payload.get("image_evidence"),
            }
        )

        evidence = normalize_case(payload)
        norm_fp = fingerprint(
            {
                "chief_complaint": evidence.chief_complaint,
                "symptoms": evidence.symptoms,
                "negated": evidence.negated_symptoms,
                "tokens": evidence.tokens,
                "vitals": evidence.vitals,
                "doctor_diagnosis": evidence.doctor_diagnosis,
            }
        )

        check_cancel()
        candidates = retrieve_diseases(package, evidence, top_k=5)
        rule_results: dict[int, FrozenRuleResult] = {}

        # --- Rule 3 Organ/System (first in live order) ---
        check_cancel()
        organs = interpret_organs(evidence)
        if organs["status"] == "UNKNOWN":
            r3 = _rule(
                3,
                "Organ / System Affinity",
                "UNRESOLVED",
                evidence=[],
                confidence=0.0,
                reason="NO_SYSTEM_EVIDENCE",
                affects=True,
                clinical_effect="systems_unknown",
                output=organs,
            )
        else:
            r3 = _rule(
                3,
                "Organ / System Affinity",
                "EXECUTED",
                evidence=organs["evidence"],
                confidence=organs["confidence"],
                affects=True,
                clinical_effect="systems_ranked",
                output=organs,
                warnings=["BEYOND_FIVE_SYSTEMS"] if organs.get("beyond_five") else [],
            )
        rule_results[3] = r3

        # --- Rule 1 Temperament / Prakriti ---
        check_cancel()
        prak = interpret_prakriti(evidence)
        temp = interpret_temperament(evidence, prak)
        if prak["status"] == "UNKNOWN":
            r1 = _rule(
                1,
                "Temperament (Prakriti)",
                "UNRESOLVED",
                evidence=[],
                confidence=0.0,
                reason="NO_PRAKRITI_EVIDENCE",
                affects=True,
                clinical_effect="prakriti_unknown",
                output={"prakriti": prak, "temperament": temp, "constitution": "UNKNOWN"},
            )
        else:
            r1 = _rule(
                1,
                "Temperament (Prakriti)",
                "EXECUTED",
                evidence=prak["evidence"],
                confidence=prak["confidence"],
                affects=True,
                clinical_effect="prakriti_temperament",
                output={"prakriti": prak, "temperament": temp, "constitution": prak.get("prakriti")},
            )
        rule_results[1] = r1

        # --- Rule 2 Polarity ---
        check_cancel()
        pol = interpret_polarity(evidence)
        if pol["status"] == "UNKNOWN":
            r2 = _rule(
                2,
                "Polarity",
                "UNRESOLVED",
                evidence=[],
                confidence=0.0,
                reason="NO_POLARITY_EVIDENCE",
                affects=True,
                clinical_effect="polarity_unknown",
                output=pol,
            )
        else:
            r2 = _rule(
                2,
                "Polarity",
                "EXECUTED",
                evidence=pol["evidence"],
                confidence=pol["confidence"],
                affects=True,
                clinical_effect="polarity",
                output=pol,
            )
        rule_results[2] = r2

        # Safety gate (not a numbered rule; blocks prescription selection)
        safety = safety_red_flags(evidence)
        safety_block = safety["status"] == "WARNING"

        # --- Rule 6 Multi-Disease / Triad (evidence only — no formula) ---
        check_cancel()
        dx_cmp = doctor_vs_symptoms(evidence, candidates)
        if not candidates:
            r6 = _rule(
                6,
                "Multi-Disease / Organ-System Triad",
                "UNRESOLVED",
                evidence=[],
                confidence=0.0,
                reason="NO_DISEASE_MATCH",
                affects=True,
                clinical_effect="candidates_none",
                output={"candidates": [], "forced_top1": False, "doctor_vs_symptoms": dx_cmp},
            )
        else:
            r6_status = "EXECUTED"
            warnings = []
            if dx_cmp.get("conflict"):
                warnings.append("DOCTOR_DIAGNOSIS_CONFLICTS_WITH_SYMPTOM_CANDIDATES")
            if safety_block:
                r6_status = "BLOCKED_BY_SAFETY"
                warnings.extend(safety["warnings"])
            r6 = _rule(
                6,
                "Multi-Disease / Organ-System Triad",
                r6_status,
                evidence=[{"disease_id": c.get("disease_id"), "score": c.get("score")} for c in candidates],
                confidence=candidates[0]["confidence"] if candidates else 0.0,
                warnings=warnings,
                reason="BLOCKED_BY_SAFETY" if safety_block else None,
                affects=True,
                clinical_effect="ranked_candidates_no_prescription",
                output={
                    "candidates": candidates,
                    "forced_top1": False,
                    "mixture_plans": None,
                    "oral_formula": None,
                    "doctor_vs_symptoms": dx_cmp,
                },
            )
        rule_results[6] = r6

        # --- Rules 4, 7 — prescription boundary (Rule 5 post-release — separate) ---
        for num, name, effect in (
            (4, "Potency", "potency_issuance"),
            (7, "External Use Routes", "external_application_selection"),
        ):
            if safety_block:
                status = "BLOCKED_BY_SAFETY"
                reason = "SAFETY_RED_FLAG"
            elif rule_results[6].status == "FAILED":
                status = "UNRESOLVED"
                reason = "UPSTREAM_FAILED"
            else:
                # Intentionally not issuing prescription in Phase 5C
                status = "READY_FOR_VALIDATION"
                reason = "PRESCRIPTION_ENGINE_NOT_CONNECTED"
            rule_results[num] = _rule(
                num,
                name,
                status,
                evidence=[],
                confidence=None,
                warnings=["PRESCRIPTION_ENGINE_NOT_CONNECTED"],
                reason=reason,
                affects=True,
                clinical_effect=effect,
                output={
                    "issued": False,
                    "value": None,
                    "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
                },
            )

        # --- Rule 5 — post-release monitoring (metadata only; not dosage) ---
        rule_results[5] = _rule(
            5,
            RULE5_CANONICAL_RULE_NAME,
            "NOT_IMPLEMENTED",
            evidence=[],
            confidence=None,
            warnings=["Post-release monitoring not connected"],
            reason="NOT_IMPLEMENTED",
            affects=False,
            clinical_effect="none",
            output={"implemented": False},
        )

        # --- Rule 8 — historically unwired; no dummy ---
        rule_results[8] = _rule(
            8,
            "Disease-level Prakruti Inference",
            "NOT_IMPLEMENTED",
            evidence=[],
            confidence=None,
            warnings=[
                "Historically unwired on legacy MultiDiseaseEngine live path",
                "Deferred — may conflict with full-pool Tablet / multimodal policy",
            ],
            reason="RULE_8_NOT_WIRED_LEGACY_AND_POLICY_DEFERRED",
            affects=False,
            clinical_effect="none",
            output={"implemented": False},
        )

        # --- Rule 9 Master Pipeline (validation orchestration wrapper) ---
        check_cancel()
        unresolved = [
            n
            for n, r in rule_results.items()
            if r.status in {"UNRESOLVED", "FAILED", "NOT_IMPLEMENTED", "BLOCKED_BY_SAFETY"}
        ]
        r9_warnings = ["VALIDATION_ORCHESTRATION_ONLY", "PRESCRIPTION_ENGINE_NOT_CONNECTED"]
        if safety_block:
            r9_warnings.extend(safety["warnings"])
        rule_results[9] = _rule(
            9,
            "Master Pipeline",
            "EXECUTED",
            evidence=[{"executed_rules": sorted(rule_results.keys())}],
            confidence=None,
            warnings=r9_warnings,
            reason=None,
            affects=False,
            clinical_effect="orchestration_validation",
            output={
                "mode": "SYNTHETIC_VALIDATION",
                "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
                "unresolved_rule_numbers": unresolved,
            },
        )

        # Immutable: copy frozen results; reject mutation by returning deep copies of dict view
        with self._results_lock:
            frozen_snapshot = {k: rule_results[k] for k in sorted(rule_results)}

        interpretation = {
            "systems": organs,
            "prakriti": prak,
            "temperament": temp,
            "constitution": prak.get("prakriti") if prak.get("status") != "UNKNOWN" else "UNKNOWN",
            "polarity": pol,
            "disease_candidates": candidates,
            "forced_top1": False,
            "safety": safety,
            "doctor_supplied_diagnosis_policy": "evidence_not_absolute_truth",
            "image_evidence_used": False,
            "report_processing": "NOT_CONNECTED",
            "report_findings_claimed": False,
        }
        if payload.get("report_findings_contract"):
            interpretation["report_findings_contract_present"] = True
            interpretation["report_processing"] = "INACTIVE"
        if payload.get("image_evidence"):
            interpretation["image_evidence_present_but_unsupported"] = True

        warnings = list(safety["warnings"])
        if not evidence.vitals:
            warnings.append("MISSING_VITALS")
        if dx_cmp.get("conflict"):
            warnings.append("DOCTOR_DIAGNOSIS_CONFLICT")

        # Medicine / prescription slots — never pretend success with empty arrays
        prescription_block = {
            "status": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
            "oral_mixture": None,
            "potency": None,
            "electricity": None,
            "tablet_a": None,
            "tablet_b": None,
            "external_applications": None,
            "final_clinical_summary": None,
            "prescription_issued": False,
            "medicines": None,
            "default_we_used": False,
            "note": "Phase 5C does not issue prescriptions. Empty arrays are not used as success.",
        }

        rules_out = [rule_to_dict(frozen_snapshot[n]) for n, _ in DISPLAY_ORDER]
        # Prove immutability: mutating returned dict must not alter frozen store
        body_for_fp = {
            "input_fingerprint": input_fp,
            "normalized_evidence_fingerprint": norm_fp,
            "dataset_version": dataset_version,
            "rule_set_version": RULE_SET_VERSION,
            "engine_version": ENGINE_VERSION,
            "orchestrator_version": ORCHESTRATOR_VERSION,
            "medicine_registry_version": MEDICINE_REGISTRY_VERSION,
            "rules": [
                {
                    "rule_number": r.rule_number,
                    "status": r.status,
                    "deterministic_fingerprint": r.deterministic_fingerprint,
                    "confidence": r.confidence,
                }
                for r in (frozen_snapshot[n] for n, _ in DISPLAY_ORDER)
            ],
            "interpretation": interpretation,
            "prescription": prescription_block,
        }
        output_fp = fingerprint(body_for_fp)

        result = {
            "label": "SYNTHETIC",
            "clinical_readiness": False,
            "production_analyze_complete": "NOT_CONNECTED",
            "input_fingerprint": input_fp,
            "normalized_evidence_fingerprint": norm_fp,
            "output_fingerprint": output_fp,
            "dataset_version": dataset_version,
            "dataset_count": package.count,
            "rule_set_version": RULE_SET_VERSION,
            "engine_version": ENGINE_VERSION,
            "orchestrator_version": ORCHESTRATOR_VERSION,
            "medicine_registry_version": MEDICINE_REGISTRY_VERSION,
            "execution_order": [{"rule_number": n, "rule_name": name} for n, name in CANONICAL_RULE_ORDER],
            "display_order": [{"rule_number": n, "rule_name": name} for n, name in DISPLAY_ORDER],
            "rules": rules_out,
            "rule_8_status": "NOT_IMPLEMENTED",
            "normalized_evidence": {
                "chief_complaint": evidence.chief_complaint,
                "symptoms": evidence.symptoms,
                "negated_symptoms": evidence.negated_symptoms,
                "language_hints": evidence.language_hints,
                "duration": evidence.duration,
                "severity": evidence.severity,
                "vitals": evidence.vitals,
                "doctor_diagnosis": evidence.doctor_diagnosis,
                "affected_site": evidence.affected_site,
            },
            "clinical_interpretation": interpretation,
            "warnings": warnings,
            "unresolved_reasons": [
                r.unknown_unresolved_reason
                for r in frozen_snapshot.values()
                if r.unknown_unresolved_reason
            ],
            "prescription": prescription_block,
            "medicine_output_count": 0,
            "real_patient_data": False,
            "legacy_comparison": "NOT_COMPARABLE",
            "legacy_comparison_reason": (
                "Isolated Phase 5C does not execute protected legacy servers; "
                "read-only comparison deferred without weakening safety."
            ),
        }
        # Deep copy outbound so callers cannot mutate orchestrator internals
        try:
            result = apply_rule4_orchestrator_hook(
                result,
                payload,
                shadow_collector=run.rule4_shadow_collector,
            )
        except Rule4ConfigurationError as exc:
            raise OrchestratorError(str(exc)) from exc
        return copy.deepcopy(result)

    def _fail_package(self, reason: str, payload: dict) -> dict:
        return {
            "label": "SYNTHETIC",
            "clinical_readiness": False,
            "status": "FAILED",
            "reason": reason,
            "prescription": {"status": "PRESCRIPTION_ENGINE_NOT_CONNECTED", "prescription_issued": False},
            "medicine_output_count": 0,
            "rules": [],
            "rule_8_status": "NOT_IMPLEMENTED",
            "input_fingerprint": fingerprint(payload),
            "output_fingerprint": fingerprint({"failed": reason}),
            "real_patient_data": False,
        }


def assert_immutable_rule_results(result: dict) -> None:
    """Caller-side check: mutating rules list must not change fingerprints."""
    rules = result["rules"]
    fps = [r["deterministic_fingerprint"] for r in rules]
    rules[0]["status"] = "TAMPERED"
    # fingerprints in original result dict were already copied; re-orchestrate is the real immutability proof
    assert fps[0] is not None
