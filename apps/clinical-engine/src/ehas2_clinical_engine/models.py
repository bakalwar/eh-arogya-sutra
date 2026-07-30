from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    schema_version: str = "ehas2-analyze-contract-v1"
    request_id: str
    timeout_ms: int | None = None
    chief_complaint: str | None = None
    symptoms: list[str] = Field(default_factory=list)
    demographic: dict[str, Any] = Field(default_factory=dict)
    structured_report_findings: list[dict[str, Any]] = Field(default_factory=list)


class EmptySlot(BaseModel):
    status: str
    medicines: list[str] = Field(default_factory=list)
    reason: str


class AnalyzeResponse(BaseModel):
    schema_version: str = "ehas2-analyze-contract-v1"
    request_id: str
    status: Literal[
        "CLINICAL_ENGINE_NOT_CONNECTED",
        "CLINICAL_RULES_NOT_IMPLEMENTED",
        "UNRESOLVED",
        "BLOCKED_BY_SAFETY",
        "FAILED",
        "OK",
    ]
    engine_version: str
    dataset_version: str | None = None
    medicine_registry_version: str | None = None
    rule_set_version: str | None = None
    oral_formula_candidates: list[Any] = Field(default_factory=list)
    tablet_section_a: EmptySlot
    tablet_section_b: EmptySlot
    external_applications: list[Any] = Field(default_factory=list)
    potency: None = None
    electricity: None = None
    default_we_used: Literal[False] = False
    doctor_review_required: Literal[True] = True
    deterministic_fingerprint: str | None = None
    message: str
    unknown_unresolved_reasons: list[str] = Field(default_factory=list)


class ErrorBody(BaseModel):
    success: Literal[False] = False
    code: str
    message: str
    request_id: str | None = None
