from __future__ import annotations


class Rule4RegistryMergeError(ValueError):
    code = "RULE4_REGISTRY_MERGE_CONFLICT"


def merge_registry_entries(phase1_entries: list[dict], phase2_entries: list[dict]) -> list[dict]:
    merged: dict[str, dict] = {}
    for entry in phase1_entries + phase2_entries:
        code = entry["code"]
        namespace = entry.get("namespace")
        source = entry.get("source")
        existing = merged.get(code)
        if existing is None:
            merged[code] = entry
            continue
        if existing.get("namespace") != namespace:
            raise Rule4RegistryMergeError("RULE4_REGISTRY_MERGE_NAMESPACE_CONFLICT")
        if existing.get("source") != source:
            raise Rule4RegistryMergeError("RULE4_REGISTRY_MERGE_SOURCE_CONFLICT")
    return list(merged.values())
