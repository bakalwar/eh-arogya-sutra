"""
╔══════════════════════════════════════════════════════════════╗
║  MEDICINE ENGINE v1.0                                       ║
║  E.H. Arogya Sutra — Engine 4 of 9                         ║
║                                                              ║
║  Book Source: EH Chikitsa Vigyan (Pages 8-9, 12-16)         ║
║                                                              ║
║  POSITIVE MEDICINES (for NEGATIVE rog):                      ║
║    S1-S12, R.E., A1-A3, P1-P4                               ║
║                                                              ║
║  NEGATIVE MEDICINES (for POSITIVE rog):                      ║
║    C8, C15, Ven, Ver, Y.E., G.E.                            ║
║                                                              ║
║  NEUTRAL MEDICINES (for both):                               ║
║    W.E., F1, F2, S-Lass, L1                                 ║
║                                                              ║
║  INPUT:  polarity, prakriti, active_systems, all_medicines   ║
║  OUTPUT: scored medicine pool for Formula Engine             ║
╚══════════════════════════════════════════════════════════════╝
"""

from typing import Optional

# ─────────────────────────────────────────────────────────────
# MEDICINE POLARITY MAP — Book Page 8-9
# ─────────────────────────────────────────────────────────────
MEDICINE_POLARITY = {

    # ── POSITIVE MEDICINES ────────────────────────────────────
    # Book: "S1-S12, R.E., A1-A3, P1-P4"
    # Kab dein: NEGATIVE rog mein (ang ka kaam BADHANA hai)
    # ─────────────────────────────────────────────────────────
    "POSITIVE": {
        "ids": [
            "S1","S2","S3","S5","S6","S10","S11","S12",
            "A1","A2","A3",
            "P1","P2","P3","P4",
        ],
        "electricity": ["R.E."],
        "book_rule":   "Book Page 8: S1-S12, R.E., A-Group, P-Group = Positive medicines",
        "use_when":    "NEGATIVE rog — ang ka kaam badhana hai",
        "avoid_when":  "POSITIVE rog — AGGRAVATION hoga",
    },

    # ── NEGATIVE MEDICINES ────────────────────────────────────
    # Book: "C8, C15, Ven, Ver, YE, GE"
    # Kab dein: POSITIVE rog mein (ang ki adhik kriya GHATANI hai)
    # ─────────────────────────────────────────────────────────
    "NEGATIVE": {
        "ids": [
            "C1","C2","C3","C4","C5","C6","C10","C13","C15","C17",
            "Ver1","Ver2",
            "Ven1",
        ],
        "electricity": ["Y.E.", "G.E."],
        "book_rule":   "Book Page 8-9: C-Group, Ver, Ven, Y.E., G.E. = Negative medicines",
        "use_when":    "POSITIVE rog — ang ki adhik kriya ghatani hai",
        "avoid_when":  "NEGATIVE rog — AGGRAVATION hoga",
    },

    # ── NEUTRAL MEDICINES ─────────────────────────────────────
    # Book Page 9: "WE, F, Sio, L — Udaasin aushadhiyan"
    # Dono prakar mein use ho sakti hain
    # ─────────────────────────────────────────────────────────
    "NEUTRAL": {
        "ids": [
            "L1",
            "F1","F2",
            "S-Lass",
            "APP",
            "SY",
        ],
        "electricity": ["W.E."],
        "book_rule":   "Book Page 9: W.E., F, Sio, L = Neutral/Udaasin medicines",
        "use_when":    "Dono prakar mein — balance karne ke liye",
        "avoid_when":  "Koi restriction nahi",
    },
}

# ─────────────────────────────────────────────────────────────
# PRAKRITI → MEDICINE BOOST — Book Pages 13-16
# ─────────────────────────────────────────────────────────────
PRAKRITI_MEDICINE_BOOST = {
    "KAF": {
        # Book Page 14: "Kaf prakriti ke liye S-Group bahut labhdayak"
        "S1":  8.0, "S2": 6.0, "S3": 5.0, "S6": 5.0,
        "S10": 4.0, "S11":4.0, "S12":4.0,
        "L1":  5.0,
        "reason": "Book P.14: Kaf prakriti → S-Group sabse labhdayak",
    },
    "RAKT": {
        # Book Page 14: "Rakt prakriti ke liye Angiotico sabse labhdayak"
        "A1": 8.0, "A2": 8.0, "A3": 6.0,
        "reason": "Book P.14: Rakt prakriti → A-Group (Angiotico) labhdayak",
    },
    "PITT": {
        # Book Page 15: "Pitt prakriti ke liye S5 adhik gunakari"
        "S5": 10.0, "C5": 5.0,
        "reason": "Book P.15: Pitt prakriti → S5 sabse adhik gunakari",
    },
    "VAAT": {
        # Book Page 15-16: "Vaat prakriti ke liye S1 uchch dilution + F1 + F2"
        "S1": 8.0, "F1": 8.0, "F2": 8.0, "C4": 5.0,
        "reason": "Book P.15: Vaat prakriti → S1 uchch + F1 + F2 labhdayak",
    },
    "MIXED": {
        # Book Page 16: "Mishrit mein L-Group use karein"
        "L1": 8.0, "S1": 3.0,
        "reason": "Book P.16: Mishrit prakriti → L-Group zaroor dein",
    },
}

# ─────────────────────────────────────────────────────────────
# DISEASE SYSTEM → MEDICINE ANATOMY KEYWORDS
# Used for EH Triad scoring
# ─────────────────────────────────────────────────────────────
SYSTEM_ANATOMY_KEYWORDS = {
    "CARDIAC":      ["Arterial","Arteriole","Venous","Capillar","aorta"],
    "RENAL":        ["Renal","Kidney","Nephron","Glomerul","Tubul"],
    "GLANDULAR":    ["Glandular","Lymphatic","Mammary","lymph node"],
    "FEVER":        ["Autonomic","Hypothalamus","thermostat","Fever"],
    "RESPIRATORY":  ["Bronchial","Trachea","Pleura","Respiratory","Mediastinum"],
    "LIVER":        ["Liver","Hepat","Bile","Portal"],
    "GYNE":         ["Pelvic","Uterine","Endometri","Uterus"],
    "GASTRIC":      ["Gastric","Stomach","Digestive Gland","Pancrea"],
    "CONSTIPATION": ["Large Intestine","Colon","Rectal","Sigmoid"],
    "JOINTS":       ["Peripheral Nerve","Sciatic","Brachial"],
    "SKIN":         ["Skin","Dermis","Epithelial","Subcutaneous"],
    "NEURO":        ["Nerve","Spinal","Autonomic","Peripheral","Sciatic"],
    "METABOLIC":    ["Lymphatic Network","Blood","Constitutional"],
    "VENEREAL":     ["Genitourinary","Genital"],
    "DEGENERATIVE": ["Cellular","Connective","Mucosal Tissue"],
    "PARASITIC":    ["Intestinal Lumen","Enteric"],
}

# ─────────────────────────────────────────────────────────────
# ELECTRICITY SELECTION — Book + Previous work
# ─────────────────────────────────────────────────────────────
ELECTRICITY_RULES = {
    # Polarity-based
    "POSITIVE_ROG":  "Y.E.",   # Positive rog → Yellow (Sedative)
    "NEGATIVE_ROG":  "R.E.",   # Negative rog → Red (Stimulant)
    "MIXED_ROG":     "W.E.",   # Mixed → White (Neutral)

    # System-based overrides
    "CARDIAC":       "B.E.",   # Heart/BP → Blue (Anti-edema)
    "RENAL":         "B.E.",   # Kidney swelling → Blue
    "SKIN":          "G.E.",   # Skin toxins → Green (Anti-toxic)
    "PARASITIC":     "G.E.",   # Parasites → Green
    "NEURO":         "R.E.",   # Nerve energy → Red (Stimulant)
    "FEVER":         "W.E.",   # Fever → White (Neutral stabilizer)
    "RESPIRATORY":   "W.E.",   # Respiratory → White

    # Combo rules (multi-disease)
    "GYNE+NEURO":    ["W.E.", "Y.E."],
    "RENAL+CARDIAC": ["B.E.", "W.E."],
    "SKIN+LIVER":    ["G.E.", "Y.E."],
    "NEURO+JOINTS":  ["R.E.", "Y.E."],
    "CARDIAC+NEURO": ["B.E.", "R.E."],
    "GASTRIC+CONSTIPATION": ["Y.E.", "Y.E."],
}

def get_electricity(
    rog_polarity:    str,
    active_systems:  list,
    prakriti:        str = "KAF",
) -> dict:
    """Sahi electricity select karo."""

    elec = ELECTRICITY_RULES.get(f"{rog_polarity}_ROG", "W.E.")

    # System-specific override (first system wins)
    for sys in active_systems[:2]:
        sys_elec = ELECTRICITY_RULES.get(sys)
        if sys_elec and isinstance(sys_elec, str):
            elec = sys_elec
            break

    # Combo check
    if len(active_systems) >= 2:
        key = f"{active_systems[0]}+{active_systems[1]}"
        rkey = f"{active_systems[1]}+{active_systems[0]}"
        combo = ELECTRICITY_RULES.get(key) or ELECTRICITY_RULES.get(rkey)
        if combo:
            return {
                "primary":   combo[0],
                "secondary": combo[1],
                "is_combo":  True,
                "reason":    f"Multi-disease: {key} → combo electricity",
            }

    return {
        "primary":   elec,
        "secondary": None,
        "is_combo":  False,
        "reason":    f"Polarity={rog_polarity}, System={active_systems[0] if active_systems else 'NONE'}",
    }


# ─────────────────────────────────────────────────────────────
# MAIN SCORING FUNCTION — EH Triad + Book Rules
# ─────────────────────────────────────────────────────────────
def score_medicines(
    all_medicines:   dict,
    rog_polarity:    str,
    prakriti:        str,
    active_system:   str,
    symptoms_text:   str,
    is_mishrit:      bool = False,
) -> list:
    """
    Har medicine ko score karo aur ranked list return karo.

    Scoring rules:
    1. Anatomy match (+5.0) — EH Triad
    2. Polarity match (+4.0) — Book Page 8-9
    3. Prakriti boost (+3-10) — Book Page 13-16
    4. Symptom keyword (+1.5 each)
    5. Temperament match (+1.0)

    Returns: Sorted list of medicines with scores
    """
    anatomy_kws = SYSTEM_ANATOMY_KEYWORDS.get(active_system, [])
    keywords = [w for w in symptoms_text.lower().split() if len(w) > 3]
    prakriti_boosts = PRAKRITI_MEDICINE_BOOST.get(prakriti, {})
    if is_mishrit:
        mishrit_boosts = PRAKRITI_MEDICINE_BOOST.get("MIXED", {})
    else:
        mishrit_boosts = {}

    # Determine which polarity medicines to prefer
    if rog_polarity == "POSITIVE":
        preferred_pol = "NEGATIVE"
        avoid_pol     = "POSITIVE"
    elif rog_polarity == "NEGATIVE":
        preferred_pol = "POSITIVE"
        avoid_pol     = "NEGATIVE"
    else:
        preferred_pol = "NEUTRAL"
        avoid_pol     = None

    scored = []
    for mid, med in all_medicines.items():
        score = 0.0
        reasons = []

        # ── Rule 1: Anatomy match (EH Triad) ──────────────────
        anat = (med.get("anatomy_term","") or "").lower()
        for ak in anatomy_kws:
            if ak.lower() in anat:
                score += 5.0
                reasons.append(f"Anatomy+5({ak})")
                break

        # ── Rule 2: Medicine Polarity match (Book Page 8-9) ───
        med_pol = _get_medicine_polarity(mid)
        if med_pol == preferred_pol:
            score += 4.0
            reasons.append(f"Polarity+4({med_pol}={preferred_pol})")
        elif avoid_pol and med_pol == avoid_pol:
            score -= 3.0   # penalize wrong polarity
            reasons.append(f"Polarity-3(WRONG {med_pol})")
        elif med_pol == "NEUTRAL":
            score += 1.5
            reasons.append("Polarity+1.5(Neutral-safe)")

        # ── Rule 3: Prakriti boost (Book Pages 13-16) ─────────
        pb = prakriti_boosts.get(mid, mishrit_boosts.get(mid, 0))
        if pb > 0:
            score += pb
            reasons.append(f"Prakriti+{pb}({prakriti})")

        # ── Rule 4: Symptom keyword match ─────────────────────
        pd = (med.get("pathology_details","") or "").lower()
        pt = (med.get("pathology_term","") or "").lower()
        for kw in keywords:
            if kw in pd or kw in pt:
                score += 1.5
                reasons.append(f"Kw+1.5({kw})")

        # ── Rule 5: Temperament match ──────────────────────────
        mt = (med.get("temperament","") or "").lower()
        prakriti_temp_map = {
            "KAF":  "lymphatic", "RAKT": "sanguine",
            "PITT": "biliary",   "VAAT": "nervous",
        }
        expected_temp = prakriti_temp_map.get(prakriti, "mixed")
        if expected_temp in mt or "mixed" in mt:
            score += 1.0
            reasons.append(f"Temp+1({expected_temp})")

        if score > 0:
            scored.append({
                **med,
                "_score":    round(score, 2),
                "_reasons":  reasons[:5],
                "_polarity": med_pol,
            })

    scored.sort(key=lambda x: x["_score"], reverse=True)
    return scored


def _get_medicine_polarity(mid: str) -> str:
    """Medicine ki polarity kya hai."""
    for pol, pdata in MEDICINE_POLARITY.items():
        if mid in pdata["ids"]:
            return pol
    # Default by group
    if mid.startswith("S") or mid.startswith("A") or mid.startswith("P"):
        return "POSITIVE"
    if mid.startswith("C") or mid.startswith("Ver") or mid.startswith("Ven"):
        return "NEGATIVE"
    return "NEUTRAL"


# ─────────────────────────────────────────────────────────────
# EH TRIAD BUILDER — Uses scored medicines
# ─────────────────────────────────────────────────────────────
def build_eh_triad(
    scored_medicines: list,
    rog_polarity:     str,
    prakriti:         str,
    electricity:      str,
    potency:          str,
    is_mishrit:       bool = False,
) -> dict:
    """
    EH Triad Law se formula banao:
    S-Group (Function) + C-Group (Structure) + Drainage (A/L/F/P)
    + L1 if Lymphatic/Mishrit

    Book ke hisaab se:
    POSITIVE rog → C-Group preferred (Negative medicines)
    NEGATIVE rog → S-Group preferred (Positive medicines)
    """

    parts = []
    selected = set()

    def fmt_id(m):
        mid = m["id"]
        if mid in ("S-Lass","APP","SY"): return mid
        if mid.startswith("Ver"):  return "Ver-" + mid[3:]
        if mid.startswith("Ven"):  return "Ven-" + mid[3:]
        grp = (m.get("medicine_group","") or "").split("-")[0]
        num = "".join(c for c in mid if c.isdigit())
        return f"{grp}-{num}" if num else mid

    # ── A: Best S-Group (Functional) ──────────────────────────
    best_s = next(
        (m for m in scored_medicines
         if (m.get("medicine_group","") or "").startswith("S")
         and m["id"] not in selected),
        None
    )
    if best_s:
        parts.append(best_s)
        selected.add(best_s["id"])

    # ── B: Best C-Group (Structural) ──────────────────────────
    best_c = next(
        (m for m in scored_medicines
         if (m.get("medicine_group","") or "").startswith("C")
         and m["id"] not in selected),
        None
    )
    if best_c:
        parts.append(best_c)
        selected.add(best_c["id"])

    # ── C: Best Drainage (A/L/F/P/Ver/Ven) ────────────────────
    drain_groups = ["A-Group","L-Group","F-Group","P-Group","Ver-Group","Ven-Group"]
    best_d = next(
        (m for m in scored_medicines
         if (m.get("medicine_group","") or "") in drain_groups
         and m["id"] not in selected),
        None
    )
    if best_d:
        parts.append(best_d)
        selected.add(best_d["id"])

    # ── D: L1 if Lymphatic / Mishrit ──────────────────────────
    if (prakriti in ("KAF","MIXED") or is_mishrit) and "L1" not in selected:
        # Find L1 in scored or add from anywhere
        l1 = next((m for m in scored_medicines if m["id"] == "L1"), None)
        if l1:
            parts.append(l1)
            selected.add("L1")

    # ── Build formula string ───────────────────────────────────
    med_parts = [fmt_id(m) for m in parts]
    formula_str = " + ".join(med_parts) + f" + {electricity}"
    full_formula = formula_str + f" — {potency}"

    # ── Score log for transparency ─────────────────────────────
    score_log = [
        {
            "id":      m["id"],
            "name":    m.get("name",""),
            "score":   m["_score"],
            "reasons": m.get("_reasons",[]),
            "polarity":m.get("_polarity",""),
        }
        for m in scored_medicines[:6]
    ]

    return {
        "formula":     formula_str,
        "full":        full_formula,
        "dilution":    potency,
        "electricity": electricity,
        "med_parts":   med_parts,
        "medicines":   parts,
        "score_log":   score_log,
    }


# ─────────────────────────────────────────────────────────────
# MAIN ENGINE FUNCTION
# ─────────────────────────────────────────────────────────────
def get_medicine_pool(
    all_medicines:   dict,
    rog_polarity:    str,
    prakriti:        str,
    active_systems:  list,
    symptoms_text:   str,
    potency:         str,
    is_mishrit:      bool = False,
) -> dict:
    """
    Har active disease system ke liye medicine pool aur formula banao.

    Returns:
    {
        "mixtures": [
            {
                "label":     "MIXTURE A",
                "system":    "RENAL",
                "formula_obj": {...},
                "electricity": "B.E.",
            },
            ...
        ],
        "electricity": {...},
        "book_rule":   "...",
    }
    """
    elec_result = get_electricity(rog_polarity, active_systems, prakriti)
    ALPHA = ["A","B","C","D","E","F","G","H"]
    mixtures = []

    for idx, sys_key in enumerate(active_systems):
        # Score medicines for this system
        scored = score_medicines(
            all_medicines  = all_medicines,
            rog_polarity   = rog_polarity,
            prakriti       = prakriti,
            active_system  = sys_key,
            symptoms_text  = symptoms_text,
            is_mishrit     = is_mishrit,
        )

        # Pick electricity
        if elec_result["is_combo"] and idx == 0:
            elec = elec_result["primary"]
        elif elec_result["is_combo"] and idx == 1:
            elec = elec_result["secondary"]
        else:
            elec = elec_result["primary"]

        # Build EH Triad formula
        formula_obj = build_eh_triad(
            scored_medicines = scored,
            rog_polarity     = rog_polarity,
            prakriti         = prakriti,
            electricity      = elec,
            potency          = potency,
            is_mishrit       = is_mishrit,
        )

        mixtures.append({
            "label":       f"MIXTURE {ALPHA[idx]}",
            "system_key":  sys_key,
            "formula_obj": formula_obj,
            "electricity": elec,
        })

    # Book rule summary
    pol_info = MEDICINE_POLARITY.get(
        "NEGATIVE" if rog_polarity == "POSITIVE" else "POSITIVE",
        MEDICINE_POLARITY["NEUTRAL"]
    )

    return {
        "mixtures":      mixtures,
        "electricity":   elec_result,
        "book_rule":     pol_info["book_rule"],
        "use_when":      pol_info["use_when"],
        "avoid_when":    pol_info["avoid_when"],
    }


# ─────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":

    # Sample medicine DB (minimal)
    SAMPLE_DB = {
        "S1":  {"id":"S1",  "name":"Scrofoloso 1",  "medicine_group":"S-Group",
                "temperament":"Lymphatic/Mixed",
                "anatomy_term":"General Lymphatic Network",
                "pathology_term":"General Debility / Anemia",
                "pathology_details":"lymphatic weakness anemia debility",
                "description":"Master lymph purifier"},
        "S6":  {"id":"S6",  "name":"Scrofoloso 6",  "medicine_group":"S-Group",
                "temperament":"Lymphatic",
                "anatomy_term":"Renal Parenchyma Glomeruli Tubules",
                "pathology_term":"Oliguria Renal Edema",
                "pathology_details":"kidney renal edema sujan oliguria filtration",
                "description":"Stimulates glomerular filtration"},
        "C6":  {"id":"C6",  "name":"Canceroso 6",   "medicine_group":"C-Group",
                "temperament":"Lymphatic",
                "anatomy_term":"Renal Interstitium Ureter",
                "pathology_term":"Chronic Nephritis Urinary",
                "pathology_details":"nephritis kidney inflammation ureter",
                "description":"Anti-inflammatory on kidney"},
        "A1":  {"id":"A1",  "name":"Angioitico 1",  "medicine_group":"A-Group",
                "temperament":"Sanguine/Mixed",
                "anatomy_term":"Arterial Walls Aorta Large Arteries",
                "pathology_term":"Arterial Stiffness High BP",
                "pathology_details":"atherosclerosis BP high arterial stiffness",
                "description":"Arterial wall elasticity"},
        "A2":  {"id":"A2",  "name":"Angioitico 2",  "medicine_group":"A-Group",
                "temperament":"Sanguine/Mixed",
                "anatomy_term":"Arterioles Microcirculation Capillaries",
                "pathology_term":"Blood Pressure Imbalance",
                "pathology_details":"arteriolar tone BP capillary",
                "description":"BP normalization"},
        "A3":  {"id":"A3",  "name":"Angioitico 3",  "medicine_group":"A-Group",
                "temperament":"Sanguine/Mixed",
                "anatomy_term":"Venous Circulation Venous Valves",
                "pathology_term":"Varicose Veins Venous Insufficiency",
                "pathology_details":"venous return varicose veins edema",
                "description":"Venous return improver"},
        "F1":  {"id":"F1",  "name":"Febrifugo 1",   "medicine_group":"F-Group",
                "temperament":"Mixed",
                "anatomy_term":"Autonomic Nervous System Hypothalamus",
                "pathology_term":"Fever Backache Autonomic Nerve Pain",
                "pathology_details":"fever pyrexia backache nerve pain",
                "description":"Anti-fever nerve pain"},
        "F2":  {"id":"F2",  "name":"Febrifugo 2",   "medicine_group":"F-Group",
                "temperament":"Mixed",
                "anatomy_term":"Peripheral Nerve Pathways Sciatic Brachial",
                "pathology_term":"Neuralgia Sciatica Shooting Pain",
                "pathology_details":"sciatica neuralgia nerve pain tingling",
                "description":"Peripheral neuralgia relief"},
        "L1":  {"id":"L1",  "name":"Linfatico 1",   "medicine_group":"L-Group",
                "temperament":"Lymphatic",
                "anatomy_term":"Systemic Lymph Vessels Lymph Nodes",
                "pathology_term":"Lymph Stasis Diffuse Edema",
                "pathology_details":"lymph stasis edema lymphadenopathy",
                "description":"Systemic lymph drainer"},
        "C4":  {"id":"C4",  "name":"Canceroso 4",   "medicine_group":"C-Group",
                "temperament":"Nervous/Mixed",
                "anatomy_term":"Spinal Cord Brain Tissue",
                "pathology_term":"CNS Disorders Convulsions",
                "pathology_details":"CNS spinal nerve convulsion cognitive",
                "description":"CNS structural integrity"},
        "S5":  {"id":"S5",  "name":"Scrofoloso 5",  "medicine_group":"S-Group",
                "temperament":"Biliary/Mixed",
                "anatomy_term":"Liver Hepatocytes Bile Ducts",
                "pathology_term":"Jaundice Hepatic Stasis",
                "pathology_details":"liver hepatic jaundice bile stasis",
                "description":"Hepatocyte function stimulator"},
    }

    print("=" * 65)
    print("MEDICINE ENGINE v1.0 — TEST RESULTS")
    print("=" * 65)

    # Test 1: POSITIVE rog (sujan + BP) → C-Group preferred
    print("\n[TEST 1] POSITIVE rog — RENAL + CARDIAC (Kaf prakriti)")
    result1 = get_medicine_pool(
        all_medicines  = SAMPLE_DB,
        rog_polarity   = "POSITIVE",
        prakriti       = "KAF",
        active_systems = ["RENAL","CARDIAC"],
        symptoms_text  = "sujan hai BP high hai tej dhadkan",
        potency        = "D10",
    )
    for mix in result1["mixtures"]:
        fo = mix["formula_obj"]
        print(f"  ✅ {mix['label']} [{mix['system_key']}]: {fo['full']}")
        for s in fo["score_log"][:3]:
            print(f"     Score {s['score']:5.1f} — {s['id']} ({s['polarity']}) {s['reasons'][:2]}")

    # Test 2: NEGATIVE rog (kamzori) → S-Group preferred
    print("\n[TEST 2] NEGATIVE rog — METABOLIC (Vaat prakriti)")
    result2 = get_medicine_pool(
        all_medicines  = SAMPLE_DB,
        rog_polarity   = "NEGATIVE",
        prakriti       = "VAAT",
        active_systems = ["NEURO"],
        symptoms_text  = "kamar dard jhunjhuni kamzori",
        potency        = "D2",
    )
    for mix in result2["mixtures"]:
        fo = mix["formula_obj"]
        print(f"  ✅ {mix['label']} [{mix['system_key']}]: {fo['full']}")

    # Test 3: Electricity selection
    print("\n[TEST 3] Electricity Rules")
    elec_tests = [
        (["CARDIAC"],          "POSITIVE", "B.E."),
        (["SKIN"],             "POSITIVE", "G.E."),
        (["NEURO"],            "NEGATIVE", "R.E."),
        (["RENAL","CARDIAC"],  "POSITIVE", "B.E."),
        (["GYNE","NEURO"],     "MIXED",    "W.E."),
    ]
    for systems, pol, expected in elec_tests:
        e = get_electricity(pol, systems)
        got = e["primary"]
        ok = got == expected
        print(f"  {'✅' if ok else '❌'} {systems} + {pol} → {got} (expected {expected})")

    # Test 4: Medicine polarity check
    print("\n[TEST 4] Medicine Polarity Classification")
    pol_tests = [
        ("S1",   "POSITIVE"),
        ("A2",   "POSITIVE"),
        ("C4",   "NEGATIVE"),
        ("Ver1", "NEGATIVE"),
        ("L1",   "NEUTRAL"),
        ("F1",   "NEUTRAL"),
    ]
    for mid, expected_pol in pol_tests:
        got = _get_medicine_polarity(mid)
        ok = got == expected_pol
        print(f"  {'✅' if ok else '❌'} {mid} → {got} (expected {expected_pol})")

    print(f"\n{'='*65}")
    print("MEDICINE ENGINE v1.0 — ALL TESTS COMPLETE")
    print(f"{'='*65}")
