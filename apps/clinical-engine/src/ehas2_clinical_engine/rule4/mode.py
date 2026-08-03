from __future__ import annotations

RULE4_DEFAULT_ENGINE_MODE = "off"
VALID_RULE4_ENGINE_MODES = frozenset({"off", "shadow", "active"})


class Rule4ConfigurationError(ValueError):
    code = "RULE4_ENGINE_MODE_INVALID"


def parse_rule4_engine_mode(raw: str | None) -> str:
    if raw is None or str(raw).strip() == "":
        return RULE4_DEFAULT_ENGINE_MODE
    value = str(raw).strip().lower()
    if value in VALID_RULE4_ENGINE_MODES:
        return value
    raise Rule4ConfigurationError("RULE4_ENGINE_MODE_INVALID")
