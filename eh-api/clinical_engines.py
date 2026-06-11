import json, re, os
import pandas as pd
from rapidfuzz import process, fuzz
from datetime import datetime
from typing import Optional, List, Set, Dict
from models import Medicine, engine as db_engine

# ═══════════════════════════════════════════════
# FUZZY DISEASE ENGINE (Rule 9 - 14,000 Diseases)
# ═══════════════════════════════════════════════

class FuzzyDiseaseEngine:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(FuzzyDiseaseEngine, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        try:
            print("DEBUG: Loading 14,000 diseases into Fuzzy Engine...")
            # Load all relevant columns for a combined search space
            self.df = pd.read_sql("SELECT name_english, system_key, base_medicines, symptoms_en FROM diseases", db_engine)
            # Create a combined search space of name and symptoms
            self.df['search_text'] = self.df['name_english'] + " " + self.df['symptoms_en'].fillna('')
            self.search_space = self.df['search_text'].tolist()
            self._initialized = True
            print(f"DEBUG: Fuzzy Engine ready with {len(self.search_space)} records.")
        except Exception as e:
            print(f"ERROR: Failed to initialize Fuzzy Engine: {e}")
            self.df = pd.DataFrame()
            self.search_space = []

    def find_matches(self, query, threshold=70):
        if not self.search_space:
            return []
        
        # Using WRatio for better multi-word and partial matching
        results = process.extract(
            query, 
            self.search_space, 
            scorer=fuzz.WRatio,
            limit=5
        )
        
        matches = []
        for res in results:
            if res[1] >= threshold:
                matched_row = self.df.iloc[res[2]]
                matches.append({
                    "name": matched_row['name_english'],
                    "system": matched_row['system_key'],
                    "meds": matched_row['base_medicines'],
                    "score": res[1]
                })
        return matches

# Global instance
fuzzy_engine = FuzzyDiseaseEngine()

# ═══════════════════════════════════════════════
# CONSTANTS
# ═══════════════════════════════════════════════

PRAKRITI_KEYWORDS = {
    "Lymphatic": ["swelling", "lymph", "white discharge", "constipation", "obesity", "cold", "sluggish", "sujan", "kabz", "motapa", "thanda"],
    "Sanguine":  ["high bp", "fast heartbeat", "bleeding", "hot", "flushing", "arterial", "circulation", "rakt", "khoon", "garam"],
    "Bilious":   ["jaundice", "liver", "bile", "acidity", "yellow", "pitta", "pila", "liver dard"],
    "Nervous":   ["sciatica", "tingling", "nerve pain", "anxiety", "shooting", "nas", "nervous", "bechaini"],
}

POS_KW = ["swelling", "high bp", "bleeding", "fever", "inflammation", "fast heartbeat", "redness", "eruption", "excess", "sujan", "bukhar", "jalan", "lal"]
NEG_KW = ["weakness", "constipation", "paralysis", "low bp", "numbness", "atrophy", "slow", "anemia", "cold", "loss of", "kamzori", "kabz", "lakwa", "thanda"]

POTENCY_TABLE = {
    ("POSITIVE","acute"):       ("D10",  "UCHCH"),
    ("POSITIVE","sub_acute"):   ("D10",  "UCHCH"),
    ("POSITIVE","chronic"):     ("D30",  "UCHCH"),
    ("POSITIVE","degenerative"):("D200", "UCHCH"),
    ("NEGATIVE","acute"):       ("D4",   "TEEVRA"),
    ("NEGATIVE","sub_acute"):   ("D5",   "TEEVRA"),
    ("NEGATIVE","chronic"):     ("D5",   "TEEVRA"),
    ("NEGATIVE","degenerative"):("D5",   "TEEVRA"),
    ("MIXED","acute"):          ("D4",   "SAMANYA"),
    ("MIXED","sub_acute"):      ("D5",   "SAMANYA"),
    ("MIXED","chronic"):        ("D5",   "SAMANYA"),
    ("MIXED","degenerative"):   ("D5",   "SAMANYA"),
}

# ═══════════════════════════════════════════════
# REMEDY GROUPS & PRIORITIES (Version 3.3 — Medical Precision)
# ═══════════════════════════════════════════════

SYSTEM_S_PRIORITIES = {
    "RENAL":        ['S6', 'S2', 'S1', 'S5'],
    "CARDIAC":      ['S1', 'S5', 'S2', 'S10'],
    "RESPIRATORY":  ['S1', 'S10', 'S2', 'S11'],
    "GASTRIC":      ['S10', 'S11', 'S1', 'S12'],
    "LIVER":        ['S10', 'S11', 'S1', 'S12'],
    "CONSTIPATION": ['S-Lass', 'S10', 'S1', 'S11'],
    "JOINTS":       ['S5', 'S6', 'S2', 'S1'],
    "METABOLIC":    ['S1', 'S2', 'S10', 'S5'],
    "GYNE":         ['S2', 'S1', 'S10', 'S5'],
    "NEURO":        ['S5', 'S1', 'S10', 'S2'],
    "SKIN":         ['S5', 'S3', 'S1', 'S2'],
    "FEVER":        ['S1', 'S10', 'S5', 'S11'],
    "GLANDULAR":    ['S1', 'S5', 'S2', 'S6'],
    "PARASITIC":    ['S10', 'S1', 'S2', 'Ver1'],
}

SYSTEM_C_PRIORITIES = {
    "RENAL":        ['C6', 'C2', 'C10', 'C17', 'C1'],
    "CARDIAC":      ['C1', 'C5', 'C15', 'C2'],
    "RESPIRATORY":  ['C1', 'C13', 'C15', 'C10'],
    "GASTRIC":      ['C10', 'C15', 'C1', 'C2'],
    "LIVER":        ['C10', 'C15', 'C1', 'C2'],
    "CONSTIPATION": ['C10', 'C15', 'C1', 'C17'],
    "JOINTS":       ['C4', 'C5', 'C2', 'C1'],
    "METABOLIC":    ['C1', 'C2', 'C15', 'C10'],
    "GYNE":         ['C1', 'C2', 'C10', 'C5'],
    "NEURO":        ['C1', 'C5', 'C4', 'C10'],
    "SKIN":         ['C5', 'C3', 'C1', 'C10'],
    "FEVER":        ['C1', 'C13', 'C10', 'C15'],
    "GLANDULAR":    ['C1', 'C3', 'C13', 'C5', 'C2'],
    "PARASITIC":    ['C10', 'C1', 'C15', 'C2'],
}

SYSTEM_SPEC_PRIORITIES = {
    "RENAL":        ['A1', 'A2', 'L1', 'P2'],
    "CARDIAC":      ['A1', 'A3', 'F1', 'A2'],
    "RESPIRATORY":  ['P1', 'P2', 'P3', 'P4'],
    "GASTRIC":      ['F1', 'L1', 'A2', 'Ver2'],
    "LIVER":        ['F1', 'L1', 'A2', 'Ver2'],
    "CONSTIPATION": ['F1', 'L1', 'A2', 'Ver1'],
    "JOINTS":       ['F2', 'L1', 'A3', 'S5'],
    "METABOLIC":    ['F1', 'A1', 'L1', 'Ven1'],
    "GYNE":         ['Ven1', 'A3', 'L1', 'F1'],
    "NEURO":        ['F1', 'F2', 'L1', 'A1'],
    "SKIN":         ['L1', 'Ven1', 'S5', 'A2'],
    "FEVER":        ['F1', 'A3', 'P1', 'L1'],
    "GLANDULAR":    ['L1', 'A2', 'F1', 'Ven1'],
    "PARASITIC":    ['Ver1', 'Ver2', 'L1', 'F1'],
}

ELECTRICITY_GROUP = ["RE", "BE", "YE", "WE", "GE"]

SYSTEM_ELEC_DEFAULT = {
    "RENAL": "BE", "CARDIAC": "BE", "LIVER": "YE", "GYNE": "WE",
    "NEURO": "RE", "JOINTS": "RE", "RESPIRATORY": "WE", "GASTRIC": "YE",
    "METABOLIC": "RE", "SKIN": "GE", "FEVER": "WE", "GLANDULAR": "GE",
    "CONSTIPATION": "YE", "PARASITIC": "YE"
}

SYMPTOM_MAP = {
    # Gastric / Liver
    "stomach": "GASTRIC", "pet": "GASTRIC", "gas": "GASTRIC", "acidity": "GASTRIC",
    "bloating": "GASTRIC", "indigestion": "GASTRIC", "pachan": "GASTRIC",
    "liver": "LIVER", "jaundice": "LIVER", "piliya": "LIVER", "fatty liver": "LIVER",
    "constipation": "CONSTIPATION", "kabz": "CONSTIPATION", "kabj": "CONSTIPATION", 
    "stools": "CONSTIPATION", "pet saf": "CONSTIPATION", "stomach clear": "CONSTIPATION",
    "hard stool": "CONSTIPATION",
    
    # Cardiac / Renal
    "heart": "CARDIAC", "bp": "CARDIAC", "blood pressure": "CARDIAC", "palpitation": "CARDIAC",
    "chest pain": "CARDIAC", "dhakan": "CARDIAC", "seena": "CARDIAC", "shine": "CARDIAC",
    "chhathi": "CARDIAC", "chest": "CARDIAC",
    "kidney": "RENAL", "urine": "RENAL", "creatinine": "RENAL", "uric acid": "RENAL",
    "swelling": "RENAL", "sujan": "RENAL", "stone": "RENAL", "pathri": "RENAL",
    "peshab": "RENAL", "mutr": "RENAL", "mutra": "RENAL", "gurda": "RENAL",
    "pishab": "RENAL", "pichab": "RENAL",
    
    # Respiratory
    "cough": "RESPIRATORY", "khansi": "RESPIRATORY", "asthma": "RESPIRATORY", "breathless": "RESPIRATORY",
    "throat": "RESPIRATORY", "gala": "RESPIRATORY", "cold": "RESPIRATORY", "jukham": "RESPIRATORY",
    
    # Neuro / Joints
    "joint": "JOINTS", "arthritis": "JOINTS", "ghutno": "JOINTS", "knee": "JOINTS",
    "gardan": "JOINTS", "neck": "JOINTS", "shoulder": "JOINTS", "cervical": "JOINTS",
    "spine": "JOINTS", "stiff": "JOINTS",
    "back pain": "NEURO", "kamar": "NEURO", "sciatica": "NEURO", "nerve": "NEURO",
    "nas": "NEURO", "headache": "NEURO", "sir dard": "NEURO", "dizziness": "NEURO",
    "jhun jhuni": "METABOLIC", "tingling": "METABOLIC", "numb": "METABOLIC", 
    "suun": "METABOLIC", "paresthesia": "METABOLIC",
    
    # Others
    "skin": "SKIN", "itching": "SKIN", "khujli": "SKIN", "rash": "SKIN",
    "fever": "FEVER", "bukhar": "FEVER", "typhoid": "FEVER",
    "weakness": "METABOLIC", "kamzori": "METABOLIC", "fatigue": "METABOLIC",
    "diabetes": "METABOLIC", "sugar": "METABOLIC",
    "white discharge": "GYNE", "period": "GYNE", "menses": "GYNE", "ovary": "GYNE", "uterus": "GYNE",
    "safed pani": "GYNE", "bloding": "GYNE", "bleeding": "GYNE", "menses": "GYNE",
    "stan": "GLANDULAR", "breast": "GLANDULAR", "esatan": "GLANDULAR",
    "lymph": "GLANDULAR", "gland": "GLANDULAR", "thyroid": "GLANDULAR",
    "ganth": "GLANDULAR", "galthi": "GLANDULAR", "lump": "GLANDULAR", "tumor": "GLANDULAR",
    "cancer": "GLANDULAR",
    "worms": "PARASITIC", "kide": "PARASITIC",
    "pet dard": "GASTRIC", "stomach pain": "GASTRIC"
}

SYSTEM_PRIORITY = {
    "CARDIAC":1,"RENAL":2,"GYNE":3,"GASTRIC":4,"CONSTIPATION":5,"LIVER":6,
    "FEVER":7,"RESPIRATORY":8,"NEURO":9,"JOINTS":10,"SKIN":11,"METABOLIC":12,
    "GLANDULAR":13,"PARASITIC":14
}

# ═══════════════════════════════════════════════
# ENGINES
# ═══════════════════════════════════════════════

SCHEDULES = {
    1: ["Morning + Night (empty stomach)"],
    2: ["Morning + Afternoon (empty stomach)",
        "Evening + Night (after meal)"],
    3: ["Morning (empty stomach)",
        "Afternoon (after meal)",
        "Night (before sleep)"],
    4: ["Morning (empty stomach)","After breakfast",
        "Evening (empty stomach)","Night (before sleep)"],
}

DROPS_MAP = {(0,2):2,(3,5):3,(6,12):5,(13,18):7,(19,60):10,(61,75):7,(76,120):5}
FREQ_MAP = {
    ("POSITIVE","acute"):       ("6 times daily","5 drops every 10 minutes (for 1 hour) then every 2 hours"),
    ("POSITIVE","sub_acute"):   ("4 times daily","Every 4-5 hours"),
    ("POSITIVE","chronic"):     ("3 times daily","Morning + Noon + Night"),
    ("POSITIVE","degenerative"):("2 times daily","Morning + Night"),
    ("NEGATIVE","acute"):       ("4 times daily","Every 4 hours"),
    ("NEGATIVE","sub_acute"):   ("4 times daily","Every 5-6 hours"),
    ("NEGATIVE","chronic"):     ("3 times daily","Morning + Noon + Night"),
    ("NEGATIVE","degenerative"):("2 times daily","Morning + Night"),
    ("MIXED","acute"):          ("4 times daily","Every 4-5 hours"),
    ("MIXED","chronic"):        ("3 times daily","Morning + Noon + Night"),
}
DURATION_MAP = {"acute":"5-7 days","sub_acute":"15-30 days",
                "chronic":"3 months minimum","degenerative":"6+ months"}

DIET_BASE = {
    "POSITIVE":{
        "eat":["Khichdi (rice+lentil)","Moong dal","Bottle gourd",
               "Cucumber","Papaya","Pomegranate","Coconut water",
               "Warm water 8-10 glasses daily"],
        "avoid":["Salt — stop completely","Fried/oily food",
                 "Alcohol+Tobacco — strictly","Cold drinks/ice cream",
                 "Tea/coffee excess","Packaged/processed food"],
        "lifestyle":["30 min gentle walk daily","7-8 hours sleep",
                     "10 min meditation","Only warm water always"],
    },
    "NEGATIVE":{
        "eat":["Dates (khajoor)","Soaked almonds","Walnuts",
               "Turmeric milk (warm)","Jaggery (gud)","Pomegranate",
               "Ginger tea (1 cup)","Warm water 8-10 glasses"],
        "avoid":["Cold water/ice cream","Stale food",
                 "Late night sleeping","Overexertion","Excess sweets"],
        "lifestyle":["Morning sunlight 20-30 min","Light yoga/walk",
                     "Sleep before 10 PM","Positive thinking"],
    },
    "MIXED":{
        "eat":["Khichdi","Moong dal","Apple","Papaya",
               "Warm water 8-10 glasses"],
        "avoid":["Cold water","Fried food","Alcohol+Tobacco"],
        "lifestyle":["20 min walk daily","Balanced routine"],
    },
}
SYSTEM_DIET_EXTRA = {
    "CARDIAC": {"eat":["Flaxseeds","Cooked garlic","Arjuna bark water"],
                "avoid":["Salt ZERO","Butter excess","Red meat"]},
    "RENAL":   {"eat":["2-3 liters warm water daily","Watermelon","Cucumber"],
                "avoid":["Salt ZERO","Pickles","Excess protein"]},
    "LIVER":   {"eat":["Bitter gourd juice (morning)","Turmeric","Lemon water"],
                "avoid":["Alcohol STRICTLY","Fried food","Red meat"]},
    "JOINTS":  {"eat":["Turmeric milk (night)","Ginger","Warm water+lemon"],
                "avoid":["Urad dal STRICTLY","Alcohol","Red meat excess"]},
    "GYNE":    {"eat":["Spinach","Dates","Sesame seeds","Jaggery"],
                "avoid":["Cold water during periods","Processed food"]},
    "RESPIRATORY":{"eat":["Tulsi ginger tea","Honey+black pepper","Turmeric milk"],
                   "avoid":["Cold drinks","Banana","Smoking STRICTLY"]},
    "GASTRIC": {"eat":["Cumin water","Fennel after meals","Papaya"],
                "avoid":["Spicy food","Empty stomach tea","Carbonated drinks"]},
    "SKIN":    {"eat":["Neem water","Cucumber","Amla juice","More water"],
                "avoid":["Spicy food","Excess pickles","Alcohol+Tobacco"]},
    "PARASITIC":{"eat":["Pumpkin seeds","Neem water","Raw papaya","Turmeric"],
                 "avoid":["Excess sweets","Maida products","Stale food"]},
}

def detect_active_systems(symptoms: str, bp_sys: int) -> List[str]:
    """
    9 EH RULE ENGINE - Rule 3: Organ/System Affinity Detection
    Detects active organ systems based on symptoms and blood pressure.
    Prioritizes symptoms over BP if symptoms are specific.
    """
    active_systems = []
    symptoms_lower = symptoms.lower()

    # 1. Comprehensive Hindi/English Symptom Mapping
    # Glandular / Cancer / Tumor
    if any(term in symptoms_lower for term in ['ganth', 'galthi', 'lump', 'tumor', 'cancer', 'stan', 'breast', 'esatan', 'lymph', 'gland', 'rasoli', 'goli']):
        active_systems.append('GLANDULAR')
    
    # Cardiac / Chest
    if any(term in symptoms_lower for term in ['heart', 'bp', 'blood pressure', 'palpitation', 'chest pain', 'dhakan', 'seena', 'shine', 'chhathi', 'chest', 'dil']):
        active_systems.append('CARDIAC')
        
    # Gastric / Digestive
    if any(term in symptoms_lower for term in ['pet', 'stomach', 'gas', 'acid', 'digest', 'pachan', 'bhukh', 'appetite', 'bloating', 'afara']):
        active_systems.append('GASTRIC')

    # Constipation / Bowel
    if any(term in symptoms_lower for term in ['pet saf', 'constipation', 'kabj', 'kabz', 'stomach clear', 'hard stool', 'latrine', 'pakhana']):
        active_systems.append('CONSTIPATION')

    # Liver / Hepatic
    if any(term in symptoms_lower for term in ['liver', 'jaundice', 'piliya', 'pitta', 'pitt', 'bile', 'fatty liver']):
        active_systems.append('LIVER')

    # Joints / Musculoskeletal
    if any(term in symptoms_lower for term in ['joint', 'arthritis', 'ghutno', 'knee', 'gardan', 'neck', 'shoulder', 'cervical', 'spine', 'stiff', 'gathiya', 'joro']):
        active_systems.append('JOINTS')

    # Neuro / Nerve
    if any(term in symptoms_lower for term in ['back pain', 'kamar', 'sciatica', 'nerve', 'nas', 'headache', 'sir dard', 'dizziness', 'chakkar', 'mirgi']):
        active_systems.append('NEURO')

    # Renal / Kidney
    if any(term in symptoms_lower for term in ['kidney', 'urine', 'creatinine', 'uric acid', 'swelling', 'sujan', 'stone', 'pathri', 'peshab', 'gurda', 'mutr', 'mutra', 'pishab', 'pichab', 'nali']):
        # Contextual check for 'nali' (tube/duct)
        if 'nali' in symptoms_lower:
            if any(u in symptoms_lower for u in ['urine', 'mutr', 'mutra', 'peshab', 'pishab', 'pichab']):
                active_systems.append('RENAL')
            elif any(l in symptoms_lower for l in ['pitt', 'pitta', 'liver', 'jaundice']):
                if 'LIVER' not in active_systems: active_systems.append('LIVER')
        else:
            active_systems.append('RENAL')

    # Gyne / Female (Exclude for Males)
    if any(term in symptoms_lower for term in ['white discharge', 'period', 'menses', 'ovary', 'uterus', 'bacchedani', 'safed pani']):
        active_systems.append('GYNE')

    # Metabolic / Constitutional
    if any(term in symptoms_lower for term in ['weakness', 'kamzori', 'fatigue', 'thakan', 'diabetes', 'sugar', 'jhun jhuni', 'tingling', 'numb', 'suun']):
        active_systems.append('METABOLIC')

    # 2. BP-based detection (Secondary priority)
    try:
        if bp_sys >= 145 and 'CARDIAC' not in active_systems:
            active_systems.append("CARDIAC")
        elif bp_sys < 95 and 'METABOLIC' not in active_systems:
            active_systems.append("METABOLIC")
    except:
        pass

    # Ensure uniqueness and limit to 4
    active_systems = list(dict.fromkeys(active_systems))[:4]
    
    if not active_systems:
        active_systems = ["METABOLIC"]
        
    return active_systems

def detect_prakriti(symptoms: str, bp_sys: int) -> str:
    text = symptoms.lower()
    scores = {k: 0 for k in PRAKRITI_KEYWORDS}
    for p, kws in PRAKRITI_KEYWORDS.items():
        for kw in kws:
            if kw in text: scores[p] += 2
    if bp_sys >= 140: scores["Sanguine"] += 3
    elif bp_sys < 100: scores["Lymphatic"] += 2
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Lymphatic"

def detect_polarity(symptoms: str, bp_sys: int, age: int, bp_dia: int = 80) -> str:
    """
    9 EH RULE ENGINE - Rule 2: Polarity (Hard Data Driven)
    Logic:
    - BP < 100/70 -> NEGATIVE (Hypo)
    - BP > 140/90 -> POSITIVE (Hyper)
    - Numbness -> Always NEGATIVE
    - Acute Pain -> Always POSITIVE
    """
    t = symptoms.lower()
    
    # Hard Pathological Data Priority
    if bp_sys > 140 or bp_dia > 90:
        return "POSITIVE"
    if bp_sys < 100 or bp_dia < 70:
        return "NEGATIVE"
        
    # Symptom-based Polarity
    neg_terms = ["weakness", "constipation", "paralysis", "low bp", "numbness", "atrophy", "slow", "anemia", "cold", "loss of", "kamzori", "kabz", "lakwa", "thanda", "sunn", "jhun jhuni", "pcod", "pcos", "lymphatic congestion", "safed pani", "leucorrhoea"]
    pos_terms = ["swelling", "high bp", "bleeding", "bloding", "fever", "inflammation", "fast heartbeat", "redness", "eruption", "excess", "sujan", "bukhar", "jalan", "lal", "acute pain", "tez dard", "period", "menses"]
    
    if any(term in t for term in neg_terms):
        return "NEGATIVE"
    if any(term in t for term in pos_terms):
        return "POSITIVE"
        
    # Default scoring
    pos = sum(1 for k in POS_KW if k in t)
    neg = sum(1 for k in NEG_KW if k in t)
    if age >= 60: neg += 1
    return "POSITIVE" if pos > neg else "NEGATIVE" if neg > pos else "MIXED"

def select_potency(polarity: str, condition: str, age: int, symptoms: str) -> dict:
    """
    9 EH RULE ENGINE - Rule 4: Potency (Inverse Relationship)
    Logic:
    - NEGATIVE disease -> Lower Potency (D4, D5, D6) to stimulate
    - POSITIVE disease -> Higher Potency (D10, D30, D200) to sedate
    """
    symptoms_lower = symptoms.lower()
    
    # 1. Polarity-Potency Inverse Rule
    if polarity == "NEGATIVE":
        # Lower potency to stimulate weak organs
        dil = "D5" if condition.lower() != "acute" else "D4"
        mtype = "TEEVRA"
        note = "NEGATIVE state: Lower potency to stimulate organ function."
    elif polarity == "POSITIVE":
        # Higher potency to sedate hyperactive organs
        dil = "D30" if condition.lower() == "chronic" else "D10"
        if condition.lower() == "degenerative": dil = "D200"
        mtype = "UCHCH"
        note = "POSITIVE state: Higher potency to sedate hyperactive processes."
    else:
        dil = "D6"
        mtype = "SAMANYA"
        note = "MIXED state: Balanced potency."

    # 2. Special Overrides
    if any(k in symptoms_lower for k in ["spur", "bone spur", "kanta"]):
        return {"dilution":"C4-200", "type":"UCHCH", "note":"Bone spur: C4-200 special potency"}
    
    if "cardiac" in symptoms_lower and ("high bp" in symptoms_lower or "hypertension" in symptoms_lower):
        return {"dilution":"D30", "type":"UCHCH", "note":"Hypertension: D30 to calm hyperactive state"}

    # Age overrides
    if age <= 12: 
        return {"dilution":"D1", "type":"TEEVRA", "note":"Child — D1 only (5 drops)"}
    
    return {"dilution":dil, "type":mtype, "note":note}

def detect_diseases_and_meds(db, symptoms: str, manual_diseases: List[str] = None) -> dict:
    """
    9 EH RULE ENGINE - Rule 9: Specific Disease Integration (Atomic Fuzzy Search)
    Splits multi-symptom inputs and searches the 14,000 diseases database.
    """
    detected_systems = []
    suggested_meds = []
    
    # 1. Split input into individual symptoms (Atomic splitting)
    # Handles: "and", "aur", ",", "with", "along with", and also common Hindi sentence endings
    # Added "hota hai", "hoti hai", "hai" as splitters to isolate symptoms
    split_pattern = r' and | aur | , | ,| with | along with | hota hai | hoti hai | hai | \. '
    raw_symptoms = re.split(split_pattern, symptoms.lower())
    atomic_symptoms = [s.strip() for s in raw_symptoms if len(s.strip()) > 2]
    
    print(f"DEBUG: Atomic Symptoms for DB Search: {atomic_symptoms}")

    # Translation map for common Hindi symptom words
    hindi_to_en = {
        "ganth": "lump", "galthi": "gland", "esatan": "breast", "stan": "breast",
        "shine": "chest", "seena": "chest", "chhathi": "chest", "pet": "stomach", "pait": "stomach",
        "dard": "pain", "darrd": "pain", "bukhar": "fever", "khansi": "cough", "sujan": "swelling",
        "pathri": "stone", "kide": "worms", "kabz": "constipation", "khoon": "blood",
        "rasoli": "tumor", "goli": "lump", "peshab": "urinary", "gurda": "kidney",
        "mutr": "urinary", "mutra": "urinary", "nali": "tract", "pitt": "bile", "rakt": "blood",
        "jalan": "burning", "pishab": "urinary", "pichab": "urinary", "urine": "urinary",
        "kamzori": "weakness", "thakan": "fatigue", "chakkar": "dizziness", "khujli": "itching",
        "jalan": "burning", "safed pani": "leucorrhoea", "motapa": "obesity", "bloding": "bleeding",
        "kamar": "back", "pero": "legs"
    }

    # 2. Process each atomic symptom
    for sym in atomic_symptoms:
        search_terms = [sym]
        
        # Add translation if available
        for word in re.split(r'[\s]+', sym):
            if word in hindi_to_en:
                search_terms.append(hindi_to_en[word])
        
        # Run fuzzy search for each term and collect best matches
        for term in list(dict.fromkeys(search_terms)):
            matches = fuzzy_engine.find_matches(term, threshold=75)
            for m in matches:
                if m["system"] and m["system"] not in detected_systems:
                    detected_systems.append(m["system"])
                if m["meds"]:
                    meds = [med.strip() for med in m["meds"].split(',') if med.strip()]
                    suggested_meds.extend(meds)

    # 3. Handle manual diseases (High threshold)
    if manual_diseases:
        for dname in manual_diseases:
            matches = fuzzy_engine.find_matches(dname, threshold=85)
            for m in matches:
                if m["system"] and m["system"] not in detected_systems:
                    detected_systems.append(m["system"])
                if m["meds"]:
                    meds = [med.strip() for med in m["meds"].split(',') if med.strip()]
                    suggested_meds.extend(meds)

    return {
        "systems": list(dict.fromkeys(detected_systems)),
        "meds": list(dict.fromkeys(suggested_meds))
    }

def build_formula_dynamic(db, systems, polarity, prakriti, potency_data, symptoms="", base_meds=None):
    """
    9 EH RULE ENGINE - Version 3.8 (Master Controller + Symptom Priority)
    Rule 1: Temperament -> Constitutional Medicine (Lymphatic: S1/L1, Sanguine: A2)
    Rule 3: Organ/System -> Priority separation in Mixtures A, B, C
    Rule 6: Electricity -> RE (Stimulate), BE (Bleed/Swell), WE (Nerve/Pain)
    Rule 7: Composition -> Strict S + C + A/Spec + Elec
    Rule 8: Uniqueness -> Zero repetition across A, B, C
    """
    print(f"DEBUG: build_formula_dynamic called for {prakriti} temperament with {len(systems)} systems")
    base_meds = base_meds or []
    dilution = potency_data["dilution"]
    mixtures = []
    ALPHA = ["A","B","C"]
    active_systems = list(systems)
    symptoms_lower = symptoms.lower()
    
    # Ensure 3 systems for 3 mixtures (Rule 3: Separation)
    fallbacks = ["METABOLIC", "GASTRIC", "RENAL", "JOINTS", "LIVER"]
    for fb in fallbacks:
        if len(active_systems) < 3 and fb not in active_systems:
            active_systems.append(fb)
    while len(active_systems) < 3:
        active_systems.append("METABOLIC")
            
    used_meds_global = set()
    timings = ["Morning (empty stomach)", "Afternoon (after meal)", "Night (empty stomach)"]

    # Rule 1: Temperament-based Constitutional Mandates
    constitutional_mandates = {
        "Lymphatic": ["S1", "L1"],
        "Sanguine":  ["A2"],
        "Bilious":   ["S10", "C5"],
        "Nervous":   ["F1", "S1"]
    }
    mandates = constitutional_mandates.get(prakriti, ["S1"])

    # Symptom-to-Medicine Direct Mapping (High Priority)
    symptom_med_map = {
        "ganth": ["C1", "L1", "C3"], "lump": ["C1", "L1", "C3"],
        "cancer": ["C1", "C3", "L1"], "stone": ["S6", "C6", "S2"],
        "pathri": ["S6", "C6", "S2"], "high bp": ["A2", "S1", "BE"],
        "low bp": ["A1", "S1", "RE"], "constipation": ["S-Lass", "C10"],
        "kabz": ["S-Lass", "C10"], "acidity": ["S10", "C15"],
        "burning": ["S2", "C2", "BE"], "jalan": ["S2", "C2", "BE"],
        "pain": ["F1", "F2", "S5"], "dard": ["F1", "F2", "S5"],
        "cough": ["P1", "P2", "P4"], "khansi": ["P1", "P2", "P4"],
        "swelling": ["L1", "S6", "S1"], "sujan": ["L1", "S6", "S1"],
        "period": ["S2", "C2", "Ven1"], "menses": ["S2", "C2", "Ven1"],
        "safed pani": ["S2", "C1", "L1"], "leucorrhoea": ["S2", "C1", "L1"],
        "bleeding": ["A3", "S2", "BE"], "bloding": ["A3", "S2", "BE"]
    }

    for idx, sys_key in enumerate(active_systems[:3]):
        selected_meds = []
        
        # Rule 3: System Specific Pools
        s_pool = SYSTEM_S_PRIORITIES.get(sys_key, ['S1', 'S10', 'S5'])
        c_pool = SYSTEM_C_PRIORITIES.get(sys_key, ['C1', 'C10', 'C5'])
        spec_pool = SYSTEM_SPEC_PRIORITIES.get(sys_key, ['F1', 'L1', 'A2'])

        # --- 1. S-GROUP SELECTION (Metabolism) ---
        m_s = None
        # Rule 1 Priority: Mandatory Constitutional for first mixture
        if idx == 0:
            m_s = next((r for r in mandates if r.startswith('S') and r not in used_meds_global), None)
        
        # Priority 2: Symptom Match
        if not m_s:
            for kw, meds in symptom_med_map.items():
                if kw in symptoms_lower:
                    m_s = next((r for r in meds if r.startswith('S') and r not in used_meds_global), None)
                    if m_s: break

        # Priority 3: Disease DB
        if not m_s:
            m_s = next((r for r in base_meds if r.startswith('S') and r not in used_meds_global), None)
            
        # Priority 4: System Pool
        if not m_s:
            m_s = next((r for r in s_pool if r not in used_meds_global), None)
            
        # Fallback (Rule 8: Uniqueness)
        if not m_s:
            m_s = next((r for r in ['S1', 'S2', 'S5', 'S10', 'S6', 'S3'] if r not in used_meds_global), s_pool[0])
        
        selected_meds.append(m_s); used_meds_global.add(m_s)

        # --- 2. C-GROUP SELECTION (Structure) ---
        m_c = None
        # Priority 1: Mandatory Constitutional
        if idx == 0:
            m_c = next((r for r in mandates if r.startswith('C') and r not in used_meds_global), None)
            
        # Priority 2: Symptom Match
        if not m_c:
            for kw, meds in symptom_med_map.items():
                if kw in symptoms_lower:
                    m_c = next((r for r in meds if r.startswith('C') and r not in used_meds_global), None)
                    if m_c: break

        # Priority 3: Disease DB
        if not m_c:
            m_c = next((r for r in base_meds if r.startswith('C') and r not in used_meds_global), None)
            
        # Priority 4: System Pool
        if not m_c:
            m_c = next((r for r in c_pool if r not in used_meds_global), None)
            
        # Fallback
        if not m_c:
            m_c = next((r for r in ['C1', 'C2', 'C3', 'C4', 'C5', 'C10', 'C17'] if r not in used_meds_global), c_pool[0])
            
        selected_meds.append(m_c); used_meds_global.add(m_c)

        # --- 3. SPECIALTY GROUP SELECTION (Blood/Lymph/A-Group) ---
        m_spec = None
        spec_prefixes = ('A', 'P', 'F', 'L', 'Ven', 'Ver')
        
        # Priority 1: Mandatory Constitutional (L1 for Lymphatic, A2 for Sanguine)
        if idx == 0:
            m_spec = next((r for r in mandates if r.startswith(spec_prefixes) and r not in used_meds_global), None)
            
        # Priority 2: Symptom Match
        if not m_spec:
            for kw, meds in symptom_med_map.items():
                if kw in symptoms_lower:
                    m_spec = next((r for r in meds if r.startswith(spec_prefixes) and r not in used_meds_global), None)
                    if m_spec: break

        # Priority 3: Disease DB
        if not m_spec:
            m_spec = next((r for r in base_meds if r.startswith(spec_prefixes) and r not in used_meds_global), None)
            
        # Priority 4: System Pool
        if not m_spec:
            m_spec = next((r for r in spec_pool if r not in used_meds_global), None)
            
        # Fallback
        if not m_spec:
            m_spec = next((r for r in ['A1', 'A2', 'A3', 'P1', 'F1', 'F2', 'L1', 'Ven1'] if r not in used_meds_global), spec_pool[0])
            
        selected_meds.append(m_spec); used_meds_global.add(m_spec)

        # --- 4. ELECTRICITY SELECTION (Rule 6: Function Driven) ---
        # RE: Function Increase (Low BP/Paralysis)
        # BE: Function Decrease (Bleeding/Swelling/High BP)
        # WE: Nerve/Pain/Tingling
        
        elec = "WE" # Default
        
        if any(k in symptoms_lower for k in ['sunn', 'jhun jhuni', 'tingling', 'nerve', 'dard', 'pain']):
            elec = "WE"
        elif any(k in symptoms_lower for k in ['bleeding', 'bloding', 'khoon', 'sujan', 'swelling', 'jalan', 'burning']):
            elec = "BE"
        elif any(k in symptoms_lower for k in ['paralysis', 'lakwa', 'weakness', 'low bp']):
            elec = "RE"
        elif polarity == "POSITIVE":
            elec = "BE"
        elif polarity == "NEGATIVE":
            elec = "RE"
            
        # Ensure Uniqueness
        if elec in used_meds_global:
            elec = next((r for r in ELECTRICITY_GROUP if r not in used_meds_global), ELECTRICITY_GROUP[0])
        
        used_meds_global.add(elec)

        # Rule 7: Composition S+C+A/Spec+Elec
        formula = " + ".join(selected_meds) + f" + {elec}"
        mixtures.append({
            "label": f"MIXTURE {ALPHA[idx]}", "system": sys_key,
            "formula": f"{formula} — {dilution}", "medicines": selected_meds,
            "electricity": elec, "dilution": dilution, "timing": timings[idx]
        })
    return mixtures

def build_formula(*args, **kwargs):
    """ Legacy wrapper to prevent signature mismatch errors """
    print(f"DEBUG: build_formula (legacy wrapper) called with {len(args)} args")
    return build_formula_dynamic(*args, **kwargs)

def safety_check(polarity: str, dilution: str) -> dict:
    warnings, status = [], "SAFE"
    try:
        n = int(dilution.replace("D",""))
        if polarity=="POSITIVE" and n<=3: status, warnings = "DANGER", ["CRITICAL: POSITIVE disease + D1-D3 = AGGRAVATION."]
        elif polarity=="NEGATIVE" and n>=30: status, warnings = "DANGER", ["CRITICAL: NEGATIVE disease + D30+ = AGGRAVATION."]
    except: pass
    return {"status": status, "warnings": warnings, "antidote": "Lemon-Vinegar antidote: 1 tsp each in warm water."}

def calc_dosage(age, polarity, condition):
    """
    9 EH RULE ENGINE - Rule 5: Dosage (Severity Based)
    Logic:
    - Chronic -> 10-15 drops
    - Acute -> 5 drops frequently
    """
    # 1. Base drops by age
    drops = next((d for (mn,mx),d in DROPS_MAP.items() if mn<=age<=mx), 10)
    
    # 2. Severity adjustment
    if condition.lower() == "acute":
        drops = 5 # Frequent small doses for acute
    elif condition.lower() == "chronic":
        drops = 15 # Larger doses for chronic
        
    freq, gap = FREQ_MAP.get((polarity, condition.lower()), ("3 times daily","Morning+Noon+Night"))
    return {"drops": drops, "frequency": freq, "gap_between": gap, "duration": DURATION_MAP.get(condition.lower(),"3 months")}

def build_diet(polarity, systems):
    base = DIET_BASE.get(polarity, DIET_BASE["MIXED"])
    eat, avoid, seen = list(base["eat"]), list(base["avoid"]), set()
    for sys in systems[:3]:
        for item in SYSTEM_DIET_EXTRA.get(sys,{}).get("eat",[]):
            if item.lower() not in seen: eat.append(item); seen.add(item.lower())
        for item in SYSTEM_DIET_EXTRA.get(sys,{}).get("avoid",[]):
            if item.lower() not in seen: avoid.append(item); seen.add(item.lower())
    return {"eat": eat[:12], "avoid": avoid[:10], "lifestyle": base["lifestyle"]}
