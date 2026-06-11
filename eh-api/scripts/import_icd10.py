"""
ICD-10 diseases import karo + EH system map karo.
Free data: https://icd.who.int
"""
import os, json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL",
               "sqlite:///data/eh_arogya.db")
engine  = create_engine(DATABASE_URL)
Session = sessionmaker(bind=engine)

# ICD-10 Chapter → EH System mapping
ICD_CHAPTER_MAP = {
    "A": "PARASITIC",  # Infectious/parasitic
    "B": "PARASITIC",  # Viral/parasitic
    "C": "GLANDULAR",  # Neoplasms/cancer
    "D": "METABOLIC",  # Blood disorders
    "E": "METABOLIC",  # Endocrine/metabolic
    "F": "NEURO",      # Mental disorders
    "G": "NEURO",      # Nervous system
    "H": "METABOLIC",  # Eye/ear
    "I": "CARDIAC",    # Circulatory
    "J": "RESPIRATORY",# Respiratory
    "K": "GASTRIC",    # Digestive
    "L": "SKIN",       # Skin
    "M": "JOINTS",     # Musculoskeletal
    "N": "RENAL",      # Genitourinary
    "O": "GYNE",       # Pregnancy
    "P": "METABOLIC",  # Perinatal
    "Q": "METABOLIC",  # Congenital
    "R": "FEVER",      # Symptoms/signs
    "S": "NEURO",      # Injuries
    "T": "METABOLIC",  # Poisoning
}

# ICD-10 Chapter → Base medicines
ICD_MEDICINES_MAP = {
    "CARDIAC":     "A2,A1,A3,L1",
    "RENAL":       "S6,C6,L1",
    "RESPIRATORY": "P4,P1,F1",
    "GASTRIC":     "S10,C10",
    "NEURO":       "F1,F2,S5,C4",
    "JOINTS":      "A3,S5,C4,L1,F1",
    "SKIN":        "S3,S5,L1",
    "METABOLIC":   "S1,A3,L1",
    "GYNE":        "C1,Ven1,S2,L1",
    "GLANDULAR":   "C1,L1,S1",
    "PARASITIC":   "Ver1,Ver2,S1",
    "FEVER":       "F1,S1",
    "LIVER":       "S5,C5,L1",
}

# ICD-10 Chapter names
ICD_CATEGORIES = {
    "A":"Infectious Diseases","B":"Viral Diseases",
    "C":"Neoplasms","D":"Blood Disorders",
    "E":"Endocrine/Metabolic","F":"Mental Disorders",
    "G":"Nervous System","H":"Eye and Ear",
    "I":"Cardiovascular","J":"Respiratory",
    "K":"Digestive","L":"Skin",
    "M":"Musculoskeletal","N":"Genitourinary",
    "O":"Pregnancy","R":"Symptoms/Signs",
    "S":"Injuries","T":"Poisoning",
}

def generate_icd10_diseases():
    """
    Representative ICD-10 diseases generate karo.
    Real ICD-10 ke liye WHO website se download karo.
    """
    diseases = []

    # I - Cardiovascular (50 diseases)
    cardiac_diseases = [
        ("I10","Essential Hypertension","I","Cardiovascular"),
        ("I11","Hypertensive Heart Disease","I","Cardiovascular"),
        ("I20","Angina Pectoris","I","Cardiovascular"),
        ("I21","Acute Myocardial Infarction","I","Cardiovascular"),
        ("I25","Chronic Ischaemic Heart Disease","I","Cardiovascular"),
        ("I27","Pulmonary Heart Disease","I","Cardiovascular"),
        ("I34","Mitral Valve Disorders","I","Cardiovascular"),
        ("I48","Atrial Fibrillation","I","Cardiovascular"),
        ("I50","Heart Failure","I","Cardiovascular"),
        ("I63","Cerebral Infarction / Stroke","I","Cardiovascular"),
        ("I70","Atherosclerosis","I","Cardiovascular"),
        ("I73","Peripheral Vascular Disease","I","Cardiovascular"),
        ("I80","Phlebitis / Thrombophlebitis","I","Cardiovascular"),
        ("I83","Varicose Veins","I","Cardiovascular"),
        ("I84","Haemorrhoids / Piles","I","Cardiovascular"),
        ("I95","Hypotension","I","Cardiovascular"),
    ]

    # J - Respiratory (30 diseases)
    respiratory_diseases = [
        ("J00","Common Cold","J","Respiratory"),
        ("J01","Sinusitis","J","Respiratory"),
        ("J02","Acute Pharyngitis","J","Respiratory"),
        ("J03","Acute Tonsillitis","J","Respiratory"),
        ("J04","Acute Laryngitis","J","Respiratory"),
        ("J06","Upper Respiratory Infection","J","Respiratory"),
        ("J11","Influenza","J","Respiratory"),
        ("J18","Pneumonia","J","Respiratory"),
        ("J20","Acute Bronchitis","J","Respiratory"),
        ("J30","Allergic Rhinitis","J","Respiratory"),
        ("J32","Chronic Sinusitis","J","Respiratory"),
        ("J35","Chronic Tonsillitis","J","Respiratory"),
        ("J40","Bronchitis Unspecified","J","Respiratory"),
        ("J42","Chronic Bronchitis","J","Respiratory"),
        ("J45","Asthma","J","Respiratory"),
        ("J96","Respiratory Failure","J","Respiratory"),
    ]

    # K - Digestive (40 diseases)
    digestive_diseases = [
        ("K21","Gastro-Oesophageal Reflux","K","Digestive"),
        ("K25","Gastric Ulcer","K","Digestive"),
        ("K26","Duodenal Ulcer","K","Digestive"),
        ("K29","Gastritis","K","Digestive"),
        ("K35","Appendicitis","K","Digestive"),
        ("K40","Inguinal Hernia","K","Digestive"),
        ("K50","Crohns Disease","K","Digestive"),
        ("K51","Ulcerative Colitis","K","Digestive"),
        ("K57","Diverticular Disease","K","Digestive"),
        ("K58","Irritable Bowel Syndrome","K","Digestive"),
        ("K59.0","Constipation","K","Digestive"),
        ("K59.1","Diarrhoea","K","Digestive"),
        ("K70","Alcoholic Liver Disease","K","Digestive"),
        ("K71","Toxic Liver Disease","K","Digestive"),
        ("K74","Hepatic Fibrosis","K","Digestive"),
        ("K80","Cholelithiasis / Gallstones","K","Digestive"),
        ("K81","Cholecystitis","K","Digestive"),
        ("K85","Acute Pancreatitis","K","Digestive"),
        ("K86","Chronic Pancreatitis","K","Digestive"),
        ("K92","Gastrointestinal Bleeding","K","Digestive"),
    ]

    # M - Musculoskeletal (50 diseases)
    musculo_diseases = [
        ("M05","Rheumatoid Arthritis","M","Musculoskeletal"),
        ("M06","Seronegative Arthritis","M","Musculoskeletal"),
        ("M08","Juvenile Arthritis","M","Musculoskeletal"),
        ("M10","Gout","M","Musculoskeletal"),
        ("M16","Hip Osteoarthritis","M","Musculoskeletal"),
        ("M17","Knee Osteoarthritis","M","Musculoskeletal"),
        ("M19","Other Osteoarthritis","M","Musculoskeletal"),
        ("M25","Joint Pain Unspecified","M","Musculoskeletal"),
        ("M40","Kyphosis / Spinal Curvature","M","Musculoskeletal"),
        ("M47","Spondylosis","M","Musculoskeletal"),
        ("M48","Spinal Stenosis","M","Musculoskeletal"),
        ("M51","Disc Disorders","M","Musculoskeletal"),
        ("M54.2","Cervicalgia","M","Musculoskeletal"),
        ("M54.3","Sciatica","M","Musculoskeletal"),
        ("M54.4","Lumbago with Sciatica","M","Musculoskeletal"),
        ("M54.5","Low Back Pain","M","Musculoskeletal"),
        ("M65","Synovitis and Tenosynovitis","M","Musculoskeletal"),
        ("M75","Shoulder Lesions","M","Musculoskeletal"),
        ("M79","Fibromyalgia","M","Musculoskeletal"),
    ]

    # N - Genitourinary (40 diseases)
    genito_diseases = [
        ("N02","Recurrent Haematuria","N","Genitourinary"),
        ("N10","Acute Tubulointerstitial Nephritis","N","Genitourinary"),
        ("N11","Chronic Tubulointerstiti Nephritis","N","Genitourinary"),
        ("N18","Chronic Kidney Disease","N","Genitourinary"),
        ("N20","Kidney Stone","N","Genitourinary"),
        ("N21","Bladder Stone","N","Genitourinary"),
        ("N30","Cystitis","N","Genitourinary"),
        ("N39","UTI Unspecified","N","Genitourinary"),
        ("N40","Prostate Enlargement","N","Genitourinary"),
        ("N60","Benign Mammary Dysplasia","N","Genitourinary"),
        ("N70","Salpingitis","N","Genitourinary"),
        ("N73","Pelvic Inflammatory Disease","N","Genitourinary"),
        ("N76","Vaginitis","N","Genitourinary"),
        ("N80","Endometriosis","N","Genitourinary"),
        ("N83","Ovarian Cyst","N","Genitourinary"),
        ("N89","Leucorrhoea","N","Genitourinary"),
        ("N92","Heavy Menstruation","N","Genitourinary"),
        ("N94","Dysmenorrhoea","N","Genitourinary"),
        ("N95","Menopausal Disorders","N","Genitourinary"),
    ]

    all_diseases = (cardiac_diseases + respiratory_diseases +
                    digestive_diseases + musculo_diseases + genito_diseases)

    for code, name, chapter, category in all_diseases:
        sys_key = ICD_CHAPTER_MAP.get(chapter, "METABOLIC")
        base_meds = ICD_MEDICINES_MAP.get(sys_key, "S1,L1")
        diseases.append({
            "icd10_code":   code,
            "name_english": name,
            "category":     category,
            "system_key":   sys_key,
            "symptoms_en":  name.lower(),
            "base_medicines": base_meds,
        })

    return diseases


def import_to_db():
    from eh_api import Disease, Base, engine as app_engine
    db = Session()

    existing = db.query(Disease).count()
    print(f"Existing diseases: {existing}")

    diseases = generate_icd10_diseases()
    added = 0
    for d in diseases:
        exists = db.query(Disease).filter(
            Disease.icd10_code == d["icd10_code"]
        ).first()
        if not exists:
            db.add(Disease(**d))
            added += 1

    db.commit()
    total = db.query(Disease).count()
    print(f"Added: {added} new diseases")
    print(f"Total diseases now: {total}")
    db.close()


if __name__ == "__main__":
    import_to_db()