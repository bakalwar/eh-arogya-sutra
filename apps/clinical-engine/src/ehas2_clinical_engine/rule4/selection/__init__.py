"""Rule 4 Phase 8 numeric selection adapter (shadow draft)."""

from __future__ import annotations

from .evaluate_selection_adapter import evaluate_selection_adapter
from .selection_fingerprint_v1 import (
    rule4_numeric_selection_fingerprint_v1_hash,
    rule4_numeric_selection_fingerprint_v1_payload,
)
from .validate_d3_d5_discriminator import validate_d3_d5_discriminator_envelope

__all__ = [
    "evaluate_selection_adapter",
    "rule4_numeric_selection_fingerprint_v1_hash",
    "rule4_numeric_selection_fingerprint_v1_payload",
    "validate_d3_d5_discriminator_envelope",
]
