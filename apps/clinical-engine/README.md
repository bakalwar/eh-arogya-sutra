# EHAS2 Clinical Engine (scaffold)

Phase 5B isolated Python service. Analysis returns `CLINICAL_ENGINE_NOT_CONNECTED`.

```bash
# from repo root
apps/clinical-engine/.venv/Scripts/python.exe -m uvicorn ehas2_clinical_engine.app:app --app-dir apps/clinical-engine/src --port 4102
apps/clinical-engine/.venv/Scripts/python.exe -m unittest discover -s apps/clinical-engine/tests -p "test_*.py"
```

Do not import the protected old-project runtime.
