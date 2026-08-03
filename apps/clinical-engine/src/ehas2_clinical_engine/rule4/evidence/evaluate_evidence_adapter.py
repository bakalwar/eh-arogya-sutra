from __future__ import annotations

from ..registry_paths import RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE
from ..registry_validation import validate_rule4_output_codes
from .evidence_fingerprint_v1 import rule4_evidence_pool_fingerprint_v1_hash
from .supersession import (
    apply_supersession,
    is_comparable_timestamp,
    normalized_finding_signature,
    supersession_group_key,
)

TIER2_DOC_MIN = 0.85
TIER3_DOC_MIN = 0.8
TIER2_ITEM_MIN = 0.9
TIER3_ITEM_MIN = 0.85
TIER4A_ENTITY_MIN = 0.8
TIER4B_ALIGN_MIN = 0.8
TIER1_CONFIDENCE = 1.0

POSITIVE_ASSERTIONS = {"PRESENT", "POSITIVE"}

FORBIDDEN_PHI = ('"patient_name"', '"phone"', '"address"', '"raw_report_text"')


class Rule4EvidenceAdapterValidationError(ValueError):
    code = "RULE4_EVIDENCE_ADAPTER_VALIDATION_FAILED"


def _requires_model_calibration_doc(doc: dict) -> bool:
    st = doc.get("source_type")
    if st == "OCR_EXTRACTED_DOCUMENT_IMAGE":
        return True
    if st == "DOCTOR_FREE_TEXT_NLP_EXTRACTION":
        return True
    if st == "DIGITAL_STRUCTURED_REPORT" and doc.get("extraction_model_derived") is True:
        return True
    return False


def _requires_item_model_calibration(item: dict) -> bool:
    st = item.get("source_type")
    if st == "OCR_EXTRACTED_DOCUMENT_IMAGE":
        return True
    if st == "DOCTOR_FREE_TEXT_NLP_EXTRACTION":
        return True
    if st == "DIGITAL_STRUCTURED_REPORT" and item.get("extraction_model_derived") is True:
        return True
    return False


def evaluate_document_gate(doc: dict) -> dict:
    reason_codes: list[str] = []
    limitation_codes: list[str] = []
    if doc.get("source_type") == "CLINICAL_PHOTO_RAW":
        reason_codes.append("CLINICAL_PHOTO_NOT_USABLE_ALONE")
        return {
            "document_id": doc["document_id"],
            "passed": False,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if _requires_model_calibration_doc(doc):
        status = doc.get("model_calibration_status") or "NOT_CALIBRATED"
        if status != "CALIBRATED_AND_VERIFIED":
            reason_codes.append("UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION")
            return {
                "document_id": doc["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
    st = doc.get("source_type")
    if st in {"DOCTOR_STRUCTURED_ENTRY", "DOCTOR_STRUCTURED_PHOTO_OBSERVATION"}:
        return {
            "document_id": doc["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "DIGITAL_STRUCTURED_REPORT":
        score = doc.get("document_integrity_score")
        if score is None or score < TIER2_DOC_MIN:
            reason_codes.append("D08_DOCUMENT_GATE_FAILED")
            return {
                "document_id": doc["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        return {
            "document_id": doc["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "OCR_EXTRACTED_DOCUMENT_IMAGE":
        score = doc.get("document_readability_score")
        if score is None or score < TIER3_DOC_MIN:
            reason_codes.append("D08_DOCUMENT_GATE_FAILED")
            return {
                "document_id": doc["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        return {
            "document_id": doc["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st in {"DOCTOR_FREE_TEXT_NLP_EXTRACTION", "DATASET_TAXONOMY_ALIGNMENT"}:
        return {
            "document_id": doc["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    reason_codes.append("UNKNOWN_SOURCE_TYPE")
    return {
        "document_id": doc["document_id"],
        "passed": False,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
    }


def evaluate_item_gate(item: dict, doc: dict | None, document_gate_passed: bool) -> dict:
    reason_codes: list[str] = []
    limitation_codes: list[str] = []
    if not document_gate_passed:
        reason_codes.append("D08_DOCUMENT_GATE_FAILED")
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": False,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if item.get("source_type") == "CLINICAL_PHOTO_RAW":
        reason_codes.append("CLINICAL_PHOTO_NOT_USABLE_ALONE")
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": False,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if _requires_item_model_calibration(item):
        status = item.get("model_calibration_status") or (
            doc.get("model_calibration_status") if doc else None
        ) or "NOT_CALIBRATED"
        if status != "CALIBRATED_AND_VERIFIED":
            reason_codes.append("UNCALIBRATED_MODEL_BLOCKED_PRE_EXECUTION")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
    score = item.get("confidence_score")
    st = item.get("source_type")
    if st not in {"DOCTOR_STRUCTURED_ENTRY", "DOCTOR_STRUCTURED_PHOTO_OBSERVATION"}:
        if score is None or score < 0 or score > 1:
            reason_codes.append("MISSING_CONFIDENCE_SCORE")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
    if st in {"DOCTOR_STRUCTURED_ENTRY", "DOCTOR_STRUCTURED_PHOTO_OBSERVATION"}:
        if score != TIER1_CONFIDENCE:
            reason_codes.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "DIGITAL_STRUCTURED_REPORT":
        if score < TIER2_ITEM_MIN:
            reason_codes.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "OCR_EXTRACTED_DOCUMENT_IMAGE":
        if score < TIER3_ITEM_MIN:
            reason_codes.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "DOCTOR_FREE_TEXT_NLP_EXTRACTION":
        if score < TIER4A_ENTITY_MIN:
            reason_codes.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        limitation_codes.append("TIER4A_SUPPORTED_CANDIDATE_ONLY")
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    if st == "DATASET_TAXONOMY_ALIGNMENT":
        if score < TIER4B_ALIGN_MIN:
            reason_codes.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
            return {
                "finding_id": item["finding_id"],
                "document_id": item["document_id"],
                "passed": False,
                "reason_codes": reason_codes,
                "limitation_codes": limitation_codes,
            }
        limitation_codes.append("DATASET_TAXONOMY_SUPPORTING_ONLY")
        return {
            "finding_id": item["finding_id"],
            "document_id": item["document_id"],
            "passed": True,
            "reason_codes": reason_codes,
            "limitation_codes": limitation_codes,
        }
    reason_codes.append("UNKNOWN_SOURCE_TYPE")
    return {
        "finding_id": item["finding_id"],
        "document_id": item["document_id"],
        "passed": False,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
    }


def _resolve_port(ports: list[dict], slot_id: str) -> dict | None:
    for p in ports:
        if p.get("formula_slot_id") == slot_id:
            return p
    return None


def _validate_binding(item: dict, port: dict | None) -> tuple[bool, list[str], list[str]]:
    reason: list[str] = []
    lim: list[str] = []
    if not port or port.get("port_status") != "RESOLVED":
        reason.append("RULE3_BINDING_PORT_NOT_RESOLVED")
        return False, reason, lim
    for key in ("formula_target_id", "organ_system_key", "anatomical_site", "pathology_id"):
        if not port.get(key):
            reason.append("MISSING_MANDATORY_BINDING_FIELD")
            return False, reason, lim
    if item.get("formula_target_id") != port.get("formula_target_id"):
        reason.append("CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED")
        return False, reason, lim
    if item.get("target_organ_system") != port.get("organ_system_key"):
        reason.append("ORGAN_SYSTEM_BINDING_MISMATCH")
        return False, reason, lim
    if item.get("anatomical_site") != port.get("anatomical_site"):
        reason.append("ANATOMICAL_SITE_BINDING_MISMATCH")
        return False, reason, lim
    if item.get("target_pathology_group_id"):
        reason.append("PATHOLOGY_PARENT_GROUP_MATCH_NOT_EXECUTABLE")
        lim.append("TIER3_PATHOLOGY_MAPPING_DATA_ASSET_NOT_EXECUTABLE")
        return False, reason, lim
    if item.get("target_pathology_id") != port.get("pathology_id"):
        reason.append("PATHOLOGY_ID_BINDING_MISMATCH")
        return False, reason, lim
    if item.get("formula_slot_id") != port.get("formula_slot_id"):
        reason.append("CROSS_FORMULA_REPORT_LEAKAGE_BLOCKED")
        return False, reason, lim
    return True, reason, lim


def _assertion_ok(status: str) -> tuple[bool, list[str]]:
    if status in POSITIVE_ASSERTIONS:
        return True, []
    mapping = {
        "NEGATED": "NEGATED_ASSERTION_EXCLUDED",
        "RULE_OUT": "NEGATED_ASSERTION_EXCLUDED",
        "SUSPECTED": "SUSPECTED_ASSERTION_EXCLUDED",
        "HISTORICAL_ONLY": "HISTORICAL_ONLY_EXCLUDED",
        "RESOLVED": "HISTORICAL_ONLY_EXCLUDED",
    }
    code = mapping.get(status, "AMBIGUOUS_ASSERTION_EXCLUDED")
    return False, [code]


def _mandatory_missing(item: dict) -> list[str]:
    missing = []
    for key in (
        "finding_id",
        "document_id",
        "parent_source_id",
        "source_type",
        "source_reference",
        "timestamp_or_case_context",
        "formula_slot_id",
        "formula_target_id",
        "target_organ_system",
        "anatomical_site",
        "target_pathology_id",
        "assertion_status",
        "verification_status",
        "formula_relevance",
    ):
        if item.get(key) in (None, ""):
            missing.append(key)
    if item.get("confidence_score") is None:
        missing.append("confidence_score")
    if item.get("requires_interpretation_fields"):
        if item.get("value") in (None, ""):
            missing.append("value")
        if not item.get("unit"):
            missing.append("unit")
    return missing


def _d04_usable(item: dict, item_gate_passed: bool, binding_passed: bool) -> tuple[bool, list[str], list[str]]:
    reason: list[str] = []
    lim: list[str] = []
    if _mandatory_missing(item):
        reason.append("MISSING_MANDATORY_BINDING_FIELD")
        return False, reason, lim
    if not item_gate_passed:
        reason.append("ITEM_BELOW_CONFIDENCE_THRESHOLD")
        return False, reason, lim
    ok, ar = _assertion_ok(item.get("assertion_status", ""))
    if not ok:
        reason.extend(ar)
        return False, reason, lim
    if item.get("verification_status") not in {"SUPPORTED", "VERIFIED"}:
        reason.append("INVALID_NOT_USABLE")
        return False, reason, lim
    if item.get("formula_relevance") != "DIRECT":
        if item.get("source_type") == "DATASET_TAXONOMY_ALIGNMENT":
            reason.append("DATASET_TAXONOMY_SUPPORTING_ONLY")
        else:
            reason.append("FORMULA_RELEVANCE_NOT_DIRECT")
        return False, reason, lim
    if not binding_passed:
        return False, reason, lim
    if item.get("source_type") == "DATASET_TAXONOMY_ALIGNMENT":
        reason.append("DATASET_TAXONOMY_SUPPORTING_ONLY")
        lim.append("DATASET_TAXONOMY_SUPPORTING_ONLY")
        return False, reason, lim
    return True, reason, lim


def _dedupe_key(item: dict) -> str:
    identity = item.get("finding_identity_key") or item["finding_id"]
    return "|".join(
        [
            item["parent_source_id"],
            identity,
            item["assertion_status"],
            item["target_organ_system"],
            item["anatomical_site"],
            item["target_pathology_id"],
            item["formula_slot_id"],
            item["formula_target_id"],
            item.get("test_panel_identity") or "",
            item.get("laterality") or "",
        ]
    )


def _plan_dedupe(items: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = {}
    for item in items:
        key = _dedupe_key(item)
        groups.setdefault(key, []).append(item)
    plans = []
    for key, group in groups.items():
        sorted_g = sorted(group, key=lambda x: x["finding_id"])
        rep = sorted_g[0]
        plans.append(
            {
                "representative_finding_id": rep["finding_id"],
                "duplicate_finding_ids": [x["finding_id"] for x in sorted_g[1:]],
                "dedupe_group_key": key,
            }
        )
    return sorted(plans, key=lambda p: p["dedupe_group_key"])


def _is_duplicate(fid: str, plans: list[dict]) -> bool:
    return any(fid in p["duplicate_finding_ids"] for p in plans)


def _contradiction(slot_id: str, active: list[dict]) -> dict:
    slot_items = [i for i in active if i.get("formula_slot_id") == slot_id]
    buckets: dict[str, list[dict]] = {}
    for item in slot_items:
        if item.get("assertion_status") not in POSITIVE_ASSERTIONS:
            continue
        if not is_comparable_timestamp(item.get("timestamp_or_case_context")):
            key = f"{supersession_group_key(item)}|__NO_TS__|{item['finding_id']}"
        else:
            key = f"{supersession_group_key(item)}|{item['timestamp_or_case_context']}"
        buckets.setdefault(key, []).append(item)
    for group in buckets.values():
        if len(group) < 2:
            continue
        sigs = {normalized_finding_signature(g) for g in group}
        if len(sigs) > 1:
            return {
                "formula_slot_id": slot_id,
                "evidence_status": "CONTRADICTORY_EVIDENCE",
                "doctor_review_required": True,
                "reason_codes": ["CONTRADICTORY_EVIDENCE"],
                "limitation_codes": ["PHASE3_NO_POTENCY_CASCADE"],
            }
    return {
        "formula_slot_id": slot_id,
        "evidence_status": "CLEAR",
        "doctor_review_required": True,
        "reason_codes": [],
        "limitation_codes": [],
    }


def _quarantine(probe: dict | None) -> list[str]:
    if not probe:
        return []
    reason: list[str] = []
    for key, val in probe.items():
        if val is not True:
            continue
        if key in {"global_text", "globalText", "sys_text_full", "sysTextFull"}:
            reason.append("GLOBAL_TEXT_POTENCY_LEAKAGE_BLOCKED")
        elif key in {"registry_nearest_match", "nearest_match_pathology"}:
            reason.append("REGISTRY_Q16_SELECTOR_BLOCKED")
        elif key == "disease_keyword":
            reason.append("REPORT_KEYWORD_SELECTOR_BLOCKED")
        elif key in {"potency_logic", "registry_potency_logic"}:
            reason.append("REGISTRY_POTENCY_SELECTOR_NOT_EXECUTABLE")
        elif key in {"raw_ocr_text", "rawOcrText"}:
            reason.append("REPORT_KEYWORD_SELECTOR_BLOCKED")
    return sorted(set(reason))


def _validate_quarantine_probe(probe: dict | None) -> None:
    if not probe:
        return
    allowed = {
        "global_text",
        "globalText",
        "sys_text_full",
        "sysTextFull",
        "disease_keyword",
        "registry_nearest_match",
        "potency_logic",
        "raw_ocr_text",
        "rawOcrText",
        "keyword_selector",
        "keywordSelector",
        "registry_potency_logic",
        "nearest_match_pathology",
        "nearestMatchPathology",
        "clinical_photo_inference",
        "clinicalPhotoInference",
    }
    for key, val in probe.items():
        if key not in allowed:
            raise Rule4EvidenceAdapterValidationError("quarantine_probe key not allowed")
        if not isinstance(val, bool):
            raise Rule4EvidenceAdapterValidationError("quarantine_probe value must be boolean")


def evaluate_evidence_adapter(input_contract: dict) -> dict:
    if input_contract.get("contract_version") != RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE:
        raise Rule4EvidenceAdapterValidationError("contract_version not supported for Phase 3 evidence")
    raw = str(input_contract)
    for pat in FORBIDDEN_PHI:
        if pat in raw:
            raise Rule4EvidenceAdapterValidationError("PHI field prohibited")

    quarantine_codes = _quarantine(input_contract.get("quarantine_probe"))
    _validate_quarantine_probe(input_contract.get("quarantine_probe"))
    documents = input_contract.get("documents") or []
    items = input_contract.get("items") or []
    ports = input_contract.get("rule3_binding_ports") or []

    doc_by_id = {d["document_id"]: d for d in documents}
    document_gate_results = [evaluate_document_gate(d) for d in documents]
    doc_pass = {r["document_id"]: r["passed"] for r in document_gate_results}

    item_gate_results = [
        evaluate_item_gate(item, doc_by_id.get(item["document_id"]), doc_pass.get(item["document_id"]) is True)
        for item in items
    ]
    item_gate_pass = {r["finding_id"]: r["passed"] for r in item_gate_results}
    item_gate_by_id = {r["finding_id"]: r for r in item_gate_results}

    ignored_audit: list[dict] = []
    usable_candidates: list[dict] = []

    for item in items:
        port = _resolve_port(ports, item["formula_slot_id"])
        binding_passed, br, bl = _validate_binding(item, port)
        ig = item_gate_pass.get(item["finding_id"]) is True
        usable, dr, dl = _d04_usable(item, ig, binding_passed)
        igr = item_gate_by_id[item["finding_id"]]
        reason_codes = sorted(
            set(
                (["D08_DOCUMENT_GATE_FAILED"] if doc_pass.get(item["document_id"]) is not True else [])
                + igr["reason_codes"]
                + br
                + dr
            )
        )
        limitation_codes = sorted(set(igr["limitation_codes"] + bl + dl))
        if usable:
            usable_candidates.append(item)
        else:
            status = "INVALID_NOT_USABLE" if "INVALID_NOT_USABLE" in reason_codes else "IGNORED_NOT_USABLE"
            ignored_audit.append(
                {
                    "finding_id": item["finding_id"],
                    "document_id": item["document_id"],
                    "item_usability_status": status,
                    "reason_codes": reason_codes,
                    "limitation_codes": limitation_codes,
                }
            )

    dedupe_plans = _plan_dedupe(usable_candidates)
    after_dedupe = [i for i in usable_candidates if not _is_duplicate(i["finding_id"], dedupe_plans)]
    supersession = apply_supersession(after_dedupe)
    sup_by_id = {s["finding_id"]: s for s in supersession}
    active_usable = [i for i in after_dedupe if sup_by_id.get(i["finding_id"], {}).get("active", True)]

    for decision in supersession:
        if not decision.get("superseded_by_finding_id"):
            continue
        doc_id = next((i["document_id"] for i in items if i["finding_id"] == decision["finding_id"]), "")
        ignored_audit.append(
            {
                "finding_id": decision["finding_id"],
                "document_id": doc_id,
                "item_usability_status": "SUPERSEDED_HISTORICAL",
                "reason_codes": decision.get("reason_codes") or ["EVIDENCE_SUPERSEDED"],
                "limitation_codes": decision.get("limitation_codes") or [],
            }
        )
    ignored_audit.sort(key=lambda e: e["finding_id"])

    slot_ids = sorted({p["formula_slot_id"] for p in ports})
    formula_bound_pools = []
    for slot_id in slot_ids:
        port = _resolve_port(ports, slot_id)
        slot_active = [i for i in active_usable if i.get("formula_slot_id") == slot_id]
        slot_ignored = [
            e
            for e in ignored_audit
            if next((i for i in items if i["finding_id"] == e["finding_id"]), {}).get("formula_slot_id")
            == slot_id
        ]
        corroborating = sorted({i["parent_source_id"] for i in slot_active})
        formula_bound_pools.append(
            {
                "formula_slot_id": slot_id,
                "formula_target_id": port.get("formula_target_id") if port else None,
                "usable_finding_ids": sorted(i["finding_id"] for i in slot_active),
                "ignored_finding_ids": sorted(e["finding_id"] for e in slot_ignored),
                "corroboration_distinct_parent_count": len(corroborating),
                "corroborating_parent_source_ids": corroborating,
                "contradiction": _contradiction(slot_id, active_usable),
            }
        )

    reason_codes = sorted(
        set(
            quarantine_codes
            + [c for e in ignored_audit for c in e["reason_codes"]]
            + [c for s in supersession for c in s.get("reason_codes") or []]
            + [c for p in formula_bound_pools for c in p["contradiction"]["reason_codes"]]
        )
    )
    limitation_codes = sorted(
        set(
            ["PHASE3_NO_POTENCY_CASCADE"]
            + [c for e in ignored_audit for c in e["limitation_codes"]]
            + [c for s in supersession for c in s.get("limitation_codes") or []]
            + [c for p in formula_bound_pools for c in p["contradiction"]["limitation_codes"]]
        )
    )

    fp = rule4_evidence_pool_fingerprint_v1_hash(
        ruleset_version=input_contract["ruleset_version"],
        registry_version=input_contract["registry_version"],
        data_asset_version=input_contract.get("data_asset_version"),
        formula_bound_pools=formula_bound_pools,
        reason_codes=reason_codes,
        limitation_codes=limitation_codes,
    )

    output = {
        "contract_version": input_contract["contract_version"],
        "ruleset_version": input_contract["ruleset_version"],
        "registry_version": input_contract["registry_version"],
        "data_asset_version": input_contract.get("data_asset_version"),
        "execution_status": "NOT_IMPLEMENTED",
        "current_runtime_potency_delta": "NONE",
        "registry_q16_selector_status": "NOT_EXECUTABLE_AS_Q16_SELECTOR",
        "document_gate_results": document_gate_results,
        "item_gate_results": item_gate_results,
        "ignored_audit": ignored_audit,
        "dedupe_supersession": [],
        "formula_bound_pools": formula_bound_pools,
        "reason_codes": reason_codes,
        "limitation_codes": limitation_codes,
        "deterministic_evidence_pool_fingerprint": fp,
        "quarantine_reason_codes": quarantine_codes,
    }

    dedupe_meta = []
    for item in items:
        plan = next(
            (
                p
                for p in dedupe_plans
                if p["representative_finding_id"] == item["finding_id"]
                or item["finding_id"] in p["duplicate_finding_ids"]
            ),
            None,
        )
        sup = sup_by_id.get(item["finding_id"])
        dedupe_meta.append(
            {
                "finding_id": item["finding_id"],
                "parent_source_id": item["parent_source_id"],
                "dedupe_group_key": plan["dedupe_group_key"] if plan else None,
                "superseded_by_finding_id": sup.get("superseded_by_finding_id") if sup else None,
                "corroboration_rank": None,
            }
        )
    output["dedupe_supersession"] = dedupe_meta

    validate_rule4_output_codes(output)
    return output
