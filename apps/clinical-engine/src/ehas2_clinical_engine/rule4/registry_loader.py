from __future__ import annotations

import json
from pathlib import Path

from .registry_paths import RULE4_REGISTRY_FIXTURE_RELATIVE

REPO_ROOT = Path(__file__).resolve().parents[5]


def load_reason_code_registry() -> dict:
    path = REPO_ROOT / RULE4_REGISTRY_FIXTURE_RELATIVE
    return json.loads(path.read_text(encoding="utf-8"))
