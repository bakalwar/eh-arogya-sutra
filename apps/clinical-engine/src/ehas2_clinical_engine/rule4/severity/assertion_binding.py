from __future__ import annotations

FLARE = "CURRENT_ACUTE_FLARE"
CHRONIC = "UNDERLYING_CHRONIC_TARGET"
STANDARD = "STANDARD_FORMULA_TARGET"

KNOWN_TARGET_ROLES = {STANDARD, FLARE, CHRONIC}


def synthetic_binding_bypass_active(options: dict) -> bool:
    return options.get("label") == "SYNTHETIC" and options.get("trusted_synthetic_binding_bypass") is True


def is_known_target_role(value: object) -> bool:
    return isinstance(value, str) and value in KNOWN_TARGET_ROLES


def validate_assertion_bound_target_roles(records: list[dict]) -> None:
    for record in records:
        for assertion in record.get("severity_evidence_assertions") or []:
            raw = assertion.get("bound_target_role")
            if raw is not None and not is_known_target_role(raw):
                raise ValueError("RULE4_SEVERITY_BOUND_TARGET_ROLE_INVALID")


def resolve_assertion_binding(assertion: dict, record: dict, options: dict) -> dict:
    receiving_target_role = record["target_role"]
    explicit_role = assertion.get("bound_target_role")

    missing_acute_chronic_authority = False
    if explicit_role is not None:
        bound_target_role = explicit_role
    elif receiving_target_role in {FLARE, CHRONIC}:
        if synthetic_binding_bypass_active(options):
            bound_target_role = receiving_target_role
        else:
            missing_acute_chronic_authority = True
            bound_target_role = receiving_target_role
    else:
        bound_target_role = receiving_target_role

    bound_formula_slot_id = assertion.get("bound_formula_slot_id") or record["formula_slot_id"]
    bound_formula_target_id = assertion.get("bound_formula_target_id") or record["formula_target_id"]

    binding_authoritative = not missing_acute_chronic_authority and (
        explicit_role is not None
        or (
            receiving_target_role == STANDARD
            and bound_formula_slot_id == record["formula_slot_id"]
            and bound_formula_target_id == record["formula_target_id"]
        )
        or (
            synthetic_binding_bypass_active(options)
            and receiving_target_role in {FLARE, CHRONIC}
        )
    )

    return {
        "evidence_item_id": assertion["evidence_item_id"],
        "receiving_formula_slot_id": record["formula_slot_id"],
        "receiving_formula_target_id": record["formula_target_id"],
        "receiving_target_role": receiving_target_role,
        "bound_formula_slot_id": bound_formula_slot_id,
        "bound_formula_target_id": bound_formula_target_id,
        "bound_target_role": bound_target_role,
        "binding_authoritative": binding_authoritative,
        "missing_acute_chronic_authority": missing_acute_chronic_authority,
    }


def is_flare_or_chronic(role: str) -> bool:
    return role in {FLARE, CHRONIC}


def is_acute_chronic_cross(bound_role: str, receiving_role: str) -> bool:
    return (bound_role == FLARE and receiving_role == CHRONIC) or (
        bound_role == CHRONIC and receiving_role == FLARE
    )
