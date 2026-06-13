"""SQLAlchemy models + SQLite setup for standalone numerology-api."""
import json
import os
from typing import Generator

from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    event,
)
from sqlalchemy.orm import Session, declarative_base, sessionmaker

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("NUMEROLOGY_DB_PATH", os.path.join(BASE_DIR, "numerology.db"))
DATABASE_URL = f"sqlite:///{DB_PATH.replace(chr(92), '/')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


@event.listens_for(engine, "connect")
def _sqlite_fk(dbapi_conn, _):
    dbapi_conn.execute("PRAGMA foreign_keys=ON")


class NumerologyBase(Base):
    __tablename__ = "numerology_base"

    number = Column(Integer, primary_key=True)
    planet = Column(String(32), nullable=False)
    dasha_name = Column(String(64), nullable=False)
    dosha_primary = Column(String(16), nullable=False)
    dosha_secondary = Column(String(16), nullable=True)
    organs_json = Column(Text, nullable=False)

    @property
    def organs(self):
        return json.loads(self.organs_json or "[]")

    @organs.setter
    def organs(self, value):
        self.organs_json = json.dumps(value)


class NumerologyTendency(Base):
    __tablename__ = "numerology_tendencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    number = Column(Integer, ForeignKey("numerology_base.number"), nullable=False, index=True)
    dosha = Column(String(16), nullable=False, index=True)
    organ = Column(String(128), nullable=False, index=True)
    severity = Column(String(16), nullable=False, index=True)
    age_band = Column(String(16), nullable=False, index=True)
    gender = Column(String(16), nullable=False, index=True)
    variant_index = Column(Integer, nullable=False, default=0)
    tendency_text = Column(Text, nullable=False)
    watch_point = Column(Text, nullable=False)


BASE_SEED = [
    (1, "Sun", "Surya Dasha", "Pitta", None, ["Heart", "Eyes", "Spine", "Brain"]),
    (2, "Moon", "Chandra Dasha", "Kapha", None, ["Lungs", "Stomach", "Chest", "Lymph"]),
    (3, "Jupiter", "Guru Dasha", "Kapha", "Pitta", ["Liver", "Gallbladder", "Pancreas", "Arteries"]),
    (4, "Rahu", "Rahu Dasha", "Vata", None, ["Nervous System", "Legs", "Respiratory Tract"]),
    (5, "Mercury", "Budha Dasha", "Vata", None, ["Nerves", "Hands", "Shoulders", "Thyroid"]),
    (6, "Venus", "Shukra Dasha", "Kapha", "Pitta", ["Kidneys", "Reproductive System", "Throat"]),
    (7, "Ketu", "Ketu Dasha", "Vata", None, ["Intestines", "Subtle Nerves", "Skin"]),
    (8, "Saturn", "Shani Dasha", "Vata", "Kapha", ["Bones", "Joints", "Teeth", "Large Intestine"]),
    (9, "Mars", "Mangal Dasha", "Pitta", None, ["Blood", "Muscles", "Head", "Bone Marrow"]),
]


def init_db():
    Base.metadata.create_all(bind=engine)


def seed_base_rows(db: Session) -> int:
    added = 0
    for number, planet, dasha, primary, secondary, organs in BASE_SEED:
        row = db.query(NumerologyBase).filter(NumerologyBase.number == number).first()
        if row:
            continue
        row = NumerologyBase(
            number=number,
            planet=planet,
            dasha_name=dasha,
            dosha_primary=primary,
            dosha_secondary=secondary,
        )
        row.organs = organs
        db.add(row)
        added += 1
    db.commit()
    return added


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
