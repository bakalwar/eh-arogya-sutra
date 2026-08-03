from __future__ import annotations



from .assertion_binding import (

    FLARE,

    CHRONIC,

    is_acute_chronic_cross,

    is_flare_or_chronic,

    resolve_assertion_binding,

)



CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON = "CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_BLOCKED"

TARGET_BINDING_MISSING_REASON = "TARGET_BINDING_MISSING"





def _cross_role_guard_options(input_contract: dict) -> dict:

    return {

        "label": input_contract.get("label"),

        "trusted_synthetic_binding_bypass": input_contract.get("trusted_synthetic_binding_bypass")

        is True,

    }





def _collapse_binding_failure(slot: dict, reason: str) -> dict:

    return {

        **slot,

        "severity_status": "NOT_EVALUATED",

        "severity_score": None,

        "severity_band": None,

        "severity_resolution_source": "NONE",

        "binding_status": "LEAKAGE_BLOCKED",

        "selected_cascade": None,

        "selected_dilution": None,

        "reason_codes": sorted(set([*slot["reason_codes"], reason])),

        "limitation_codes": sorted(set([*slot["limitation_codes"], "PHASE6_NO_NUMERIC_CASCADE"])),

    }





def apply_cross_role_leakage_guard(

    slots: list[dict], records: list[dict], input_contract: dict

) -> list[dict]:

    options = _cross_role_guard_options(input_contract)

    block_slot_ids: dict[str, str] = {}

    all_bindings: list[dict] = []



    for record in records:

        if record.get("patient_global_max_severity_label_only"):

            continue

        for assertion in record.get("severity_evidence_assertions") or []:

            binding = resolve_assertion_binding(assertion, record, options)

            all_bindings.append(binding)



            if binding["missing_acute_chronic_authority"]:

                block_slot_ids[binding["receiving_formula_slot_id"]] = TARGET_BINDING_MISSING_REASON

                continue



            if is_acute_chronic_cross(binding["bound_target_role"], binding["receiving_target_role"]):

                block_slot_ids[binding["receiving_formula_slot_id"]] = (

                    CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON

                )



            if binding["receiving_target_role"] == "STANDARD_FORMULA_TARGET" and is_flare_or_chronic(

                binding["bound_target_role"]

            ):

                block_slot_ids[binding["receiving_formula_slot_id"]] = (

                    CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON

                )



    by_evidence: dict[str, list[dict]] = {}

    for b in all_bindings:

        by_evidence.setdefault(b["evidence_item_id"], []).append(b)



    for occs in by_evidence.values():

        flare_recv = [o for o in occs if o["receiving_target_role"] == FLARE]

        chronic_recv = [o for o in occs if o["receiving_target_role"] == CHRONIC]

        if not flare_recv or not chronic_recv:

            continue



        if any(o["missing_acute_chronic_authority"] for o in occs):

            for o in occs:

                if is_flare_or_chronic(o["receiving_target_role"]):

                    block_slot_ids[o["receiving_formula_slot_id"]] = TARGET_BINDING_MISSING_REASON

            continue



        bound_roles = {o["bound_target_role"] for o in occs}

        each_authoritative = all(

            o["binding_authoritative"] and o["bound_target_role"] == o["receiving_target_role"]

            for o in occs

        )

        if each_authoritative and len(bound_roles) > 1:

            for o in occs:

                if is_flare_or_chronic(o["receiving_target_role"]):

                    block_slot_ids[o["receiving_formula_slot_id"]] = (

                        CROSS_ACUTE_CHRONIC_SEVERITY_LEAKAGE_REASON

                    )



    if not block_slot_ids:

        return slots

    return [

        _collapse_binding_failure(slot, block_slot_ids[slot["formula_slot_id"]])

        if slot["formula_slot_id"] in block_slot_ids

        else slot

        for slot in slots

    ]
