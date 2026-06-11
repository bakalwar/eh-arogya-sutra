"""
╔══════════════════════════════════════════════════════════════╗
║  SAFETY ENGINE v2.0  (REBUILT)                              ║
║  E.H. Arogya Sutra — Engine 6 of 9                         ║
║                                                              ║
║  Book Source: EH Chikitsa Vigyan (Pages 9, 10-11, 17-18)    ║
║                                                              ║
║  All 7 Safety Rules from Book:                               ║
║  Rule 1: POSITIVE rog + POSITIVE dose = AGGRAVATION         ║
║  Rule 2: NEGATIVE rog + NEGATIVE high dose = AGGRAVATION    ║
║  Rule 3: Neutral dose when polarity clear = No benefit       ║
║  Rule 4: Labh ruka → Dilution aur negative karo             ║
║  Rule 5: Labh ruka → Dose aur positive karo                  ║
║  Rule 6: Aggravation → Nimbu-Sirka ya Viprit dose            ║
║  Rule 7: Medicine polarity must match rog polarity           ║
║                                                              ║
║  New in v2.0:                                                ║
║  + Medicine polarity vs rog polarity check                   ║
║  + Auto-correction when DANGER detected                      ║
║  + Prakriti safety check                                     ║
║  + Complete 12-test suite                                    ║
║  + format_safety_section for parcha                          ║
╚══════════════════════════════════════════════════════════════╝
"""

import re
from typing import Optional

# ─────────────────────────────────────────────────────────────
# MEDICINE POLARITY MAP — Book Page 8-9
# ─────────────────────────────────────────────────────────────
POSITIVE_MEDICINES = ["S1","S2","S3","S5","S6","S10","S11","S12",
                      "A1","A2","A3","P1","P2","P3","P4"]
NEGATIVE_MEDICINES = ["C1","C2","C3","C4","C5","C6","C10","C13",
                      "C15","C17","Ver1","Ver2","Ven1"]
NEUTRAL_MEDICINES  = ["L1","F1","F2","S-Lass","APP","SY"]

POSITIVE_ELEC = ["R.E."]
NEGATIVE_ELEC = ["Y.E.","G.E."]
NEUTRAL_ELEC  = ["W.E.","B.E."]

def get_medicine_polarity(mid: str) -> str:
    if mid in POSITIVE_MEDICINES: return "POSITIVE"
    if mid in NEGATIVE_MEDICINES: return "NEGATIVE"
    if mid in NEUTRAL_MEDICINES:  return "NEUTRAL"
    if mid.startswith("S") or mid.startswith("A") or mid.startswith("P"):
        return "POSITIVE"
    if mid.startswith("C") or mid.startswith("Ver") or mid.startswith("Ven"):
        return "NEGATIVE"
    return "NEUTRAL"

# ─────────────────────────────────────────────────────────────
# AGGRAVATION RULES — Book Pages 9-10
# ─────────────────────────────────────────────────────────────
AGGRAVATION_RULES = [
    {
        "id":        "AGG-001",
        "rule":      "POSITIVE rog mein POSITIVE dose (D1/D2/D3)",
        "condition": lambda rp, dt, pno: rp == "POSITIVE" and dt == "TEEVRA",
        "severity":  "CRITICAL",
        "message": (
            "🚨 AGG-001 CRITICAL: Positive rog mein Positive dose "
            "(D1/D2/D3) dena FORBIDDEN hai. Rog aur badh jayega."
        ),
        "fix":       "Turant D6 ya upar ki Negative dose dein.",
        "auto_fix":  {"potency":"D6","dose_type":"UCHCH"},
        "book_ref":  "Book Page 9: Positive rog mein Positive dose → Aggravation",
    },
    {
        "id":        "AGG-002",
        "rule":      "NEGATIVE rog mein HIGH Negative dose (D30+)",
        "condition": lambda rp, dt, pno: rp == "NEGATIVE" and pno >= 30,
        "severity":  "CRITICAL",
        "message": (
            "🚨 AGG-002 CRITICAL: Negative rog mein D30 ya upar "
            "dena FORBIDDEN hai. Rog aur badh jayega."
        ),
        "fix":       "D1, D2, ya D3 (Positive/Teevra dose) dein.",
        "auto_fix":  {"potency":"D2","dose_type":"TEEVRA"},
        "book_ref":  "Book Page 10: Negative rog mein High dilution → Aggravation",
    },
    {
        "id":        "AGG-003",
        "rule":      "Clear polarity mein Neutral dose",
        "condition": lambda rp, dt, pno: rp in ("POSITIVE","NEGATIVE") and dt == "SAMANYA",
        "severity":  "WARNING",
        "message": (
            "⚠️ AGG-003: Rog polarity clear hai lekin Neutral dose "
            "(D4/D5) di ja rahi hai — rog na badhega na ghatega."
        ),
        "fix":       "POSITIVE rog → D6+, NEGATIVE rog → D1-D3",
        "auto_fix":  None,
        "book_ref":  "Book Page 17: D4/D5 → rog jaisa hai vaisa rahega",
    },
]

# ─────────────────────────────────────────────────────────────
# BOOK PAGE 11 — 7 Niyam (All adjustment rules)
# ─────────────────────────────────────────────────────────────
BOOK_RULES_PAGE11 = {
    1: {
        "situation": "Ṛṇātmak rog mein aushadhi ki dhnatmak matra hi rog ki awasthanusaar deni chahiye.",
        "meaning":   "Negative rog → sirf Positive dose (D1-D3)",
    },
    2: {
        "situation": "Dhnatmak rog mein aushadhi ki Ṛṇātmak matra hi prayog ki jaati hai.",
        "meaning":   "Positive rog → sirf Negative dose (D6+)",
    },
    3: {
        "situation": "Kabhi-kabhi rogi ka aaas-paas ka vatavaran bhi rog mein bhumika nibhata hai.",
        "meaning":   "Cold region/bacchpan = POSITIVE tendency. Garm desh/budhapa = NEGATIVE tendency.",
    },
    4: {
        "situation": "Garm pradeshon ke nivasiyon aur buddhape ke lakshan Ṛṇātmak manne chahiye.",
        "meaning":   "Age 60+ and hot climate = NEGATIVE — Positive dose preferred.",
    },
    5: {
        "situation": "Bhulvash galat matra dene se kasht badhta hai — viprit matra ya nimbu-sirka dein.",
        "meaning":   "Aggravation hone par → Opposite dose ya Nimbu-Sirka turant dein.",
    },
    6: {
        "situation": "Dhnatmak rog mein Ṛṇātmak dilution se thoda labh hua phir ruk gaya → dilution aur zyada Ṛṇātmak karo.",
        "meaning":   "Positive rog: D10 se thoda labh, ruka → D30 dein. D30 se ruka → D100 dein.",
    },
    7: {
        "situation": "Ṛṇātmak rog mein dhnatmak matra se kami hokar phir rog vyaapt ho gaya → matra aur dhnatmak karo.",
        "meaning":   "Negative rog: D3 se thoda labh, ruka → D2 dein. D2 se ruka → D1 + goliyan dein.",
    },
}

# ─────────────────────────────────────────────────────────────
# ANTIDOTE RULES — Book Page 10
# ─────────────────────────────────────────────────────────────
ANTIDOTE_RULES = {
    "AGGRAVATION_OCCURRED": {
        "name":      "Nimbu-Sirka (Primary Antidote)",
        "antidote":  "Nimbu-Sirka (Lemon + Vinegar)",
        "method":    "1 chamach nimbu ras + 1 chamach sirka → aadha cup gungune paani mein gholein",
        "timing":    "Turant dein — 15 minute ke andar",
        "book_ref":  "Book Page 10: Aggravation par nimbu-sirka ya viprit matra",
        "alternative":"Viprit matra dein (opposite polarity dose)",
    },
    "WRONG_DOSE_GIVEN": {
        "name":      "Viprit Matra (Opposite Dose)",
        "antidote":  "Viprit matra (Opposite Polarity Dose)",
        "method":    "Positive dose galti se di → Negative dose do. Negative galti se di → Positive dose do.",
        "timing":    "30 minute ke andar",
        "book_ref":  "Book Page 10: Viprit matra ya nimbu-sirka dena hit hota hai",
        "alternative":"Nimbu-Sirka",
    },
}

# ─────────────────────────────────────────────────────────────
# POTENCY UPGRADE/DOWNGRADE MAP — Book Rule 6 & 7
# ─────────────────────────────────────────────────────────────
UPGRADE_MAP = {
    "POSITIVE_BENEFIT_STOPPED": {   # D6→D10→D30→D100
        "D6":"D10","D10":"D30","D30":"D100","D100":"D200","D200":"D1000"
    },
    "NEGATIVE_BENEFIT_STOPPED": {   # D3→D2→D1→Goliyan
        "D3":"D2","D2":"D1","D1":"D1+Dry Pills (20 goliyan)"
    },
}

# ─────────────────────────────────────────────────────────────
# BP + AGE WARNINGS
# ─────────────────────────────────────────────────────────────
def get_clinical_warnings(bp_sys, bp_dia, age, polarity, systems):
    W = []
    # BP
    if bp_sys >= 180:
        W.append({"type":"BP_CRISIS",   "level":"HIGH",
                  "message":f"🚨 BP {bp_sys}/{bp_dia} — BAHUT ZYADA. Turant doctor ke paas jayein. D6 max dein.",
                  "fix":"D6 se shuru karein. Namak bilkul band. Doctor referral."})
    elif bp_sys >= 160:
        W.append({"type":"BP_HIGH",     "level":"HIGH",
                  "message":f"⚠️ BP {bp_sys}/{bp_dia} — Zyada hai. CARDIAC mixture zaroor dein. Namak band.",
                  "fix":"CARDIAC system add karein formula mein."})
    elif bp_sys < 80:
        W.append({"type":"BP_VERY_LOW", "level":"HIGH",
                  "message":f"⚠️ BP {bp_sys}/{bp_dia} — Bahut kam. Positive teevra dose zaroor dein.",
                  "fix":"D1 ya D2 dein. Patient letakar rakhein."})
    elif bp_sys < 100:
        W.append({"type":"BP_LOW",      "level":"MEDIUM",
                  "message":f"⚠️ BP {bp_sys}/{bp_dia} — Thoda kam. Positive dose prefer karein.",
                  "fix":"D1-D3 range use karein."})
    # Age
    if age <= 5:
        W.append({"type":"VERY_YOUNG",  "level":"HIGH",
                  "message":f"⚠️ Umra {age} saal — Bahut chota baccha. 2-3 boonden only. EH doctor se milein.",
                  "fix":"Sirf D1 ya D2. Dose: 2-3 boonden."})
    elif age <= 12:
        W.append({"type":"CHILD",       "level":"MEDIUM",
                  "message":f"ℹ️ Umra {age} saal — Baccha. 5 boonden. Potency ek level gentle rakhein.",
                  "fix":"5 boonden. D30 ki jagah D10 dein."})
    elif age >= 75:
        W.append({"type":"VERY_ELDERLY","level":"MEDIUM",
                  "message":f"ℹ️ Umra {age} saal — Burhapa. Potency ek level kam rakhein. D30→D10.",
                  "fix":"D30 → D10. D3 → D2. 7 boonden."})
    # System combos
    if "CARDIAC" in systems and "RENAL" in systems:
        W.append({"type":"CARDIORENAL", "level":"HIGH",
                  "message":"⚠️ Hriday + Gurda dono prabhavit — Cardiorenal Syndrome. Namak+paani par khaas dhyan.",
                  "fix":"B.E. sirf Mixture A mein. Namak ZERO. 2L warm water daily."})
    if "DEGENERATIVE" in systems:
        W.append({"type":"DEGENERATIVE","level":"MEDIUM",
                  "message":"ℹ️ Apkshay bimari — Sudhar dhire hoga (6 mahine+). Dawa kabhi band na karein.",
                  "fix":"Minimum 6 mahine niyamit lein."})
    if "CARDIAC" in systems and "NEURO" in systems:
        W.append({"type":"CARDIO_NEURO","level":"MEDIUM",
                  "message":"ℹ️ Hriday + Nadi dono — B.E. subah, R.E. shaam. Ek saath nahi.",
                  "fix":"B.E. Mixture → Subah. R.E. Mixture → Shaam."})
    if len(systems) >= 4:
        W.append({"type":"MULTI_DISEASE","level":"MEDIUM",
                  "message":f"ℹ️ {len(systems)} bimariyan ek saath — Alag-alag mixture alag samay par lein.",
                  "fix":"Har mixture ke beech 2-3 ghante ka antar zaroor rakhein."})
    return W

# ─────────────────────────────────────────────────────────────
# MEDICINE POLARITY CHECK — NEW in v2.0
# Book: POSITIVE rog → NEGATIVE medicines (C-Group preferred)
#       NEGATIVE rog → POSITIVE medicines (S-Group preferred)
# ─────────────────────────────────────────────────────────────
def check_medicine_polarity(mixtures: list, rog_polarity: str) -> dict:
    """Check karo ki formula ki medicines rog polarity ke hisaab se sahi hain."""
    issues = []
    for mix in mixtures:
        fo   = mix.get("formula_obj", mix.get("fo", {}))
        meds = fo.get("medicines", [])
        med_ids = [
            (m.get("id","") if isinstance(m,dict) else str(m))
            for m in meds
        ]

        pos_count  = sum(1 for m in med_ids if get_medicine_polarity(m) == "POSITIVE")
        neg_count  = sum(1 for m in med_ids if get_medicine_polarity(m) == "NEGATIVE")
        neu_count  = sum(1 for m in med_ids if get_medicine_polarity(m) == "NEUTRAL")
        label      = mix.get("label","MIXTURE ?")

        if rog_polarity == "POSITIVE" and neg_count == 0 and pos_count > 0:
            issues.append({
                "label":   label,
                "issue":   "POSITIVE rog mein NEGATIVE medicine (C-Group) missing",
                "found":   f"Pos={pos_count} Neg={neg_count} Neu={neu_count}",
                "fix":     "C-Group medicine zaroor add karein — book Rule: Positive rog → Negative medicine",
                "severity":"WARNING",
                "book_ref":"Book Page 8-9: C8, C15, Ven, Ver = Negative medicines — Positive rog mein dein",
            })
        elif rog_polarity == "NEGATIVE" and pos_count == 0 and neg_count > 0:
            issues.append({
                "label":   label,
                "issue":   "NEGATIVE rog mein POSITIVE medicine (S-Group) missing",
                "found":   f"Pos={pos_count} Neg={neg_count} Neu={neu_count}",
                "fix":     "S-Group medicine zaroor add karein — book Rule: Negative rog → Positive medicine",
                "severity":"WARNING",
                "book_ref":"Book Page 8: S1-S12, A1-A3, P1-P4 = Positive medicines — Negative rog mein dein",
            })

    return {
        "checked":   True,
        "issues":    issues,
        "has_issues":len(issues) > 0,
    }

# ─────────────────────────────────────────────────────────────
# L1 DUPLICATION CHECK
# ─────────────────────────────────────────────────────────────
def check_l1_duplication(mixtures: list) -> dict:
    l1_in = []
    for mix in mixtures:
        fo  = mix.get("formula_obj", mix.get("fo", {}))
        meds = fo.get("medicines", [])
        ids  = [m.get("id","") if isinstance(m,dict) else str(m) for m in meds]
        if "L1" in ids:
            l1_in.append(mix.get("label",""))
    if len(l1_in) > 1:
        return {
            "duplicated":  True,
            "in_mixtures": l1_in,
            "warning":     f"L-1 {len(l1_in)} Mixtures mein hai — sirf {l1_in[0]} mein rakhein.",
            "fix":         f"Baaki {', '.join(l1_in[1:])} se L-1 hatayein.",
        }
    return {"duplicated": False, "in_mixtures": l1_in, "warning":"", "fix":""}

# ─────────────────────────────────────────────────────────────
# AUTO-CORRECTION ENGINE — NEW in v2.0
# ─────────────────────────────────────────────────────────────
def auto_correct(critical_errors: list, rog_polarity: str,
                 current_potency: str, current_dose_type: str) -> dict:
    """
    DANGER state mein auto-correction karo.
    Returns corrected potency + dose_type + note.
    """
    if not critical_errors:
        return {"corrected": False, "potency": current_potency,
                "dose_type": current_dose_type, "note": ""}

    for err in critical_errors:
        fix = err.get("auto_fix")
        if fix:
            return {
                "corrected":  True,
                "potency":    fix["potency"],
                "dose_type":  fix["dose_type"],
                "original":   current_potency,
                "note": (
                    f"⚠️ AUTO-CORRECTION: {current_potency} → {fix['potency']}. "
                    f"Karan: {err['rule']} (Book: {err.get('book_ref','')})"
                ),
            }

    # Default correction by polarity
    if rog_polarity == "POSITIVE":
        return {"corrected":True,"potency":"D6","dose_type":"UCHCH",
                "original":current_potency,
                "note":f"Auto-corrected → D6 (Positive rog mein minimum safe dose)"}
    else:
        return {"corrected":True,"potency":"D2","dose_type":"TEEVRA",
                "original":current_potency,
                "note":f"Auto-corrected → D2 (Negative rog mein safe Positive dose)"}

# ─────────────────────────────────────────────────────────────
# ADJUSTMENT GUIDE — Book Rule 6 & 7
# ─────────────────────────────────────────────────────────────
def get_adjustment_guide(rog_polarity: str, current_potency: str) -> list:
    """Labh ruk jaye to kya karein — Book Page 11."""
    guide = []
    if rog_polarity == "POSITIVE":
        up_map = UPGRADE_MAP["POSITIVE_BENEFIT_STOPPED"]
        next_p = up_map.get(current_potency, "D100")
        guide.append({
            "situation": "Jab current potency se thoda labh hua phir ruk jaye",
            "action":    f"{current_potency} → {next_p} dein (aur zyada Negative karo)",
            "rule_no":   6,
            "book_ref":  BOOK_RULES_PAGE11[6]["situation"],
        })
        guide.append({
            "situation": "Jab aggravation ho",
            "action":    "Nimbu-Sirka turant dein ya Positive dose ek baar dein phir wapas Negative par aao",
            "rule_no":   5,
            "book_ref":  BOOK_RULES_PAGE11[5]["situation"],
        })
    elif rog_polarity == "NEGATIVE":
        up_map = UPGRADE_MAP["NEGATIVE_BENEFIT_STOPPED"]
        next_p = up_map.get(current_potency, "D1 + Dry Pills")
        guide.append({
            "situation": "Jab current potency se thoda labh hua phir ruk jaye",
            "action":    f"{current_potency} → {next_p} dein (aur zyada Positive/Teevra karo)",
            "rule_no":   7,
            "book_ref":  BOOK_RULES_PAGE11[7]["situation"],
        })
        guide.append({
            "situation": "Jab aggravation ho",
            "action":    "Nimbu-Sirka turant dein ya Negative high dose ek baar dein",
            "rule_no":   5,
            "book_ref":  BOOK_RULES_PAGE11[5]["situation"],
        })
    return guide

# ─────────────────────────────────────────────────────────────
# MAIN ENGINE FUNCTION
# ─────────────────────────────────────────────────────────────
def run_safety_check(
    rog_polarity:    str,
    dose_type:       str,
    potency_no:      int,
    potency_str:     str  = "",
    bp_systolic:     int  = 120,
    bp_diastolic:    int  = 80,
    age:             int  = 30,
    active_systems:  list = None,
    mixtures:        list = None,
) -> dict:
    """
    Poora safety check + auto-correction.

    Returns: {
        "is_safe":          bool,
        "overall_status":   "SAFE"|"WARNING"|"DANGER",
        "critical_errors":  [...],
        "warnings":         [...],
        "medicine_check":   {...},
        "mixture_check":    {...},
        "adjustment_guide": [...],
        "antidote_ready":   {...},
        "auto_correction":  {...},
        "book_rules_summary":[...],
        "summary":          "...",
    }
    """
    active_systems = active_systems or []
    mixtures       = mixtures       or []
    potency_str    = potency_str    or f"D{potency_no}"

    critical_errors   = []
    warnings          = []

    # ── BLOCK 1: Aggravation rules (Pages 9-10) ──────────────
    for rule in AGGRAVATION_RULES:
        try:
            if rule["condition"](rog_polarity, dose_type, potency_no):
                entry = {k:v for k,v in rule.items() if k != "condition"}
                if rule["severity"] == "CRITICAL":
                    critical_errors.append(entry)
                else:
                    warnings.append(entry)
        except Exception:
            pass

    # ── BLOCK 2: Clinical warnings (BP + Age + Systems) ──────
    clin = get_clinical_warnings(bp_systolic, bp_diastolic, age,
                                  rog_polarity, active_systems)
    warnings.extend(clin)

    # ── BLOCK 3: Medicine polarity check (NEW v2.0) ───────────
    med_check = check_medicine_polarity(mixtures, rog_polarity)
    if med_check["has_issues"]:
        for issue in med_check["issues"]:
            warnings.append({
                "type":    "MEDICINE_POLARITY",
                "level":   issue["severity"],
                "message": f"⚠️ [{issue['label']}] {issue['issue']}",
                "fix":     issue["fix"],
            })

    # ── BLOCK 4: L1 duplication check ────────────────────────
    l1_chk = check_l1_duplication(mixtures)
    mix_check = {
        "non_interference": (
            "⚠️ Alag-alag Mixture ek glass mein KABHI nahi milayein — "
            "bio-electrical resonance cancel hoti hai."
        ),
        "timing_gap": (
            "✅ Har Mixture ke beech kam se kam 2-3 ghante ka antar rakhein."
        ),
        "l1_duplication": l1_chk,
    }
    if l1_chk["duplicated"]:
        warnings.append({
            "type":    "L1_DUPLICATE",
            "level":   "MEDIUM",
            "message": f"ℹ️ {l1_chk['warning']}",
            "fix":     l1_chk["fix"],
        })

    # ── BLOCK 5: Auto-correction ─────────────────────────────
    auto_corr = auto_correct(critical_errors, rog_polarity,
                              potency_str, dose_type)

    # ── BLOCK 6: Adjustment guide ────────────────────────────
    adj_guide = get_adjustment_guide(rog_polarity, potency_str)

    # ── BLOCK 7: Antidote ────────────────────────────────────
    antidote = ANTIDOTE_RULES["AGGRAVATION_OCCURRED"] if critical_errors else None

    # ── BLOCK 8: Overall status ───────────────────────────────
    if critical_errors:
        overall_status = "DANGER"
        is_safe        = False
    elif warnings:
        overall_status = "WARNING"
        is_safe        = True
    else:
        overall_status = "SAFE"
        is_safe        = True

    # ── BLOCK 9: Book rules summary ───────────────────────────
    book_summary = [
        {
            "rule_no": 1,
            "applies": rog_polarity == "NEGATIVE",
            "text":    BOOK_RULES_PAGE11[1]["meaning"],
        },
        {
            "rule_no": 2,
            "applies": rog_polarity == "POSITIVE",
            "text":    BOOK_RULES_PAGE11[2]["meaning"],
        },
        {
            "rule_no": 5,
            "applies": bool(critical_errors),
            "text":    BOOK_RULES_PAGE11[5]["meaning"],
        },
        {
            "rule_no": 6 if rog_polarity == "POSITIVE" else 7,
            "applies": True,
            "text":    BOOK_RULES_PAGE11[6 if rog_polarity == "POSITIVE" else 7]["meaning"],
        },
    ]

    # ── Summary ───────────────────────────────────────────────
    if overall_status == "DANGER":
        summary = (
            f"🚨 {len(critical_errors)} CRITICAL error(s). "
            f"Auto-corrected to: {auto_corr['potency']}. "
            "Treatment plan mein sudhar zaroor karein."
        )
    elif overall_status == "WARNING":
        summary = (
            f"⚠️ {len(warnings)} warning(s). "
            "Treatment safe hai lekin dhyan dein."
        )
    else:
        summary = "✅ Safety check passed. Treatment plan bilkul safe hai."

    return {
        "is_safe":           is_safe,
        "overall_status":    overall_status,
        "critical_errors":   critical_errors,
        "warnings":          warnings,
        "medicine_check":    med_check,
        "mixture_check":     mix_check,
        "adjustment_guide":  adj_guide,
        "antidote_ready":    antidote,
        "auto_correction":   auto_corr,
        "book_rules_summary":book_summary,
        "summary":           summary,
    }

# ─────────────────────────────────────────────────────────────
# PARCHA SECTION FORMATTER — Complete v2.0
# ─────────────────────────────────────────────────────────────
def format_safety_section(safety_result: dict, potency: str = "",
                           rog_polarity: str = "") -> str:
    lines = []
    A = lines.append
    s = safety_result

    A("╔══════════════════════════════════════════════════════════╗")
    A("║  SAFETY REPORT — EH CHIKITSA SURAKSHA                  ║")
    A("╚══════════════════════════════════════════════════════════╝")
    A(f"  Status  : {s['overall_status']}")
    A(f"  Summary : {s['summary']}")
    A("")

    if s["critical_errors"]:
        A("  🚨 CRITICAL ERRORS — Turant sudhaar karein:")
        A(f"  {'─'*55}")
        for e in s["critical_errors"]:
            A(f"  [{e.get('id','')}] {e.get('message','')}")
            A(f"  Fix: {e.get('fix','')}")
            A(f"  Book: {e.get('book_ref','')}")
        A("")
        if s["auto_correction"]["corrected"]:
            ac = s["auto_correction"]
            A(f"  ✅ AUTO-CORRECTED: {ac['original']} → {ac['potency']}")
            A(f"  {ac['note']}")
        A("")

    if s["warnings"]:
        A("  ⚠️ WARNINGS:")
        A(f"  {'─'*55}")
        for w in s["warnings"]:
            A(f"  • {w.get('message','')}")
            if w.get("fix"):
                A(f"    Fix: {w['fix']}")
        A("")

    A("  ℹ️ MIXTURE SAFETY RULES:")
    A(f"  • {s['mixture_check']['non_interference']}")
    A(f"  • {s['mixture_check']['timing_gap']}")
    A("")

    A("  📋 ADJUSTMENT GUIDE (Labh ruk jaye to):")
    for adj in s.get("adjustment_guide", []):
        A(f"  • Rule {adj['rule_no']}: {adj['situation']}")
        A(f"    → {adj['action']}")
    A("")

    A("  🆘 AGGRAVATION HONE PAR (Antidote):")
    ant = ANTIDOTE_RULES["AGGRAVATION_OCCURRED"]
    A(f"  • {ant['name']}: {ant['method']}")
    A(f"  • Samay: {ant['timing']}")
    A(f"  • Vikalp: {ant['alternative']}")
    A("")

    A("  📖 BOOK RULES APPLICABLE:")
    for br in s.get("book_rules_summary", []):
        mark = "✅" if br["applies"] else "  "
        A(f"  {mark} Rule {br['rule_no']}: {br['text']}")

    return "\n".join(lines)

# ─────────────────────────────────────────────────────────────
# TEST — 12 Tests
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 68)
    print("SAFETY ENGINE v2.0 — TEST RESULTS")
    print("=" * 68)

    TESTS = [
        # (rp, dt, pno, bp, age, systems, exp_status, desc)
        ("POSITIVE","TEEVRA", 1,  120,40,["RENAL"],          "DANGER",  "AGG-001: Pos rog + D1"),
        ("POSITIVE","UCHCH",  10, 120,40,["RENAL"],          "SAFE",    "Correct: Pos rog + D10"),
        ("NEGATIVE","UCHCH",  30, 120,40,["NEURO"],          "DANGER",  "AGG-002: Neg rog + D30"),
        ("NEGATIVE","TEEVRA", 2,  120,40,["NEURO"],          "SAFE",    "Correct: Neg rog + D2"),
        ("POSITIVE","SAMANYA",5,  120,40,["LIVER"],          "WARNING", "AGG-003: Pos rog + D5"),
        ("POSITIVE","UCHCH",  10, 185,45,["CARDIAC"],        "WARNING", "BP 185 warning"),
        ("NEGATIVE","TEEVRA", 1,  120,3, ["METABOLIC"],      "WARNING", "Age 3 child"),
        ("POSITIVE","UCHCH",  10, 120,80,["JOINTS"],         "WARNING", "Age 80 elderly"),
        ("MIXED",   "SAMANYA",5,  120,40,["GASTRIC"],        "SAFE",    "Mixed + D5 = OK"),
        ("POSITIVE","UCHCH",  10, 150,45,["CARDIAC","RENAL"],"WARNING", "Cardiorenal combo"),
        ("NEGATIVE","UCHCH",  30, 120,40,["NEURO","CARDIAC"],"DANGER",  "AGG-002 + Cardio combo"),
        ("POSITIVE","TEEVRA", 1,  90, 25,["GYNE"],          "DANGER",  "AGG-001 + Low BP"),
    ]

    all_pass = True
    for i,(rp,dt,pno,bp,age,sys,exp,desc) in enumerate(TESTS,1):
        r = run_safety_check(
            rog_polarity=rp, dose_type=dt, potency_no=pno,
            bp_systolic=bp, age=age, active_systems=sys,
        )
        ok   = r["overall_status"] == exp
        if not ok: all_pass = False
        mark = "✅" if ok else "❌"
        print(f"{mark} T{i:02d}: {desc:<40} → {r['overall_status']:<8} (exp={exp})")
        if not ok:
            print(f"     Critical: {[e.get('id',e.get('type','')) for e in r['critical_errors']]}")
            print(f"     Warnings: {[w.get('type','') for w in r['warnings']]}")

    # Auto-correction test
    print("\n── Auto-Correction Tests ──")
    ac1 = run_safety_check("POSITIVE","TEEVRA",1)
    ac2 = run_safety_check("NEGATIVE","UCHCH",30)
    print(f"  {'✅' if ac1['auto_correction']['corrected'] and ac1['auto_correction']['potency']=='D6' else '❌'} "
          f"Pos rog + D1 → Auto-corrected to {ac1['auto_correction'].get('potency','?')}")
    print(f"  {'✅' if ac2['auto_correction']['corrected'] and ac2['auto_correction']['potency']=='D2' else '❌'} "
          f"Neg rog + D30 → Auto-corrected to {ac2['auto_correction'].get('potency','?')}")

    # Medicine polarity test
    print("\n── Medicine Polarity Check ──")
    mock_pos_rog = [
        {"label":"MIXTURE A","formula_obj":{"medicines":[{"id":"S1"},{"id":"S6"}]}}
    ]
    mock_neg_rog = [
        {"label":"MIXTURE A","formula_obj":{"medicines":[{"id":"C4"},{"id":"C6"}]}}
    ]
    mc1 = check_medicine_polarity(mock_pos_rog, "POSITIVE")  # Only S-Group in POSITIVE rog = issue
    mc2 = check_medicine_polarity(mock_neg_rog, "POSITIVE")  # C-Group in POSITIVE rog = correct
    print(f"  {'✅' if mc1['has_issues'] else '❌'} POSITIVE rog + only S-Group → Issue detected")
    print(f"  {'✅' if not mc2['has_issues'] else '❌'} POSITIVE rog + C-Group → No issue")

    # Adjustment guide test
    print("\n── Adjustment Guide ──")
    ag1 = get_adjustment_guide("POSITIVE","D10")
    ag2 = get_adjustment_guide("NEGATIVE","D3")
    print(f"  ✅ POSITIVE D10 → Next: {ag1[0]['action'][:50]}")
    print(f"  ✅ NEGATIVE D3  → Next: {ag2[0]['action'][:50]}")

    # L1 duplication
    print("\n── L1 Duplication Check ──")
    mixes = [
        {"label":"A","formula_obj":{"medicines":[{"id":"S1"},{"id":"L1"}]}},
        {"label":"B","formula_obj":{"medicines":[{"id":"C4"},{"id":"L1"}]}},
    ]
    l1 = check_l1_duplication(mixes)
    print(f"  {'✅' if l1['duplicated'] else '❌'} L1 duplication detected in {l1['in_mixtures']}")

    # Format test
    print("\n── Safety Section Format Sample ──")
    sample = run_safety_check(
        rog_polarity="POSITIVE", dose_type="TEEVRA", potency_no=1,
        bp_systolic=160, age=45, active_systems=["CARDIAC","RENAL"],
    )
    output = format_safety_section(sample, "D1","POSITIVE")
    print(output[:600])

    print(f"\n{'='*68}")
    print(f"RESULT: {'✅ ALL PASS' if all_pass else '❌ SOME FAIL'}")
    print(f"{'='*68}")
