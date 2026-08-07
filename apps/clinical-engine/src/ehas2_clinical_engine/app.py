from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI, Header, Response
from fastapi.responses import JSONResponse

from . import ENGINE_VERSION, RULE_SET_VERSION, __version__
from .disease_package import DiseasePackageError, load_disease_package, synthetic_fixture_dir
from .golden import run_all_golden
from .logging_safe import get_logger, redact
from .models import AnalyzeRequest, AnalyzeResponse, EmptySlot, ErrorBody
from .orchestrator import NineRuleOrchestrator, OrchestratorRun
from .rules import orchestration_status, rule_interface_status

logger = get_logger()

app = FastAPI(
    title="EHAS2 Clinical Engine",
    version=__version__,
    description="Isolated clinical service — production analysis NOT connected; synthetic validation only.",
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
    """Production readiness remains false — validation orchestration does not flip ready."""
    body = {
        "ready": False,
        "reason": "CLINICAL_READINESS_FALSE_PHASE_5C",
        "orchestration": orchestration_status(),
        "disease_package_installed_live": False,
        "medicine_registry": "AVAILABLE_IN_EHAS2_PACKAGE",
        "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
        "clinical_readiness": False,
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
        "synthetic_ci_separate": True,
    }


@app.get("/status/medicine-registry")
def medicine_registry_status() -> dict:
    return {
        "canonical_count": 38,
        "c11": "EXCLUDED",
        "owner_decision": "CQ-001A",
        "sqlite_seed_canonical": False,
        "registry_version": "ehas2-medicine-registry-v2",
        "historical_v1_version": "ehas2-medicine-registry-v1",
        "status": "AVAILABLE",
    }


@app.get("/status/rules")
def rules_status() -> dict:
    return {
        "orchestration": "READY_FOR_VALIDATION",
        "production_analyze_complete": "NOT_CONNECTED",
        "prescription_engine": "PRESCRIPTION_ENGINE_NOT_CONNECTED",
        "rules": rule_interface_status(),
        "rule_8": "NOT_IMPLEMENTED",
        "tablet_engine": "NOT_IMPLEMENTED",
        "report_processing": "NOT_CONNECTED",
        "phase_f_clinical_authority": False,
        "clinical_readiness": False,
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


@app.post("/v1/validation/orchestrate")
def validation_orchestrate(payload: dict) -> JSONResponse:
    """Synthetic-only non-prescription orchestration. Not production clinical analysis."""
    if payload.get("label") != "SYNTHETIC":
        return JSONResponse(
            status_code=400,
            content={
                "code": "SYNTHETIC_LABEL_REQUIRED",
                "message": "Phase 5C validation requires label=SYNTHETIC",
            },
        )
    orch = NineRuleOrchestrator()
    run = OrchestratorRun(
        label="SYNTHETIC",
        package_dir=synthetic_fixture_dir(),
        allow_synthetic_package=True,
        require_full_package=False,
        timeout_ms=int(payload.get("timeout_ms") or 30_000),
    )
    try:
        result = orch.orchestrate(payload.get("input") or payload, run)
    except Exception as exc:  # noqa: BLE001
        return JSONResponse(
            status_code=408 if "TIMEOUT" in str(exc) or "CANCELLED" in str(exc) else 500,
            content={"code": "ORCHESTRATION_ERROR", "message": str(exc)},
        )
    return JSONResponse(status_code=200, content=result)


@app.get("/v1/validation/golden-summary")
def validation_golden_summary() -> dict:
    return run_all_golden(repetitions=2)


@app.get("/v1/validation/disease-package-check")
def disease_package_check(full: bool = False) -> JSONResponse:
    try:
        if full:
            pkg = load_disease_package(require_full=True, allow_synthetic=False)
        else:
            pkg = load_disease_package(
                synthetic_fixture_dir(), require_full=False, allow_synthetic=True
            )
        return JSONResponse(
            {
                "ok": True,
                "count": pkg.count,
                "artifactSha256": pkg.manifest.get("artifactSha256"),
                "schemaVersion": pkg.manifest.get("schemaVersion"),
                "path": str(pkg.path),
                "full": full,
            }
        )
    except DiseasePackageError as exc:
        return JSONResponse(status_code=503, content={"ok": False, "error": str(exc)})


@app.exception_handler(Exception)
async def unhandled(request, exc):  # type: ignore[no-untyped-def]
    logger.exception("unhandled error")
    err = ErrorBody(code="CLINICAL_SERVICE_ERROR", message="Unhandled error", request_id=None)
    return JSONResponse(status_code=500, content=err.model_dump())
