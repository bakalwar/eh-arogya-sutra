from __future__ import annotations

import hashlib
import json
from typing import Any


def stable_dumps(obj: Any) -> str:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)


def fingerprint(obj: Any) -> str:
    payload = stable_dumps(obj).encode("utf-8")
    return hashlib.sha256(payload).hexdigest().upper()
