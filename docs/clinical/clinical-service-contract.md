# Clinical service contract (Phase 5B)

Service: `apps/clinical-engine/` (Python FastAPI scaffold)

| Endpoint | Behavior |
|----------|----------|
| `GET /health` | liveness |
| `GET /ready` | **503**, `ready: false` |
| `GET /version` | engine/rule versions |
| `GET /status/data-package` | generated_local / installed_live=false |
| `GET /status/medicine-registry` | 39 / C11 PRESENT |
| `GET /status/rules` | interfaces + Rule 8 NOT_IMPLEMENTED |
| `POST /v1/analyze-complete` | **501** `CLINICAL_ENGINE_NOT_CONNECTED` |

No synthetic prescription success. No default WE. Tablet selection inactive.
