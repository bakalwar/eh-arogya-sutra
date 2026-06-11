"""
REPORT RULES ENGINE — EH Arogya Sutra
Lab values → Normal/Abnormal → EH System → Medicine mapping
100% Deterministic — No AI needed
"""
from typing import Optional

# ═══════════════════════════════════════════════════════
# LAB PARAMETER RANGES + EH MAPPING
# ═══════════════════════════════════════════════════════
LAB_RANGES = {
    # ─── BLOOD TEST ─────────────────────────────────────
    "hemoglobin": {
        "unit": "gm/dL",
        "normal": {
            "Male":   (13.0, 17.0),
            "Female": (12.0, 15.0),
            "Child":  (11.0, 16.0),
            "default":(12.0, 17.0)
        },
        "low_eh":  {"systems":["METABOLIC"],"meds":"A3,S1,L1","polarity":"NEGATIVE",
                    "note":"Low HB = Anemia = NEGATIVE rog. Stimulant medicines needed."},
        "high_eh": {"systems":["CARDIAC"],"meds":"A2,A3,L1","polarity":"POSITIVE",
                    "note":"High HB = Blood thickening = POSITIVE rog."},
    },
    "wbc": {
        "unit": "cells/mcL",
        "normal": {"default": (4000, 11000)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"S1,A3,L1","polarity":"NEGATIVE",
                    "note":"Low WBC = Weak immunity = Lymphatic stimulation needed."},
        "high_eh": {"systems":["FEVER"],"meds":"F1,S1,L1","polarity":"POSITIVE",
                    "note":"High WBC = Active infection = Anti-inflammatory formula."},
    },
    "platelet": {
        "unit": "cells/mcL",
        "normal": {"default": (150000, 450000)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"A3,S1,C1,L1","polarity":"NEGATIVE",
                    "note":"Low platelets = NEGATIVE = Glandular + blood stimulation."},
        "high_eh": {"systems":["CARDIAC"],"meds":"A2,L1","polarity":"POSITIVE",
                    "note":"High platelets = Clotting risk = Venous sedation needed."},
    },
    "mcv": {
        "unit": "fL",
        "normal": {"default": (80.0, 100.0)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"A3,S1,L1","polarity":"NEGATIVE",
                    "note":"Low MCV = Microcytic anemia = Iron deficiency possible."},
        "high_eh": {"systems":["METABOLIC"],"meds":"S1,A3","polarity":"NEGATIVE",
                    "note":"High MCV = Macrocytic anemia = B12/Folate deficiency."},
    },
    "esr": {
        "unit": "mm/hr",
        "normal": {"Male":(0,15),"Female":(0,20),"default":(0,20)},
        "low_eh":  None,
        "high_eh": {"systems":["FEVER","JOINTS"],"meds":"F1,A3,L1","polarity":"POSITIVE",
                    "note":"High ESR = Active inflammation = Anti-inflammatory formula."},
    },

    # ─── KFT ────────────────────────────────────────────
    "creatinine": {
        "unit": "mg/dL",
        "normal": {"Male":(0.7,1.3),"Female":(0.5,1.1),"default":(0.6,1.2)},
        "low_eh":  None,
        "high_eh": {"systems":["RENAL"],"meds":"S6,C6,L1","polarity":"POSITIVE",
                    "note":"High Creatinine = Kidney dysfunction = Renal formula."},
    },
    "uric_acid": {
        "unit": "mg/dL",
        "normal": {"Male":(3.5,7.0),"Female":(2.5,6.0),"default":(3.5,7.0)},
        "low_eh":  None,
        "high_eh": {"systems":["JOINTS","RENAL"],"meds":"S6,A3,C4,L1","polarity":"POSITIVE",
                    "note":"High Uric Acid = Gout risk = Renal + Joint formula. Urad dal band."},
    },
    "urea": {
        "unit": "mg/dL",
        "normal": {"default": (7.0, 20.0)},
        "low_eh":  None,
        "high_eh": {"systems":["RENAL"],"meds":"S6,C6,L1","polarity":"POSITIVE",
                    "note":"High Urea = Kidney dysfunction = Renal drainage needed."},
    },
    "gfr": {
        "unit": "mL/min",
        "normal": {"default": (60.0, 120.0)},
        "low_eh":  {"systems":["RENAL"],"meds":"S6,C6,L1","polarity":"NEGATIVE",
                    "note":"Low GFR = Reduced filtration = Kidney stimulation urgently needed."},
        "high_eh": None,
    },
    "sodium": {
        "unit": "mEq/L",
        "normal": {"default": (135.0, 145.0)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"S1,A3","polarity":"NEGATIVE",
                    "note":"Low Sodium = Hyponatremia = Constitutional weakness."},
        "high_eh": {"systems":["RENAL","CARDIAC"],"meds":"S6,A2,L1","polarity":"POSITIVE",
                    "note":"High Sodium = Hypernatremia = Renal + Cardiac formula."},
    },
    "potassium": {
        "unit": "mEq/L",
        "normal": {"default": (3.5, 5.0)},
        "low_eh":  {"systems":["CARDIAC","METABOLIC"],"meds":"A1,A3,S1","polarity":"NEGATIVE",
                    "note":"Low Potassium = Heart weakness risk = Cardiac stimulation."},
        "high_eh": {"systems":["RENAL"],"meds":"S6,C6,L1","polarity":"POSITIVE",
                    "note":"High Potassium = Hyperkalemia = Renal drainage needed."},
    },

    # ─── LFT ────────────────────────────────────────────
    "sgpt": {
        "unit": "U/L",
        "normal": {"default": (7.0, 40.0)},
        "low_eh":  None,
        "high_eh": {"systems":["LIVER"],"meds":"S5,C5,L1","polarity":"POSITIVE",
                    "note":"High SGPT = Liver cell damage = Hepatic formula urgently."},
    },
    "sgot": {
        "unit": "U/L",
        "normal": {"default": (10.0, 40.0)},
        "low_eh":  None,
        "high_eh": {"systems":["LIVER"],"meds":"S5,C5,L1","polarity":"POSITIVE",
                    "note":"High SGOT = Liver/Heart/Muscle damage = Hepatic formula."},
    },
    "bilirubin": {
        "unit": "mg/dL",
        "normal": {"default": (0.2, 1.2)},
        "low_eh":  None,
        "high_eh": {"systems":["LIVER"],"meds":"S5,C5,L1","polarity":"POSITIVE",
                    "note":"High Bilirubin = Jaundice = Hepatic drainage formula."},
    },
    "albumin": {
        "unit": "g/dL",
        "normal": {"default": (3.5, 5.0)},
        "low_eh":  {"systems":["LIVER","METABOLIC"],"meds":"S5,S1,A3","polarity":"NEGATIVE",
                    "note":"Low Albumin = Liver weakness/malnutrition = Tonic formula."},
        "high_eh": None,
    },
    "alp": {
        "unit": "U/L",
        "normal": {"default": (44.0, 147.0)},
        "low_eh":  None,
        "high_eh": {"systems":["LIVER","JOINTS"],"meds":"S5,C5,C4,L1","polarity":"POSITIVE",
                    "note":"High ALP = Liver/Bone disease = Combined formula."},
    },

    # ─── LIPID ──────────────────────────────────────────
    "cholesterol": {
        "unit": "mg/dL",
        "normal": {"default": (0, 200.0)},
        "low_eh":  None,
        "high_eh": {"systems":["CARDIAC","LIVER"],"meds":"A2,S5,A3,L1","polarity":"POSITIVE",
                    "note":"High Cholesterol = Arterial risk = Cardiac + Liver formula."},
    },
    "ldl": {
        "unit": "mg/dL",
        "normal": {"default": (0, 130.0)},
        "low_eh":  None,
        "high_eh": {"systems":["CARDIAC"],"meds":"A2,A1,A3,L1","polarity":"POSITIVE",
                    "note":"High LDL = Atherosclerosis risk = Arterial formula."},
    },
    "hdl": {
        "unit": "mg/dL",
        "normal": {"Male":(40,99),"Female":(50,99),"default":(40,99)},
        "low_eh":  {"systems":["CARDIAC","LIVER"],"meds":"A3,S5,L1","polarity":"NEGATIVE",
                    "note":"Low HDL = Bad cholesterol ratio = Metabolic + liver support."},
        "high_eh": None,
    },
    "triglycerides": {
        "unit": "mg/dL",
        "normal": {"default": (0, 150.0)},
        "low_eh":  None,
        "high_eh": {"systems":["LIVER","METABOLIC"],"meds":"S5,S1,A3","polarity":"POSITIVE",
                    "note":"High Triglycerides = Fatty liver risk = Hepatic formula."},
    },

    # ─── DIABETES ───────────────────────────────────────
    "sugar_fasting": {
        "unit": "mg/dL",
        "normal": {"default": (70.0, 100.0)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"S1,A1,A3","polarity":"NEGATIVE",
                    "note":"Low Blood Sugar = Hypoglycemia = Emergency stimulant."},
        "high_eh": {"systems":["METABOLIC","RENAL"],"meds":"S5,S6,C6,L1","polarity":"POSITIVE",
                    "note":"High Fasting Sugar = Diabetes = Metabolic + Renal formula."},
    },
    "sugar_pp": {
        "unit": "mg/dL",
        "normal": {"default": (70.0, 140.0)},
        "low_eh":  None,
        "high_eh": {"systems":["METABOLIC"],"meds":"S5,S1,A3,L1","polarity":"POSITIVE",
                    "note":"High PP Sugar = Glucose intolerance = Metabolic formula."},
    },
    "hba1c": {
        "unit": "%",
        "normal": {"default": (0, 5.7)},
        "low_eh":  None,
        "high_eh": {"systems":["METABOLIC","RENAL"],"meds":"S5,S6,C6,L1","polarity":"POSITIVE",
                    "note":"High HbA1c = Uncontrolled Diabetes = Long-term metabolic formula."},
    },

    # ─── THYROID ────────────────────────────────────────
    "tsh": {
        "unit": "mIU/L",
        "normal": {"default": (0.5, 5.0)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"S1,A3,C1","polarity":"NEGATIVE",
                    "note":"Low TSH = Hyperthyroidism = Glandular sedation needed."},
        "high_eh": {"systems":["METABOLIC"],"meds":"S1,A3,C1,L1","polarity":"NEGATIVE",
                    "note":"High TSH = Hypothyroidism = Glandular + constitutional stimulation."},
    },

    # ─── VITAMINS ───────────────────────────────────────
    "vitamin_d": {
        "unit": "ng/mL",
        "normal": {"default": (30.0, 100.0)},
        "low_eh":  {"systems":["METABOLIC","JOINTS"],"meds":"C4,S1,A3,L1","polarity":"NEGATIVE",
                    "note":"Low Vitamin D = Bone + immunity weakness = Bone + tonic formula."},
        "high_eh": None,
    },
    "vitamin_b12": {
        "unit": "pg/mL",
        "normal": {"default": (200.0, 900.0)},
        "low_eh":  {"systems":["METABOLIC","NEURO"],"meds":"F1,S1,A3,L1","polarity":"NEGATIVE",
                    "note":"Low B12 = Nerve weakness + anemia = Nerve + blood formula."},
        "high_eh": None,
    },
    "ferritin": {
        "unit": "ng/mL",
        "normal": {"Male":(12,300),"Female":(12,150),"default":(12,300)},
        "low_eh":  {"systems":["METABOLIC"],"meds":"A3,S1,L1","polarity":"NEGATIVE",
                    "note":"Low Ferritin = Iron deficiency = Anemia formula urgently."},
        "high_eh": {"systems":["LIVER"],"meds":"S5,C5,L1","polarity":"POSITIVE",
                    "note":"High Ferritin = Liver damage/inflammation = Hepatic formula."},
    },
}

# ═══════════════════════════════════════════════════════
# FINDINGS → EH MAPPING (Sonography/MRI/X-Ray)
# ═══════════════════════════════════════════════════════
FINDING_EH_MAP = {
    "fatty_liver":       {"systems":["LIVER"],        "meds":"S5,C5,L1",     "polarity":"POSITIVE"},
    "liver_enlarged":    {"systems":["LIVER"],        "meds":"S5,C5,L1",     "polarity":"POSITIVE"},
    "cirrhosis":         {"systems":["LIVER"],        "meds":"S5,C5,L1",     "polarity":"POSITIVE"},
    "liver_lesion":      {"systems":["LIVER","GLANDULAR"],"meds":"S5,C5,C1,L1","polarity":"POSITIVE"},
    "gallstones":        {"systems":["LIVER"],        "meds":"S2,C5,L1",     "polarity":"POSITIVE"},
    "kidney_stone":      {"systems":["RENAL"],        "meds":"S6,C6,L1",     "polarity":"POSITIVE"},
    "hydronephrosis":    {"systems":["RENAL"],        "meds":"S6,C6,L1",     "polarity":"POSITIVE"},
    "kidney_cyst":       {"systems":["RENAL"],        "meds":"S6,C6,L1",     "polarity":"POSITIVE"},
    "fibroid":           {"systems":["GYNE"],         "meds":"C1,C2,L1",     "polarity":"NEGATIVE"},
    "ovarian_cyst":      {"systems":["GYNE"],         "meds":"C1,Ven1,L1",   "polarity":"NEGATIVE"},
    "bulky_uterus":      {"systems":["GYNE"],         "meds":"C1,Ven1,S2,L1","polarity":"NEGATIVE"},
    "disc_herniation":   {"systems":["NEURO"],        "meds":"S5,C4,F1,F2",  "polarity":"POSITIVE"},
    "disc_bulge":        {"systems":["NEURO"],        "meds":"S5,C4,F1",     "polarity":"POSITIVE"},
    "nerve_compression": {"systems":["NEURO"],        "meds":"F2,F1,C4,L1",  "polarity":"POSITIVE"},
    "bone_spur":         {"systems":["JOINTS"],       "meds":"C4,A3,S5",     "polarity":"POSITIVE",
                          "special":"C4-200"},
    "spondylosis":       {"systems":["NEURO"],        "meds":"A3,S5,C4,F1",  "polarity":"POSITIVE"},
    "cardiomegaly":      {"systems":["CARDIAC"],      "meds":"A1,A2,A3,L1",  "polarity":"POSITIVE"},
    "pleural_effusion":  {"systems":["RESPIRATORY","CARDIAC"],"meds":"P1,A2,L1","polarity":"POSITIVE"},
    "pneumonia":         {"systems":["RESPIRATORY"],  "meds":"P4,P1,F1,L1",  "polarity":"POSITIVE"},
    "prostate_enlarged": {"systems":["RENAL"],        "meds":"S2,C1,Ven1,L1","polarity":"POSITIVE"},
}


# ═══════════════════════════════════════════════════════
# CLASSIFICATION ENGINE
# ═══════════════════════════════════════════════════════
def classify_lab_values(
    lab_values: dict,
    gender: str = "Male",
    age: int    = 40
) -> list:
    """
    Lab values → Normal/Abnormal classification
    + EH system mapping
    Returns list of findings
    """
    gender_key = "Child" if age < 14 else gender
    findings   = []

    for param, value in lab_values.items():
        if param not in LAB_RANGES:
            continue
        rule = LAB_RANGES[param]

        # Get normal range
        norms = rule["normal"]
        rang  = norms.get(gender_key) or norms.get("default", (0, 999))
        low, high = rang

        if value < low:
            status   = "LOW"
            badge    = "ABNORMAL"
            eh_info  = rule.get("low_eh") or {}
            deviation = round(((low - value) / low) * 100, 1) if low > 0 else 0
        elif value > high:
            status   = "HIGH"
            badge    = "ABNORMAL"
            eh_info  = rule.get("high_eh") or {}
            deviation = round(((value - high) / high) * 100, 1) if high > 0 else 0
        else:
            status    = "NORMAL"
            badge     = "NORMAL"
            eh_info   = {}
            deviation = 0

        finding = {
            "parameter": param.replace("_", " ").title(),
            "value":     value,
            "unit":      rule["unit"],
            "status":    status,
            "badge":     badge,
            "normal_range": f"{low} - {high} {rule['unit']}",
            "deviation_pct": deviation,
        }

        if badge == "ABNORMAL" and eh_info:
            finding["eh_systems"]  = eh_info.get("systems", [])
            finding["eh_medicines"]= eh_info.get("meds", "")
            finding["eh_polarity"] = eh_info.get("polarity", "MIXED")
            finding["eh_note"]     = eh_info.get("note", "")
            finding["special"]     = eh_info.get("special", "")

        findings.append(finding)

    return findings


def classify_imaging_findings(findings_list: list) -> list:
    """
    Sonography/MRI/X-Ray findings → EH mapping
    """
    classified = []
    for finding_key in findings_list:
        if finding_key not in FINDING_EH_MAP:
            continue
        eh = FINDING_EH_MAP[finding_key]
        classified.append({
            "finding":      finding_key.replace("_", " ").title(),
            "badge":        "DETECTED",
            "eh_systems":   eh["systems"],
            "eh_medicines": eh["meds"],
            "eh_polarity":  eh["polarity"],
            "special":      eh.get("special", ""),
        })
    return classified


def get_combined_systems_and_medicines(
    lab_findings:    list,
    imaging_findings: list
) -> dict:
    """
    All findings se combined EH systems + medicines nikalo
    """
    systems   = []
    medicines = []
    polarity_votes = {"POSITIVE": 0, "NEGATIVE": 0, "MIXED": 0}

    for f in lab_findings + imaging_findings:
        if f.get("badge") in ("ABNORMAL","DETECTED"):
            for sys in f.get("eh_systems", []):
                if sys not in systems:
                    systems.append(sys)
            for med in f.get("eh_medicines", "").split(","):
                med = med.strip()
                if med and med not in medicines:
                    medicines.append(med)
            pol = f.get("eh_polarity", "MIXED")
            polarity_votes[pol] = polarity_votes.get(pol, 0) + 1

    # Determine dominant polarity
    polarity = max(polarity_votes, key=polarity_votes.get)

    # Collect special potencies
    specials = [f.get("special","") for f in
                lab_findings + imaging_findings if f.get("special","")]

    return {
        "active_systems":  systems[:4],
        "suggested_meds":  medicines[:12],
        "dominant_polarity": polarity,
        "special_potencies": [s for s in specials if s],
        "total_abnormal":  sum(1 for f in lab_findings
                              if f.get("badge")=="ABNORMAL") +
                           sum(1 for f in imaging_findings
                              if f.get("badge")=="DETECTED"),
    }


if __name__ == "__main__":
    # Test
    test_labs = {
        "hemoglobin":   11.6,
        "wbc":         6130.0,
        "creatinine":   1.8,
        "uric_acid":    8.5,
        "sgpt":         65.0,
        "sugar_fasting":185.0,
    }
    findings = classify_lab_values(test_labs, "Male", 45)
    print("Lab Findings:")
    for f in findings:
        badge = f["badge"]
        print(f"  {f['parameter']}: {f['value']} {f['unit']} [{badge}]", end="")
        if badge == "ABNORMAL":
            print(f" → EH: {f.get('eh_systems',[])} | {f.get('eh_note','')[:60]}")
        else:
            print()

    combined = get_combined_systems_and_medicines(findings, [])
    print(f"\nCombined: systems={combined['active_systems']}")
    print(f"Polarity: {combined['dominant_polarity']}")
