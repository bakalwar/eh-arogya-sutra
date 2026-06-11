"""
╔══════════════════════════════════════════════════════════════╗
║  POLARITY ENGINE v1.0                                       ║
║  E.H. Arogya Sutra — Engine 2 of 9                         ║
║                                                              ║
║  Book Source: EH Chikitsa Vigyan (Pages 7-11, 17-18)        ║
║                                                              ║
║  POSITIVE ROG: Ang ka kaam ADHIK hona                       ║
║  NEGATIVE ROG: Ang ka kaam KAM hona                         ║
║                                                              ║
║  INPUT:  symptoms, BP, age, lab values (optional)            ║
║  OUTPUT: polarity + score + treatment direction              ║
╚══════════════════════════════════════════════════════════════╝
"""

import re
from typing import Optional

# ─────────────────────────────────────────────────────────────
# POSITIVE DISEASE SYMPTOMS — Book Page 7, 9, 18
# Ang ka kaam BADHNA = POSITIVE ROG
# ─────────────────────────────────────────────────────────────
POSITIVE_SYMPTOMS = [
    # Heartbeat / Circulation (FAST/MORE)
    "tej dhadkan",       "fast heartbeat",     "palpitation",
    "dhadkan tej",       "dhadkan zyada",       "dil tej",
    "hriday tej",        "heart fast",          "heart racing",

    # Blood pressure HIGH
    "BP high",           "BP badhna",           "raktachap badhna",
    "hypertension",      "high BP",             "blood pressure high",
    "BP 140",            "BP 150",              "BP 160",

    # Bleeding / Discharge (EXCESS)
    "khooni dast",       "bloody diarrhea",     "raktshrav",
    "khooni bawasir",    "bleeding",            "khoon aana",
    "rakt aana",         "blood in stool",

    # Fever / Temperature (RISING)
    "bukhar",            "fever",               "jvar",
    "tapman badhna",     "temperature high",    "garmi",
    "tez bukhar",

    # Diarrhea / Loose motions (EXCESS)
    "dast",              "loose motion",        "diarrhea",
    "khane ke baad dast","turant dast",

    # Swelling / Inflammation (EXCESS)
    "sujan",             "swelling",            "suji hui",
    "inflammation",      "sooja hua",           "phulna",

    # Skin Eruptions (EXCESS)
    "dane",              "rash",                "eruption",
    "funsi",             "foде",                "khujli",
    "chale",             "blister",             "skin eruption",
    "daane bahar",

    # Glands (SWOLLEN)
    "granthi sujan",     "ganth badi",          "gilti sujti",
    "gland swelling",    "nodes swollen",

    # Menstruation (EXCESS - women)
    "masik zyada",       "periods zyada",       "heavy periods",
    "masik tej",         "baar baar masik",

    # Mental OVER-excitement
    "paglapan",          "mania",               "overexcitement",
    "gussa zyada",       "anger excess",

    # Other POSITIVE symptoms
    "naak bahna",        "running nose",        "nasal discharge",
    "laar girna",        "drooling",
    "khansi",            "cough",
    "baar baar bhookh",  "excess hunger",
    "zyada peshab",      "frequent urination",
    "zyada pasina",      "excess sweating",
    "tumor",             "rasauli",

    # ── BOOK PAGE 18: Additional ──
    "rakt ka sanchay",   "blood accumulation",
    "mavad",             "pus",                 "abscess",
    "uttejana",          "excitation",
    "vat excess",        "vat rog",
]

# ─────────────────────────────────────────────────────────────
# NEGATIVE DISEASE SYMPTOMS — Book Page 7-8, 9, 18
# Ang ka kaam GHATNA = NEGATIVE ROG
# ─────────────────────────────────────────────────────────────
NEGATIVE_SYMPTOMS = [
    # Heartbeat (SLOW/LESS)
    "dhadkan mand",      "slow heartbeat",      "heart slow",
    "dhadkan kam",       "hriday mand",

    # Blood pressure LOW
    "BP kam",            "low BP",              "raktachap kam",
    "BP low",            "blood pressure low",  "BP 90",
    "BP 80",

    # Digestion (SLOW)
    "pachan mand",       "digestion slow",      "digest nahi",
    "pachan kamzor",     "weak digestion",      "bhojan nahi pachta",
    "kabj",              "constipation",         "malbandh",
    "pet saaf nahi",     "latrine nahi",

    # Sensory Loss
    "kam dikhna",        "aankhein kamzor",      "poor vision",
    "andhera",           "vision loss",
    "kam sunna",         "bahra",               "hearing loss",
    "gandh na aana",     "smell loss",          "no smell",
    "sparsh nahi",       "touch sensitivity loss",

    # Appetite (LESS/NONE)
    "bhookh nahi",       "no appetite",         "khana nahi chahiye",
    "khana pasand nahi",

    # Weakness / Atrophy
    "kamzori",           "weakness",            "durbalata",
    "thakaan",           "fatigue",             "anemia",
    "khoon ki kami",     "rakt kam",
    "ang sukh jaana",    "organ atrophy",       "sukh jaana",

    # Nerve weakness
    "sunn",              "numbness",            "jhunjhuni",
    "tingling",          "paralysis",           "lakwa",
    "nerve weakness",    "nadi kamzori",
    "kaampna",           "trembling",

    # Body functions SLOW
    "sharir mand",       "body slow",
    "naakband",          "nasal blockage",
    "sheetala dabna",    "smallpox marks",

    # Menstruation (LESS)
    "masik kam",         "periods kam",         "masik nahi",
    "periods nahi",      "amenorrhea",

    # Mental DEPRESSION
    "depression",        "udaasi",              "nirasha",
    "mann bhara",        "monotony",

    # Physical signs
    "ang thanda",        "cold extremities",
    "blood circulation mand", "rakt circulation slow",

    # ── BOOK PAGE 8: Additional ──
    "maleria",           "malaria",             "periodic fever",
    "vat shakti ghatna", "nerve force low",
    "vataj shakti kam",
]

# ─────────────────────────────────────────────────────────────
# PHRASE PATTERNS — Longer phrases (higher accuracy)
# ─────────────────────────────────────────────────────────────
POSITIVE_PHRASES = [
    "dil ki dhadkan tej",
    "rakt bahna band nahi",
    "masik dharm zyada",
    "khoon bahut aata",
    "sujan ho gayi",
    "bukhar aa gaya",
    "BP badh gaya",
    "dast lag rahe",
    "naak bah rahi",
    "dane nikal aaye",
]

NEGATIVE_PHRASES = [
    "bhookh nahi lagti",
    "aankhon se kam dikhta",
    "kanon se kam sunai",
    "dhadkan mand ho gayi",
    "pachan mand ho gaya",
    "haath pair thande",
    "sharir sooth gaya",
    "khoon ki kami hai",
    "kamzori rehti hai",
    "kabj rehti hai",
    "pet saaf nahi hota",
]

# ─────────────────────────────────────────────────────────────
# ENVIRONMENT FACTORS — Book Page 10-11, 18
# ─────────────────────────────────────────────────────────────
POSITIVE_ENVIRONMENT = [
    "thanda pradesh",  "cold region",    "pahad",
    "mountain",        "uttar",          "north",
    "bacchpan",        "childhood",      "child",
]

NEGATIVE_ENVIRONMENT = [
    "garm desh",       "hot country",    "tropical",
    "budhapa",         "old age",        "elderly",
    "samudra kinara",  "sea shore",
    "bhoomadhy rekha", "equator",
]

# ─────────────────────────────────────────────────────────────
# TREATMENT DIRECTION TABLE — Book Direct
# ─────────────────────────────────────────────────────────────
TREATMENT_RULES = {
    "POSITIVE": {
        "medicine_type":  "NEGATIVE medicines",
        "medicine_group": ["C-Group","Ver-Group","Ven-Group"],
        "electricity":    ["Y.E.","G.E."],
        "dose_type":      "Negative Dose (Uchch Matra)",
        "potency_range":  "D6 se D1000 tak",
        "avoid":          "D1, D2, D3 — AGGRAVATION HOGA",
        "hindi_reason":   (
            "Dhnatmak rog mein ang adhik kaam kar rahe hain. "
            "Ṛṇātmak aushadhi ki Uchch matra (D6+) se ang ki "
            "adhik kriyashilta shithil hokar samanya hogi."
        ),
    },
    "NEGATIVE": {
        "medicine_type":  "POSITIVE medicines",
        "medicine_group": ["S-Group","A-Group","P-Group"],
        "electricity":    ["R.E.","W.E."],
        "dose_type":      "Positive Dose (Teevra Matra)",
        "potency_range":  "D1 se D3 tak",
        "avoid":          "D30, D100, D200 — AGGRAVATION HOGA",
        "hindi_reason":   (
            "Ṛṇātmak rog mein ang ka kaam kam ho gaya hai. "
            "Dhnatmak aushadhi ki Teevra matra (D1-D3) se ang "
            "ki kriyashilta badhkar samanya hogi."
        ),
    },
    "MIXED": {
        "medicine_type":  "NEUTRAL medicines first",
        "medicine_group": ["L-Group","F-Group"],
        "electricity":    ["W.E."],
        "dose_type":      "Neutral Dose (Samanya Matra)",
        "potency_range":  "D4 ya D5",
        "avoid":          "Jab tak polarity clear na ho, D1 ya D30 nahi",
        "hindi_reason":   (
            "Dono prakar ke lakshan hain. Pehle Udasin "
            "aushadhi (W.E., L-Group) se shuru karein. "
            "Jab polarity clear ho, tab badlein."
        ),
    },
}

# ─────────────────────────────────────────────────────────────
# HELPER — Phonetic normalization
# ─────────────────────────────────────────────────────────────
def _normalize(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r"[^a-z0-9\s]", " ", s)
    for old, new in [
        ("kh","k"),("gh","g"),("jh","j"),("bh","b"),("dh","d"),
        ("th","t"),("ch","c"),("ph","f"),("sh","s"),
        ("ee","i"),("oo","u"),("aa","a"),("ai","a"),
        ("au","a"),("ou","u"),("v","w"),
    ]:
        s = s.replace(old, new)
    return s


def _count_matches(text_norm: str, keywords: list) -> tuple:
    score = 0
    matched = []
    for kw in keywords:
        if _normalize(kw) in text_norm:
            score += 1
            matched.append(kw)
    return score, matched


# ─────────────────────────────────────────────────────────────
# MAIN ENGINE FUNCTION
# ─────────────────────────────────────────────────────────────
def detect_polarity(
    symptoms_text:  str,
    bp_systolic:    int = 120,
    bp_diastolic:   int = 80,
    age:            int = 30,
    gender:         str = "male",
    duration_days:  int = 0,
    lab_values:     Optional[dict] = None,
) -> dict:
    """
    Rog ki polarity detect karo — POSITIVE ya NEGATIVE.

    Args:
        symptoms_text: Patient ke symptoms (Hindi/Hinglish/English)
        bp_systolic:   Systolic BP (e.g. 140)
        bp_diastolic:  Diastolic BP (e.g. 90)
        age:           Patient ki umra
        gender:        "male" | "female"
        duration_days: Rog kitne dinon se hai
        lab_values:    {"hemoglobin": 9.0, "sugar": 250, ...}

    Returns: {
        "polarity":          "POSITIVE" | "NEGATIVE" | "MIXED",
        "pos_score":         12,
        "neg_score":         3,
        "confidence":        80,
        "treatment":         {...treatment direction...},
        "matched_positive":  ["sujan","bukhar",...],
        "matched_negative":  ["kamzori",...],
        "aggravation_warning": "...",
        "reasoning":         "...",
    }
    """

    text_norm = _normalize(symptoms_text)
    pos_score = 0
    neg_score = 0
    pos_matched = []
    neg_matched = []

    # ── Step 1: Phrase matching (high accuracy) ──
    for ph in POSITIVE_PHRASES:
        if _normalize(ph) in text_norm:
            pos_score += 3
            pos_matched.append(ph)

    for ph in NEGATIVE_PHRASES:
        if _normalize(ph) in text_norm:
            neg_score += 3
            neg_matched.append(ph)

    # ── Step 2: Keyword matching ──
    ps, pm = _count_matches(text_norm, POSITIVE_SYMPTOMS)
    ns, nm = _count_matches(text_norm, NEGATIVE_SYMPTOMS)
    pos_score += ps * 2
    neg_score += ns * 2
    pos_matched += pm
    neg_matched += nm

    # ── Step 3: BP rules (Book page 9) ──
    bp_reason = ""
    if bp_systolic >= 160:
        pos_score += 8
        bp_reason = f"BP {bp_systolic}/{bp_diastolic} — BAHUT HIGH (Positive rog)"
    elif bp_systolic >= 140:
        pos_score += 5
        bp_reason = f"BP {bp_systolic}/{bp_diastolic} — HIGH (Positive rog)"
    elif bp_systolic < 90:
        neg_score += 6
        bp_reason = f"BP {bp_systolic}/{bp_diastolic} — LOW (Negative rog)"
    elif bp_systolic < 100:
        neg_score += 3
        bp_reason = f"BP {bp_systolic}/{bp_diastolic} — Thoda kam (Negative tendency)"

    # ── Step 4: Age/environment (Book page 11, 18) ──
    age_reason = ""
    if age <= 12:
        pos_score += 2
        age_reason = "Bacchpan = Positive tendency"
    elif age >= 65:
        neg_score += 3
        age_reason = "Budhapa = Negative tendency"
    elif age >= 55:
        neg_score += 1
        age_reason = "Umra 55+ = Slight negative tendency"

    # ── Step 5: Lab values (if provided) ──
    lab_reason = []
    if lab_values:
        HIGH_MARKERS = {
            "sugar": 140,   "hemoglobin": 17.5,  "wbc": 11000,
            "uric_acid": 7, "creatinine": 1.3,   "sgpt": 56,
            "cholesterol": 200, "bp_systolic": 140,
        }
        LOW_MARKERS = {
            "hemoglobin": 12,  "wbc": 4000,
            "rbc": 4.0,        "platelets": 150000,
        }
        for test, val in lab_values.items():
            t = test.lower()
            if t in HIGH_MARKERS and float(val) > HIGH_MARKERS[t]:
                pos_score += 3
                lab_reason.append(f"{test}={val} HIGH→Positive")
            elif t in LOW_MARKERS and float(val) < LOW_MARKERS[t]:
                neg_score += 3
                lab_reason.append(f"{test}={val} LOW→Negative")

    # ── Step 6: Determine polarity ──
    if pos_score == 0 and neg_score == 0:
        polarity = "MIXED"
        confidence = 40
    elif pos_score > neg_score * 1.5:
        polarity = "POSITIVE"
        confidence = min(int((pos_score / (pos_score + neg_score + 1)) * 100) + 20, 95)
    elif neg_score > pos_score * 1.5:
        polarity = "NEGATIVE"
        confidence = min(int((neg_score / (pos_score + neg_score + 1)) * 100) + 20, 95)
    elif pos_score > neg_score:
        polarity = "POSITIVE"
        confidence = min(int((pos_score / (pos_score + neg_score + 1)) * 100) + 10, 80)
    elif neg_score > pos_score:
        polarity = "NEGATIVE"
        confidence = min(int((neg_score / (pos_score + neg_score + 1)) * 100) + 10, 80)
    else:
        polarity = "MIXED"
        confidence = 50

    treatment = TREATMENT_RULES[polarity]

    # ── Aggravation warning ──
    aggravation_warning = ""
    if polarity == "POSITIVE":
        aggravation_warning = (
            "⚠️ POSITIVE rog mein D1/D2/D3 KABHI NAHI dein. "
            "Isse rog aur badh jayega (AGGRAVATION)."
        )
    elif polarity == "NEGATIVE":
        aggravation_warning = (
            "⚠️ NEGATIVE rog mein D30/D100/D200 KABHI NAHI dein. "
            "Isse rog aur badh jayega (AGGRAVATION)."
        )

    # ── Reasoning ──
    reasoning_parts = []
    if pos_matched:
        reasoning_parts.append(
            f"Positive symptoms: {', '.join(list(set(pos_matched))[:5])}"
        )
    if neg_matched:
        reasoning_parts.append(
            f"Negative symptoms: {', '.join(list(set(neg_matched))[:5])}"
        )
    if bp_reason:
        reasoning_parts.append(bp_reason)
    if age_reason:
        reasoning_parts.append(age_reason)
    if lab_reason:
        reasoning_parts.append(" | ".join(lab_reason[:3]))

    return {
        "polarity":             polarity,
        "polarity_hindi":       ("धनात्मक रोग" if polarity == "POSITIVE"
                                  else "ऋणात्मक रोग" if polarity == "NEGATIVE"
                                  else "मिश्रित"),
        "pos_score":            pos_score,
        "neg_score":            neg_score,
        "confidence":           confidence,
        "treatment":            treatment,
        "matched_positive":     list(set(pos_matched))[:8],
        "matched_negative":     list(set(neg_matched))[:8],
        "aggravation_warning":  aggravation_warning,
        "bp_factor":            bp_reason,
        "age_factor":           age_reason,
        "lab_factors":          lab_reason,
        "reasoning":            " | ".join(reasoning_parts),
    }


# ─────────────────────────────────────────────────────────────
# AGGRAVATION CHECKER — Safety check before giving medicine
# ─────────────────────────────────────────────────────────────
def check_aggravation(
    rog_polarity:       str,
    medicine_polarity:  str,
    potency_level:      int,
) -> dict:
    """
    Check karo ki dawa dene se AGGRAVATION to nahi hoga.

    Book Rule (Page 9-10):
    - POSITIVE rog + POSITIVE dose = AGGRAVATION
    - NEGATIVE rog + NEGATIVE high dose = AGGRAVATION

    Args:
        rog_polarity:      "POSITIVE" | "NEGATIVE"
        medicine_polarity: "POSITIVE" | "NEGATIVE" | "NEUTRAL"
        potency_level:     Dilution number (1, 3, 6, 10, 30, 100...)

    Returns:
        {"safe": True/False, "risk": "...", "fix": "..."}
    """

    # POSITIVE rog mein POSITIVE dose = DANGER
    if rog_polarity == "POSITIVE" and medicine_polarity == "POSITIVE":
        return {
            "safe":  False,
            "risk":  "AGGRAVATION — Positive rog mein Positive dose",
            "fix":   "D6 ya upar ka Negative dose dein",
            "book_rule": "Book Page 9: Positive rog mein Positive dose → rog badh jaata hai",
        }

    # POSITIVE rog mein LOW dilution (D1-D3) = DANGER
    if rog_polarity == "POSITIVE" and potency_level <= 3:
        return {
            "safe":  False,
            "risk":  f"AGGRAVATION — Positive rog mein D{potency_level} dena galat",
            "fix":   "D6 ya upar ka dilution use karein",
            "book_rule": "Book Page 10: D3 tak Positive dose hoti hai — Positive rog mein nahi deni",
        }

    # NEGATIVE rog mein NEGATIVE high dose = DANGER
    if rog_polarity == "NEGATIVE" and potency_level >= 30:
        return {
            "safe":  False,
            "risk":  f"AGGRAVATION — Negative rog mein D{potency_level} dena galat",
            "fix":   "D1, D2, ya D3 use karein (Positive/Teevra dose)",
            "book_rule": "Book Page 10: D6+ Negative dose hai — Negative rog mein nahi deni",
        }

    return {
        "safe":      True,
        "risk":      "",
        "fix":       "",
        "book_rule": "",
    }


# ─────────────────────────────────────────────────────────────
# QUICK TEST
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    tests = [
        {
            "desc":     "High BP + sujan + tej dhadkan",
            "symptoms": "BP high hai, sujan hai haath pair mein, dhadkan tej hai, bukhar aa gaya",
            "bp":       150, "age": 45,
            "expected": "POSITIVE",
        },
        {
            "desc":     "Kamzori + kabj + kam dikhna",
            "symptoms": "bahut kamzori hai, kabj rehti hai, aankhon se kam dikhta hai, bhookh nahi lagti",
            "bp":       95, "age": 60,
            "expected": "NEGATIVE",
        },
        {
            "desc":     "Masik zyada + bleeding",
            "symptoms": "masik zyada ho raha hai, khooni dast ho rahi hai, dane nikal aaye",
            "bp":       120, "age": 30, "gender": "female",
            "expected": "POSITIVE",
        },
        {
            "desc":     "Paralysis + nerve weakness",
            "symptoms": "lakwa ho gaya hai, sunn rehta hai, haath pair thande, khoon ki kami hai",
            "bp":       100, "age": 55,
            "expected": "NEGATIVE",
        },
    ]

    print("=" * 65)
    print("POLARITY ENGINE v1.0 — TEST RESULTS")
    print("=" * 65)

    all_pass = True
    for tc in tests:
        result = detect_polarity(
            symptoms_text = tc["symptoms"],
            bp_systolic   = tc.get("bp", 120),
            age           = tc.get("age", 30),
            gender        = tc.get("gender", "male"),
        )
        ok = result["polarity"] == tc["expected"]
        if not ok:
            all_pass = False
        mark = "✅" if ok else "❌"

        print(f"\n{mark} {tc['desc']}")
        print(f"   Expected  : {tc['expected']}")
        print(f"   Detected  : {result['polarity']} "
              f"({result['polarity_hindi']}) | Confidence: {result['confidence']}%")
        print(f"   Scores    : POS={result['pos_score']} | NEG={result['neg_score']}")
        print(f"   Treatment : {result['treatment']['dose_type']}")
        print(f"   Warning   : {result['aggravation_warning']}")
        print(f"   Reasoning : {result['reasoning'][:80]}...")

    # Aggravation test
    print("\n── Aggravation Check Tests ──")
    cases = [
        ("POSITIVE", "POSITIVE", 1,  False),
        ("POSITIVE", "NEGATIVE", 10, True),
        ("NEGATIVE", "POSITIVE", 2,  True),
        ("NEGATIVE", "NEGATIVE", 30, False),
    ]
    for rp, mp, pl, expect_safe in cases:
        r = check_aggravation(rp, mp, pl)
        ok = r["safe"] == expect_safe
        print(f"  {'✅' if ok else '❌'} Rog={rp} Med={mp} D{pl} → "
              f"Safe={r['safe']} {r['risk'][:40] if r['risk'] else ''}")

    print(f"\n{'='*65}")
    print(f"RESULT: {'✅ ALL PASS' if all_pass else '❌ SOME FAIL'}")
    print(f"{'='*65}")
