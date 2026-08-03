"""Rule 4 Phase 1 foundation — no clinical inference."""

from .evaluator import Rule4ConfigurationError, evaluate_rule4_empty, load_reason_code_registry
from .mode import parse_rule4_engine_mode
from .orchestrator_hook import (
    Rule4ShadowCollectorError,
    apply_rule4_orchestrator_hook,
)
from .registry_validation import Rule4UnknownCodeError, validate_rule4_output_codes
from .validate import Rule4ValidationError

__all__ = [
    "Rule4ConfigurationError",
    "Rule4ShadowCollectorError",
    "Rule4UnknownCodeError",
    "Rule4ValidationError",
    "apply_rule4_orchestrator_hook",
    "evaluate_rule4_empty",
    "load_reason_code_registry",
    "parse_rule4_engine_mode",
    "validate_rule4_output_codes",
]
