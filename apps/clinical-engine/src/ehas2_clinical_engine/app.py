from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Header, Response
from fastapi.responses import JSONResponse

from . import ENGINE_VERSION, RULE_SET_VERSION, __version__
from .logging_safe import get_logger, redact
from .models import AnalyzeRequest, AnalyzeResponse, EmptySlot, ErrorBody
from .rules import orchestration_status, rule_interface_status

logger = get_logger()

app = FastAPI(
    title="EHAS2 Clinical Engine",
    version=__version__,
    description="Isolated clinical service scaffold — analysis NOT connected.",
)

ARTIFACT_DIR = (
    Path(__file__).resolve().parents[4] / "data" / "clinical-artifacts" / "disease-package-v1"
)


def _disease_package_generated() -> bool:
    return (ARTIFACT_DIR / "manifest.json").is_file()


@app.get("/health")
def health() -> dict:
    return {"ok": True, "service": "ehas2-clinical-engine", "version": ENGINE_VERSION}


@app.get("/ready")
def ready(response: Response) -> dict:
    """Readiness remains false until rules/packages are validated (Phase 5B+)."""
    body = {
        "ready": False,
        "reason": "CLINICAL_RULES_NOT_VALIDATED",
        "orchestration": orchestration_status(),
        "disease_package_installed_live": False,
        "medicine_registry": "AVAILABLE_IN_EHAS2_PACKAGE",
    }
    response.status_code = 503
    return body


@app.get("/version")
def version() -> dict:
    return {
        "engine_version": ENGINE_VERSION,
        "rule_set_version": RULE_SET_VERSION,
        "package_version": __version__,
    }


@app.get("/status/data-package")
def data_package_status() -> dict:
    return {
        "expected_count": 116_284,
        "generated_local": _disease_package_generated(),
        "installed_live": False,
        "path_policy": "data/clinical-artifacts/disease-package-v1",
        "runtime_old_project_path_allowed": False,
    }


@app.get("/status/medicine-registry")
def medicine_registry_status() -> dict:
    return {
        "canonical_count": 39,
        "c11": "PRESENT",
        "sqlite_seed_canonical": False,
        "registry_version": "ehas2-medicine-registry-v1",
        "status": "AVAILABLE",
    }


@app.get("/status/rules")
def rules_status() -> dict:
    return {
        "orchestration": "NOT_CONNECTED",
        "rules": rule_interface_status(),
        "rule_8": "NOT_IMPLEMENTED",
        "tablet_engine": "NOT_IMPLEMENTED",
        "report_processing": "NOT_CONNECTED",
        "phase_f_clinical_authority": False,
    }


@app.post("/v1/analyze-complete")
def analyze_complete(
    body: AnalyzeRequest,
    x_request_id: str | None = Header(default=None),
) -> JSONResponse:
    request_id = body.request_id or x_request_id or "missing-request-id"
    logger.info("analyze_complete rejected: %s", redact({"request_id": request_id}))
    result = AnalyzeResponse(
        request_id=request_id,
        status="CLINICAL_ENGINE_NOT_CONNECTED",
        engine_version=ENGINE_VERSION,
        dataset_version=None,
        medicine_registry_version=None,
        rule_set_version=RULE_SET_VERSION,
        oral_formula_candidates=[],
        tablet_section_a=EmptySlot(
            status="NOT_CONNECTED",
            medicines=[],
            reason="CLINICAL_ENGINE_NOT_CONNECTED",
        ),
        tablet_section_b=EmptySlot(
            status="NOT_IMPLEMENTED",
            medicines=[],
            reason="TABLET_ENGINE_NOT_IMPLEMENTED",
        ),
        external_applications=[],
        potency=None,
        electricity=None,
        default_we_used=False,
        doctor_review_required=True,
        deterministic_fingerprint=None,
        message="Clinical engine is not connected. No prescription generated.",
        unknown_unresolved_reasons=["CLINICAL_ENGINE_NOT_CONNECTED"],
    )
    return JSONResponse(status_code=501, content=result.model_dump())


@app.exception_handler(Exception)
async def unhandled(request, exc):  # type: ignore[no-untyped-def]
    logger.exception("unhandled error")
    err = ErrorBody(code="CLINICAL_SERVICE_ERROR", message="Unhandled error", request_id=None)
    return JSONResponse(status_code=500, content=err.model_dump())
