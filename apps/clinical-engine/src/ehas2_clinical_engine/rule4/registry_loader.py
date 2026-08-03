from __future__ import annotations

import json
from pathlib import Path

from .registry_merge import merge_registry_entries
from .registry_paths import (
    RULE4_REGISTRY_FIXTURE_PHASE2_RELATIVE,
    RULE4_REGISTRY_FIXTURE_RELATIVE,
)

REPO_ROOT = Path(__file__).resolve().parents[5]


def _load_json(relative: str) -> dict:
    path = REPO_ROOT / relative
    return json.loads(path.read_text(encoding="utf-8"))


def load_reason_code_registry() -> dict:
    phase1 = _load_json(RULE4_REGISTRY_FIXTURE_RELATIVE)
    phase2 = _load_json(RULE4_REGISTRY_FIXTURE_PHASE2_RELATIVE)
    reason_codes = merge_registry_entries(phase1["reasonCodes"], phase2["reasonCodes"])
    limitation_codes = merge_registry_entries(phase1["limitationCodes"], phase2["limitationCodes"])
    return {
        "registryVersion": phase2["registryVersion"],
        "scope": phase2["scope"],
        "complete": phase2["complete"],
        "clinicalRegistryStatus": phase2["clinicalRegistryStatus"],
        "documentationBaselineCommit": phase2["documentationBaselineCommit"],
        "unknownCodePolicy": phase2["unknownCodePolicy"],
        "fullRegistryStatus": phase2["fullRegistryStatus"],
        "reasonCodes": reason_codes,
        "limitationCodes": limitation_codes,
    }
