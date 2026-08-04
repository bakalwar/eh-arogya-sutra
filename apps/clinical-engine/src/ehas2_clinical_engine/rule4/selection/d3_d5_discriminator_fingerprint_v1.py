from __future__ import annotations

import hashlib
from typing import Any

from ..canonical_json import canonical_stable_dumps

from .d3_d5_evidence_provenance import evidence_provenance_fingerprint_payload

RULE4_D3D5_DISCRIMINATOR_FINGERPRINT_V1 = "rule4-d3d5-discriminator-fingerprint-v1"


def _gate_payload(gate: dict) -> dict:
    return {
        "gate_id": gate["gate_id"],
        "outcome": gate["outcome"],
        "evidence_item_ids": sorted(gate.get("evidence_item_ids") or []),
        "reason_codes": sorted(gate.get("reason_codes") or []),
        "limitation_codes": sorted(gate.get("limitation_codes") or []),
    }


def rule4_d3d5_discriminator_fingerprint_v1_payload(envelope: dict) -> str:
    gates = sorted(envelope.get("q7bf_gate_results") or [], key=lambda g: g["gate_id"])
    return canonical_stable_dumps(
        {
            "fingerprint_version": RULE4_D3D5_DISCRIMINATOR_FINGERPRINT_V1,
            "formula_slot_id": envelope["formula_slot_id"],
            "formula_target_id": envelope["formula_target_id"],
            "upstream_phase7_eligibility_fingerprint": envelope[
                "upstream_phase7_eligibility_fingerprint"
            ],
            "q7bf_gate_results": [_gate_payload(g) for g in gates],
            "d08_document_status": envelope["d08_document_status"],
            "d08_document_confidence": envelope["d08_document_confidence"],
            "d08_item_status": envelope["d08_item_status"],
            "d08_item_confidence": envelope["d08_item_confidence"],
            "sensitivity_assessment_status": envelope["sensitivity_assessment_status"],
            "close_d05_discriminator_status": envelope["close_d05_discriminator_status"],
            "evidence_item_ids": sorted(envelope.get("evidence_item_ids") or []),
            "evidence_provenance": evidence_provenance_fingerprint_payload(
                list(envelope.get("evidence_provenance") or [])
            ),
            "source_reference_ids": sorted(envelope.get("source_reference_ids") or []),
            "binding_status": envelope["binding_status"],
        }
    )


def rule4_d3d5_discriminator_fingerprint_v1_hash(envelope: dict) -> str:
    payload = rule4_d3d5_discriminator_fingerprint_v1_payload(envelope)
    return hashlib.sha256(payload.encode("utf-8")).hexdigest().upper()


def with_computed_discriminator_fingerprint(envelope: dict) -> dict:
    body = {k: v for k, v in envelope.items() if k != "discriminator_fingerprint"}
    return {**body, "discriminator_fingerprint": rule4_d3d5_discriminator_fingerprint_v1_hash(body)}


def discriminator_fingerprint_fields(envelope: dict) -> dict[str, Any]:
    return {
        "formula_slot_id": envelope["formula_slot_id"],
        "formula_target_id": envelope["formula_target_id"],
        "upstream_phase7_eligibility_fingerprint": envelope[
            "upstream_phase7_eligibility_fingerprint"
        ],
        "q7bf_gate_results": envelope.get("q7bf_gate_results") or [],
        "d08_document_status": envelope["d08_document_status"],
        "d08_document_confidence": envelope["d08_document_confidence"],
        "d08_item_status": envelope["d08_item_status"],
        "d08_item_confidence": envelope["d08_item_confidence"],
        "sensitivity_assessment_status": envelope["sensitivity_assessment_status"],
        "close_d05_discriminator_status": envelope["close_d05_discriminator_status"],
        "evidence_item_ids": envelope.get("evidence_item_ids") or [],
        "evidence_provenance": envelope.get("evidence_provenance") or [],
        "source_reference_ids": envelope.get("source_reference_ids") or [],
        "binding_status": envelope["binding_status"],
    }
