import os
from datetime import datetime
from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

Base = declarative_base()

class Medicine(Base):
    __tablename__  = "medicines"
    id             = Column(String, primary_key=True)
    name           = Column(String)
    group_type     = Column(String)
    polarity       = Column(String)
    target_organ   = Column(String)
    description    = Column(Text)
    organ_action   = Column(Text)
    when_to_give   = Column(Text)

class Disease(Base):
    __tablename__   = "diseases"
    id              = Column(Integer, primary_key=True, autoincrement=True)
    icd10_code      = Column(String)
    name_english    = Column(String, unique=True)
    category        = Column(String)
    system_key      = Column(String)
    symptoms_en     = Column(Text)
    base_medicines  = Column(Text)

class PotencyRule(Base):
    __tablename__ = "potency_rules"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    condition     = Column(String)
    polarity      = Column(String)
    phase         = Column(String)
    age_min       = Column(Integer, default=0)
    age_max       = Column(Integer, default=120)
    dilution      = Column(String)
    matra_type    = Column(String)
    reason        = Column(Text)

class ApiKey(Base):
    __tablename__ = "api_keys"
    id            = Column(Integer, primary_key=True, autoincrement=True)
    key_hash      = Column(String, unique=True)
    doctor_name   = Column(String)
    email         = Column(String)
    is_active     = Column(Boolean, default=True)
    daily_limit   = Column(Integer, default=100)
    created_at    = Column(DateTime, default=datetime.utcnow)

class Consultation(Base):
    __tablename__  = "consultations"
    id             = Column(Integer, primary_key=True, autoincrement=True)
    api_key_hash   = Column(String)
    patient_name   = Column(String)
    age            = Column(Integer)
    gender         = Column(String)
    bp_systolic    = Column(Integer)
    bp_diastolic   = Column(Integer)
    symptoms_input = Column(Text)
    prakriti       = Column(String)
    polarity       = Column(String)
    potency        = Column(String)
    formula_json   = Column(Text)
    safety_status  = Column(String)
    created_at     = Column(DateTime, default=datetime.utcnow)

# ═══════════════════════════════════════════════
# DATABASE SETUP
# ═══════════════════════════════════════════════
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "eh_arogya.db")
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

db_path_normalized = DB_PATH.replace("\\", "/")
db_url = f"sqlite:///{db_path_normalized}"
engine = create_engine(db_url, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

def init_db():
    Base.metadata.create_all(bind=engine)
