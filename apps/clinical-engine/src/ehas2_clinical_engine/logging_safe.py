from __future__ import annotations

import logging
import re
from typing import Any

_SECRETISH = re.compile(r"(password|otp|token|authorization|phone|mobile)", re.I)


def get_logger(name: str = "ehas2.clinical") -> logging.Logger:
    logger = logging.getLogger(name)
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(levelname)s %(name)s %(message)s"))
        logger.addHandler(handler)
        logger.setLevel(logging.INFO)
    return logger


def redact(value: Any) -> Any:
    if isinstance(value, dict):
        out = {}
        for k, v in value.items():
            if _SECRETISH.search(str(k)):
                out[k] = "[REDACTED]"
            else:
                out[k] = redact(v)
        return out
    if isinstance(value, list):
        return [redact(v) for v in value]
    if isinstance(value, str) and len(value) >= 10 and value.isdigit():
        return "[REDACTED_DIGITS]"
    return value
