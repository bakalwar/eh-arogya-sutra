from __future__ import annotations

from typing import Any

EXECUTABLE_ASSERTIONS = frozenset({"PRESENT", "POSITIVE"})
REJECTED_ASSERTIONS = frozenset(
    {
        "NEGATED",
        "RULE_OUT",
        "SUSPECTED",
        "UNKNOWN",
        "AMBIGUOUS",
        "HISTORICAL_ONLY",
        "RESOLVED",
    }
)
ACCEPTABLE_VERIFICATION = frozenset({"SUPPORTED", "VERIFIED"})


def _item_executable(item: dict) -> bool:
    assertion = item.get("assertion_status")
    if assertion in REJECTED_ASSERTIONS:
        return False
    if assertion not in EXECUTABLE_ASSERTIONS:
        return False
    if item.get("verification_status") not in ACCEPTABLE_VERIFICATION:
        return False
    if item.get("formula_relevance") != "DIRECT":
        return False
    return True


def validate_d3_d5_evidence_provenance(envelope: dict, ctx: dict) -> dict[str, Any]:
    def empty_fail(code: str, records: list | None = None) -> dict[str, Any]:
        return {
            "ok": False,
            "reason_code": code,
            "records": records or [],
            "authoritative_document_status": "NOT_USABLE",
            "authoritative_document_confidence": "FAIL",
            "authoritative_item_status": "NOT_USABLE",
            "authoritative_item_confidence": "FAIL",
        }

    evidence_adapter = ctx.get("evidence_adapter")
    if not evidence_adapter:
        return empty_fail("D3_D5_EVIDENCE_POOL_MISSING")

    pool = next(
        (
            p
            for p in evidence_adapter.get("formula_bound_pools") or []
            if p.get("formula_slot_id") == ctx["formula_slot_id"]
            and p.get("formula_target_id") == ctx["formula_target_id"]
        ),
        None,
    )
    if not pool:
        return empty_fail("D3_D5_EVIDENCE_POOL_MISSING")

    contradiction = pool.get("contradiction") or {}
    if contradiction.get("evidence_status") == "CONTRADICTORY_EVIDENCE":
        return empty_fail("D3_D5_EVIDENCE_POOL_CONTRADICTORY")

    ids = list(envelope.get("evidence_item_ids") or [])
    if not ids:
        return empty_fail("D3_D5_EVIDENCE_MEMBERSHIP_INVALID")
    if len(set(ids)) != len(ids):
        return empty_fail("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET")

    usable = set(pool.get("usable_finding_ids") or [])
    ignored = set(pool.get("ignored_finding_ids") or [])
    items_by_finding = {i["finding_id"]: i for i in (ctx.get("evidence_items") or [])}
    item_gates = {r["finding_id"]: r for r in evidence_adapter.get("item_gate_results") or []}
    doc_gates = {r["document_id"]: r for r in evidence_adapter.get("document_gate_results") or []}
    ignored_audit_ids = {e["finding_id"] for e in evidence_adapter.get("ignored_audit") or []}
    superseded_ids = {
        m["finding_id"]
        for m in evidence_adapter.get("dedupe_supersession") or []
        if m.get("superseded_by_finding_id")
    }

    records: list[dict] = []
    for finding_id in sorted(set(ids)):
        if finding_id in ignored or finding_id in ignored_audit_ids or finding_id in superseded_ids:
            return empty_fail("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET", records)
        if finding_id not in usable:
            return empty_fail("D3_D5_EVIDENCE_MEMBERSHIP_INVALID", records)

        item = items_by_finding.get(finding_id)
        if (
            not item
            or item.get("formula_slot_id") != ctx["formula_slot_id"]
            or item.get("formula_target_id") != ctx["formula_target_id"]
        ):
            return empty_fail("D3_D5_EVIDENCE_MEMBERSHIP_INVALID", records)

        if not _item_executable(item):
            return empty_fail("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET", records)

        item_gate = item_gates.get(finding_id)
        if not item_gate or not item_gate.get("passed"):
            return empty_fail("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET", records)
        if item_gate.get("finding_id") != finding_id:
            return empty_fail("D3_D5_EVIDENCE_ITEM_GATE_NOT_MET", records)
        gate_doc = item_gate.get("document_id")
        if not gate_doc or gate_doc != item.get("document_id"):
            return empty_fail("D3_D5_EVIDENCE_DOCUMENT_BINDING_INVALID", records)

        doc_gate = doc_gates.get(item["document_id"])
        if not doc_gate or not doc_gate.get("passed"):
            return empty_fail("D3_D5_EVIDENCE_DOCUMENT_GATE_NOT_MET", records)

        records.append(
            {
                "finding_id": finding_id,
                "document_id": item["document_id"],
                "item_gate_passed": True,
                "document_gate_passed": True,
            }
        )

    all_docs_pass = all(r["document_gate_passed"] for r in records)
    all_items_pass = all(r["item_gate_passed"] for r in records)

    return {
        "ok": True,
        "records": records,
        "authoritative_document_status": "USABLE" if all_docs_pass else "NOT_USABLE",
        "authoritative_document_confidence": "PASS" if all_docs_pass else "FAIL",
        "authoritative_item_status": "USABLE" if all_items_pass else "NOT_USABLE",
        "authoritative_item_confidence": "PASS" if all_items_pass else "FAIL",
    }


def _provenance_record_key(r: dict) -> str:
    return (
        f"{r['finding_id']}|{r['document_id']}|{r['item_gate_passed']}|{r['document_gate_passed']}"
    )


def envelope_d08_matches_authoritative(envelope: dict, auth: dict) -> dict[str, Any]:
    if (
        envelope.get("d08_document_status") != auth["authoritative_document_status"]
        or envelope.get("d08_document_confidence") != auth["authoritative_document_confidence"]
    ):
        return {"ok": False, "reason_code": "D08_DOCUMENT_GATE_NOT_MET"}
    if (
        envelope.get("d08_item_status") != auth["authoritative_item_status"]
        or envelope.get("d08_item_confidence") != auth["authoritative_item_confidence"]
    ):
        return {"ok": False, "reason_code": "D08_ITEM_GATE_NOT_MET"}
    return {"ok": True}


def envelope_evidence_provenance_matches_authoritative(
    envelope: dict, records: list[dict]
) -> dict[str, Any]:
    claimed = list(envelope.get("evidence_provenance") or [])
    if len(claimed) != len(records):
        return {"ok": False, "reason_code": "D3_D5_EVIDENCE_PROVENANCE_MISMATCH"}
    auth_keys = sorted(_provenance_record_key(r) for r in records)
    claim_keys = sorted(
        _provenance_record_key(
            {
                "finding_id": c["finding_id"],
                "document_id": c["document_id"],
                "item_gate_passed": c["item_gate_passed"],
                "document_gate_passed": c["document_gate_passed"],
            }
        )
        for c in claimed
    )
    if auth_keys != claim_keys:
        return {"ok": False, "reason_code": "D3_D5_EVIDENCE_PROVENANCE_MISMATCH"}
    return {"ok": True}


def evidence_provenance_fingerprint_payload(records: list[dict]) -> list[dict]:
    return sorted(
        [
            {
                "finding_id": r["finding_id"],
                "document_id": r["document_id"],
                "item_gate_passed": r["item_gate_passed"],
                "document_gate_passed": r["document_gate_passed"],
            }
            for r in records
        ],
        key=lambda x: x["finding_id"],
    )
