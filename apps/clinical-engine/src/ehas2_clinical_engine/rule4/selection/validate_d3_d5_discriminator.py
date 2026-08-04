from __future__ import annotations



from typing import Any



from .d3_d5_discriminator_fingerprint_v1 import rule4_d3d5_discriminator_fingerprint_v1_hash

from .d3_d5_evidence_provenance import (

    envelope_d08_matches_authoritative,

    envelope_evidence_provenance_matches_authoritative,

    validate_d3_d5_evidence_provenance,

)

from .q7bf_gate_ids import RULE4_Q7BF_MANDATORY_GATE_IDS, RULE4_Q7BF_MANDATORY_GATE_ID_SET





def _q7bf_ledger_pass(gates: list[dict]) -> dict[str, Any]:

    by_id = {g["gate_id"]: g for g in gates}

    for gate_id in RULE4_Q7BF_MANDATORY_GATE_IDS:

        gate = by_id.get(gate_id)

        if not gate:

            return {"ok": False, "code": "Q7BF_GATE_MISSING"}

        if gate.get("outcome") != "PASS":

            return {"ok": False, "code": "Q7BF_GATE_NOT_PASS"}

    for gate in gates:

        if gate["gate_id"] not in RULE4_Q7BF_MANDATORY_GATE_ID_SET:

            return {"ok": False, "code": "Q7BF_GATE_UNKNOWN"}

    return {"ok": True}





def _sensitivity_close_aligned(envelope: dict) -> bool:

    sens = envelope["sensitivity_assessment_status"]

    close = envelope["close_d05_discriminator_status"]

    if sens == "CONTRADICTORY" or close == "CONTRADICTORY":

        return False

    if sens == "ASSESSED_D5_QUALIFIED":

        return close == "QUALIFIES_D5"

    if sens == "ASSESSED_D5_NOT_QUALIFIED":

        return close == "QUALIFIES_D3"

    return False





def reject_legacy_d3_d5_selection_record(legacy: dict | None) -> str | None:

    if not legacy:

        return None

    return "D3_D5_LEGACY_BOOLEAN_AUTHORITY_REJECTED"





def validate_d3_d5_discriminator_envelope(

    envelope: dict | None,

    ctx: dict,

) -> dict[str, Any]:

    if not envelope:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_DISCRIMINATOR_ENVELOPE_MISSING"],

            "discriminator_fingerprint": None,

        }



    if (

        envelope.get("formula_slot_id") != ctx["formula_slot_id"]

        or envelope.get("formula_target_id") != ctx["formula_target_id"]

    ):

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_ENVELOPE_BINDING_INVALID"],

            "discriminator_fingerprint": None,

        }



    if envelope.get("upstream_phase7_eligibility_fingerprint") != ctx.get(

        "upstream_phase7_eligibility_fingerprint"

    ):

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_ENVELOPE_BINDING_INVALID"],

            "discriminator_fingerprint": None,

        }



    if envelope.get("binding_status") != "BOUND":

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_ENVELOPE_BINDING_INVALID"],

            "discriminator_fingerprint": None,

        }



    q7 = _q7bf_ledger_pass(list(envelope.get("q7bf_gate_results") or []))

    if not q7["ok"]:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": [q7["code"]],

            "discriminator_fingerprint": None,

        }



    provenance = validate_d3_d5_evidence_provenance(envelope, ctx)

    if not provenance["ok"]:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": [provenance["reason_code"]],

            "discriminator_fingerprint": None,

        }



    if not (envelope.get("evidence_provenance") or []):

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_EVIDENCE_PROVENANCE_MISSING"],

            "discriminator_fingerprint": None,

        }



    d08_auth = envelope_d08_matches_authoritative(envelope, provenance)

    if not d08_auth["ok"]:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": [d08_auth["reason_code"]],

            "discriminator_fingerprint": None,

        }



    prov_bind = envelope_evidence_provenance_matches_authoritative(

        envelope, provenance["records"]

    )

    if not prov_bind["ok"]:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": [prov_bind["reason_code"]],

            "discriminator_fingerprint": None,

        }



    expected_fp = rule4_d3d5_discriminator_fingerprint_v1_hash(envelope)

    if envelope.get("discriminator_fingerprint") != expected_fp:

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_DISCRIMINATOR_FINGERPRINT_INVALID"],

            "discriminator_fingerprint": None,

        }



    sens = envelope["sensitivity_assessment_status"]

    if sens in {"MISSING", "NOT_EVALUATED", "INVALID", "AMBIGUOUS", "CONTRADICTORY"}:

        code = (

            "D3_D5_SENSITIVITY_MISSING"

            if sens in {"MISSING", "NOT_EVALUATED"}

            else "D3_D5_SENSITIVITY_AMBIGUOUS"

        )

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": [code],

            "discriminator_fingerprint": expected_fp,

        }



    if (

        envelope["close_d05_discriminator_status"] in {"CONTRADICTORY", "UNRESOLVED"}

        or not _sensitivity_close_aligned(envelope)

    ):

        return {

            "status": "unresolved",

            "dilution": None,

            "reason_codes": ["D3_D5_DISCRIMINATOR_CONTRADICTORY"],

            "discriminator_fingerprint": expected_fp,

        }



    if (

        sens == "ASSESSED_D5_QUALIFIED"

        and envelope["close_d05_discriminator_status"] == "QUALIFIES_D5"

    ):

        return {

            "status": "resolved",

            "dilution": "D5",

            "reason_codes": ["CLOSE_D05_QUALIFIES_D5"],

            "discriminator_fingerprint": expected_fp,

        }



    if (

        sens == "ASSESSED_D5_NOT_QUALIFIED"

        and envelope["close_d05_discriminator_status"] == "QUALIFIES_D3"

    ):

        return {

            "status": "resolved",

            "dilution": "D3",

            "reason_codes": ["CLOSE_D05_D3_PATH"],

            "discriminator_fingerprint": expected_fp,

        }



    return {

        "status": "unresolved",

        "dilution": None,

        "reason_codes": ["D3_D5_DISCRIMINATOR_UNRESOLVED"],

        "discriminator_fingerprint": expected_fp,

    }
