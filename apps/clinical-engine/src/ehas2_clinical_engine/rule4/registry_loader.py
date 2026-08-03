from __future__ import annotations

import json
from pathlib import Path

from .registry_merge import merge_registry_entries
from .registry_paths import (
    RULE4_REGISTRY_FIXTURE_PHASE2_RELATIVE,
    RULE4_REGISTRY_FIXTURE_PHASE3_RELATIVE,
    RULE4_REGISTRY_FIXTURE_RELATIVE,
)

REPO_ROOT = Path(__file__).resolve().parents[5]


def _load_json(relative: str) -> dict:
    path = REPO_ROOT / relative
    return json.loads(path.read_text(encoding="utf-8"))


def load_reason_code_registry() -> dict:
    phase1 = _load_json(RULE4_REGISTRY_FIXTURE_RELATIVE)
    phase2 = _load_json(RULE4_REGISTRY_FIXTURE_PHASE2_RELATIVE)
    phase3 = _load_json(RULE4_REGISTRY_FIXTURE_PHASE3_RELATIVE)
    reason_codes = merge_registry_entries(
        merge_registry_entries(phase1["reasonCodes"], phase2["reasonCodes"]),
        phase3["reasonCodes"],
    )
    limitation_codes = merge_registry_entries(
        merge_registry_entries(phase1["limitationCodes"], phase2["limitationCodes"]),
        phase3["limitationCodes"],
    )
    return {
        "registryVersion": phase3["registryVersion"],
        "scope": phase3["scope"],
        "complete": phase3["complete"],
        "clinicalRegistryStatus": phase3["clinicalRegistryStatus"],
        "documentationBaselineCommit": phase3["documentationBaselineCommit"],
        "unknownCodePolicy": phase3["unknownCodePolicy"],
        "fullRegistryStatus": phase3["fullRegistryStatus"],
        "reasonCodes": reason_codes,
        "limitationCodes": limitation_codes,
    }
