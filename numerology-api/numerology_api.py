"""
Standalone Constitutional Baseline API — port 8001.
Completely separate from eh-api (no imports, no shared DB).
"""
import os

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from numerology_db import NumerologyTendency, get_db, init_db, seed_base_rows
from numerology_engine import build_baseline, build_correlation

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI(
    title="E.H. Constitutional Baseline API",
    description="Name-derived constitutional tendency (standalone — not eh-api)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BaselineRequest(BaseModel):
    name: str = Field(..., min_length=1, examples=["Ghanshyam"])
    age: int = Field(40, ge=0, le=120)
    gender: str = Field("Male", examples=["Male"])


class CorrelationRequest(BaseModel):
    name: str = Field(..., min_length=1)
    age: int = Field(40, ge=0, le=120)
    gender: str = Field("Male")
    photo_detected_dosha: str = Field(..., examples=["Pitta"])
    photo_detected_organs: list[str] = Field(default_factory=list)


@app.on_event("startup")
def on_startup():
    init_db()
    db = next(get_db())
    try:
        seed_base_rows(db)
    finally:
        db.close()


@app.get("/api/health")
def health(db: Session = Depends(get_db)):
    count = db.query(NumerologyTendency).count()
    return {"status": "ok", "entries": count}


@app.post("/api/baseline")
def baseline(body: BaselineRequest, db: Session = Depends(get_db)):
    try:
        return build_baseline(db, name=body.name, age=body.age, gender=body.gender)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@app.post("/api/correlation")
def correlation(body: CorrelationRequest, db: Session = Depends(get_db)):
    try:
        return build_correlation(
            db,
            name=body.name,
            age=body.age,
            gender=body.gender,
            photo_detected_dosha=body.photo_detected_dosha,
            photo_detected_organs=body.photo_detected_organs,
        )
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("NUMEROLOGY_API_PORT", "8001"))
    uvicorn.run("numerology_api:app", host="0.0.0.0", port=port, reload=False)
