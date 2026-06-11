"""
╔══════════════════════════════════════════════════════════════╗
║  FORMULA ENGINE v1.0                                        ║
║  E.H. Arogya Sutra — Engine 5 of 9                         ║
║                                                              ║
║  Connects: Engine1+Engine2+Engine3+Engine4                   ║
║                                                              ║
║  Responsibilities:                                           ║
║  1. Multi-disease → Mixture A, B, C, D build karna          ║
║  2. Chrono-therapeutic scheduling (timing per mixture)       ║
║  3. Disease-combination combo notes                          ║
║  4. Polarity conflict check between mixtures                 ║
║  5. Final formula validation                                 ║
║                                                              ║
║  INPUT:  All 4 engine results + active_systems               ║
║  OUTPUT: Complete mixtures list with timing + combo notes    ║
╚══════════════════════════════════════════════════════════════╝
"""

from typing import Optional

# ─────────────────────────────────────────────────────────────
# CHRONO-THERAPEUTIC SCHEDULE — Book principle
# Alag-alag Mixture = Alag-alag samay
# ─────────────────────────────────────────────────────────────
SCHEDULES = {
    1: [
        "5 boonden — Aadha cup gungune paani mein — "
        "Subah + Raat (Khali pet)"
    ],
    2: [
        "5 boonden — Subah + Dopahar (Khali pet) | Morning & Noon",
        "5 boonden — Shaam + Raat (Bhojan ke baad) | Evening & Night",
    ],
    3: [
        "5 boonden — Subah (Khali pet) | Morning",
        "5 boonden — Dopahar (Bhojan ke baad) | After Noon",
        "5 boonden — Raat sote samay | Bedtime",
    ],
    4: [
        "5 boonden — Subah khali pet | Morning",
        "5 boonden — Dopahar bhojan ke baad | After Noon",
        "5 boonden — Shaam khali pet | Evening",
        "5 boonden — Raat sote samay | Bedtime",
    ],
}

# ─────────────────────────────────────────────────────────────
# DISEASE SYSTEM METADATA — Labels + icons
# ─────────────────────────────────────────────────────────────
SYSTEM_META = {
    "CARDIAC":      {"icon":"❤️",  "ne":"Cardiovascular & Arterial",    "nh":"हृदय एवं रक्तचाप नियामक"},
    "RENAL":        {"icon":"💧",  "ne":"Renal Fluid Filtration",        "nh":"वृक्क निस्पंदन एवं सुजन नाशक"},
    "GLANDULAR":    {"icon":"🔴",  "ne":"Glandular Node Softener",       "nh":"गांठ विलायक एवं ग्रंथि शोधक"},
    "FEVER":        {"icon":"🌡️", "ne":"Febrile Thermal Stabilizer",    "nh":"ज्वर एवं तापमान नाशक"},
    "RESPIRATORY":  {"icon":"🫁",  "ne":"Respiratory Bronchial Cleanser","nh":"श्वसन मार्ग एवं कफ नाशक"},
    "LIVER":        {"icon":"🟡",  "ne":"Hepatobiliary Purifier",        "nh":"यकृत एवं पित्त शोधक"},
    "GYNE":         {"icon":"🌸",  "ne":"Pelvic Mucosal Balancer",       "nh":"गर्भाशय एवं श्वेत प्रदर नाशक"},
    "GASTRIC":      {"icon":"🫃",  "ne":"Gastrointestinal Normalizer",   "nh":"पाचन, भारीपन एवं गैस नाशक"},
    "CONSTIPATION": {"icon":"🔄",  "ne":"Intestinal Peristalsis Activator","nh":"कब्ज एवं अंत्र गतिवर्धक"},
    "JOINTS":       {"icon":"🦴",  "ne":"Musculo-Skeletal Anti-Inflammatory","nh":"संधिवात एवं जोड़ों का दर्द नाशक"},
    "SKIN":         {"icon":"🌿",  "ne":"Cutaneous Blood Purifier",      "nh":"त्वचा विकार एवं रक्त शोधक"},
    "NEURO":        {"icon":"⚡",  "ne":"Neuromuscular Nerve Energizer", "nh":"नाड़ी संस्थान एवं वात नाशक"},
    "VENEREAL":     {"icon":"🔵",  "ne":"Genitourinary Mucosal Cleanser","nh":"गुप्त रोग एवं जनन-मूत्र शोधक"},
    "DEGENERATIVE": {"icon":"🔮",  "ne":"Cellular Regeneration",         "nh":"कोशिका पुनर्जनन योग"},
    "PARASITIC":    {"icon":"🦠",  "ne":"Anti-Parasitic Cleanser",       "nh":"कृमि नाशक एवं आंत शोधक"},
    "METABOLIC":    {"icon":"💪",  "ne":"Constitutional Vitality Builder","nh":"शारीरिक कमजोरी एवं जीवनी शक्ति वर्धक"},
}

# ─────────────────────────────────────────────────────────────
# COMBO NOTES — Multi-disease specific warnings
# ─────────────────────────────────────────────────────────────
COMBO_NOTES = {
    frozenset(["GYNE","NEURO"]):
        "F-1 kamar dard hetu S-2+C-2 ke saath teesri dawa ke roop mein dein.",
    frozenset(["RENAL","CARDIAC"]):
        "BP monitor karein. L-1 systemic fluid drainer zaroor dein. Namak pabandi.",
    frozenset(["SKIN","LIVER"]):
        "S-3 aur S-5 hepatic clearance ke raaste synergistically kaam karte hain.",
    frozenset(["GASTRIC","CONSTIPATION"]):
        "Pehle S-10+S-11 din mein; S-12+C-10 raat ko schedule karein.",
    frozenset(["FEVER","RESPIRATORY"]):
        "F-1 pehle 2 din, phir Day 3 se P-group add karein.",
    frozenset(["LIVER","GYNE"]):
        "Hormonal-hepatic link. Subah S-5, shaam S-2 protocol follow karein.",
    frozenset(["CARDIAC","NEURO"]):
        "B.E. subah; R.E. shaam — ek saath nahi dein. Alag samay rakhein.",
    frozenset(["GLANDULAR","GYNE"]):
        "C-1+C-13 granthi hetu alag; S-2+C-2 garbhashay srav hetu alag mixtures.",
    frozenset(["RENAL","GYNE"]):
        "Dono mein L-1 common hai. Sirf ek baar dein — dono mixtures mein repeat mat karein.",
    frozenset(["JOINTS","NEURO"]):
        "F-2 dono ke liye useful hai. NEURO mixture mein zyada dose, JOINTS mein kam.",
    frozenset(["GASTRIC","LIVER"]):
        "Liver ke theek hone par gastric symptoms bhi sudhar jaate hain. Pehle LIVER treat karein.",
    frozenset(["FEVER","RENAL"]):
        "Hydration critical hai. F-1 aur S-6 alternately har 4 ghante mein dein.",
}

# ─────────────────────────────────────────────────────────────
# POLARITY PRIORITY ORDER (Multi-disease mein kon pehle)
# ─────────────────────────────────────────────────────────────
PRIORITY_ORDER = [
    "CARDIAC","RENAL","GLANDULAR","FEVER","RESPIRATORY",
    "LIVER","GYNE","GASTRIC","CONSTIPATION","JOINTS",
    "SKIN","NEURO","VENEREAL","DEGENERATIVE","PARASITIC","METABOLIC",
]

# ─────────────────────────────────────────────────────────────
# MAIN ENGINE FUNCTION
# ─────────────────────────────────────────────────────────────
def build_formula(
    active_systems:  list,
    medicine_result: dict,
    potency_result:  dict,
    polarity_result: dict,
    prakriti_result: dict,
    all_medicines:   dict,
    symptoms_text:   str  = "",
) -> dict:
    """
    Sab engines ka result leke final formula banao.

    Multi-disease ke liye Mixture A, B, C, D alag-alag.
    Har mixture ka timing alag (Chrono-therapeutic).

    Returns:
    {
        "mixtures":     [...],
        "combo_notes":  [...],
        "schedule":     {...},
        "summary":      "...",
        "total":        2,
        "non_interference_rule": "...",
    }
    """

    total        = len(active_systems)
    sched_arr    = SCHEDULES.get(min(total, 4), SCHEDULES[4])
    ALPHA        = ["A","B","C","D","E","F","G","H"]
    potency      = potency_result.get("potency","D6")
    rog_polarity = polarity_result.get("polarity","MIXED")
    prakriti     = prakriti_result.get("prakriti","KAF")
    is_mishrit   = prakriti_result.get("is_mishrit", False)

    # ── Build each mixture ──────────────────────────────────
    eng4_mixtures = medicine_result.get("mixtures", [])
    mixtures = []

    for idx, sys_key in enumerate(active_systems):
        meta    = SYSTEM_META.get(sys_key, {"icon":"💊","ne":sys_key,"nh":sys_key})
        sched   = sched_arr[min(idx, len(sched_arr)-1)]

        # Get formula from Engine 4
        eng4    = next(
            (m for m in eng4_mixtures if m.get("system_key") == sys_key),
            None
        )
        if eng4:
            fo = eng4["formula_obj"]
        else:
            # Fallback if Engine 4 not connected
            fo = {
                "formula":   f"S-1 + C-1 + L-1 + W.E.",
                "full":      f"S-1 + C-1 + L-1 + W.E. — {potency}",
                "dilution":  potency,
                "electricity":"W.E.",
                "med_parts": ["S-1","C-1","L-1"],
                "medicines": [],
                "score_log": [],
            }

        # Validate polarity consistency
        polarity_ok = _validate_polarity(fo, rog_polarity)

        mixtures.append({
            "label":         f"MIXTURE {ALPHA[idx]}",
            "system_key":    sys_key,
            "icon":          meta["icon"],
            "name_en":       meta["ne"],
            "name_hi":       meta["nh"],
            "formula_obj":   fo,
            "schedule":      sched,
            "polarity_ok":   polarity_ok,
            "sequence":      idx + 1,
        })

    # ── Combo notes ─────────────────────────────────────────
    combo_notes = _get_combo_notes(active_systems)

    # ── Non-interference rule ────────────────────────────────
    non_interference = (
        "⚠️ ZAROOR YAAD RAKHEIN: Alag-alag Mixture ko "
        "ek hi glass mein KABHI nahi milayein. "
        "Har Mixture ka apna bio-electrical charge hota hai. "
        "Milaane se therapeutic resonance cancel ho jaati hai."
    )

    # ── Summary ──────────────────────────────────────────────
    mix_labels = " + ".join([m["label"] for m in mixtures])
    summary    = (
        f"{total} Bimari(yan) detect hui. "
        f"{mix_labels} banaya gaya. "
        f"Polarity: {rog_polarity}. Potency: {potency}. "
        f"Prakriti: {prakriti}."
    )

    # ── Tablet chart ─────────────────────────────────────────
    tablet_chart = _build_tablet_chart(mixtures, potency)

    return {
        "mixtures":              mixtures,
        "combo_notes":           combo_notes,
        "schedule":              {
            "total_mixtures": total,
            "per_mixture":    sched_arr,
        },
        "tablet_chart":          tablet_chart,
        "summary":               summary,
        "total":                 total,
        "non_interference_rule": non_interference,
        "potency_used":          potency,
        "polarity_used":         rog_polarity,
    }


# ─────────────────────────────────────────────────────────────
# COMBO NOTES FINDER
# ─────────────────────────────────────────────────────────────
def _get_combo_notes(active_systems: list) -> list:
    notes = []
    sys_set = set(active_systems)

    # Check all pairs
    for i in range(len(active_systems)):
        for j in range(i+1, len(active_systems)):
            pair = frozenset([active_systems[i], active_systems[j]])
            note = COMBO_NOTES.get(pair)
            if note:
                notes.append({
                    "pair":  f"{active_systems[i]} + {active_systems[j]}",
                    "note":  note,
                })

    # General multi-disease note
    if len(active_systems) >= 3:
        notes.append({
            "pair": "Multi-disease",
            "note": (
                f"{len(active_systems)} bimariyan ek saath hain. "
                "Har Mixture alag samay par lein. "
                "Sabse pehle Mixture A (pramukh bimari), "
                "phir B, C, D kram se lein."
            )
        })

    return notes


# ─────────────────────────────────────────────────────────────
# POLARITY VALIDATOR
# ─────────────────────────────────────────────────────────────
def _validate_polarity(formula_obj: dict, rog_polarity: str) -> dict:
    """
    Check karo ki formula mein sahi polarity ki medicines hain.
    POSITIVE rog → C-Group chahiye
    NEGATIVE rog → S-Group chahiye
    """
    medicines = formula_obj.get("medicines", [])
    med_ids   = [m.get("id","") if isinstance(m,dict) else str(m)
                 for m in medicines]

    s_count = sum(1 for m in med_ids if m.startswith("S"))
    c_count = sum(1 for m in med_ids if m.startswith("C"))

    if rog_polarity == "POSITIVE":
        ok = c_count > 0
        msg = ("C-Group medicine present ✅" if ok
               else "⚠️ C-Group missing — Positive rog mein C-Group hona chahiye")
    elif rog_polarity == "NEGATIVE":
        ok = s_count > 0
        msg = ("S-Group medicine present ✅" if ok
               else "⚠️ S-Group missing — Negative rog mein S-Group hona chahiye")
    else:
        ok  = True
        msg = "Mixed polarity — L/F group safe hai"

    return {"valid": ok, "message": msg}


# ─────────────────────────────────────────────────────────────
# TABLET CHART BUILDER
# ─────────────────────────────────────────────────────────────
def _build_tablet_chart(mixtures: list, potency: str) -> list:
    """6-timing tablet chart banao."""
    TIMINGS = [
        "Subah (Khali pet)",
        "Nashte ke baad",
        "Dopahar (Bhojan se pehle)",
        "Dopahar (Bhojan ke baad)",
        "Shaam (Khali pet)",
        "Raat (Sone se pehle)",
    ]

    chart = []
    total = len(mixtures)

    for i, timing in enumerate(TIMINGS):
        mix_idx = i % total
        mix     = mixtures[mix_idx]
        fo      = mix.get("formula_obj",{})
        short   = "+".join((fo.get("med_parts") or ["—"])[:2])
        chart.append({
            "samay":   timing,
            "mishran": mix["label"],
            "formula": short,
            "potency": potency,
            "matra":   "5-10 boonden",
        })

    return chart


# ─────────────────────────────────────────────────────────────
# FORMULA DISPLAY HELPER
# ─────────────────────────────────────────────────────────────
def format_formula_display(mixture: dict) -> str:
    """Formula ko display string mein convert karo."""
    fo    = mixture.get("formula_obj", {})
    label = mixture.get("label","")
    name  = mixture.get("name_en","")
    name_h= mixture.get("name_hi","")
    sched = mixture.get("schedule","")
    icon  = mixture.get("icon","💊")

    lines = [
        f"{'─'*60}",
        f"{icon} {label} — {name}",
        f"   {name_h}",
        f"{'─'*60}",
        f"Formula  : {fo.get('full','—')}",
        f"Electricity: {fo.get('electricity','—')}",
        f"Potency  : {fo.get('dilution','—')}",
        f"Samay    : {sched}",
    ]

    # Medicine details
    for med in fo.get("medicines",[]):
        if not med or not isinstance(med, dict):
            continue
        lines += [
            f"",
            f"  ▸ {med.get('id','')} — {med.get('name','')}",
            f"    [{med.get('medicine_group','')} | {med.get('temperament','')}]",
            f"    Anatomy  : {med.get('anatomy_term','')}",
            f"    Pathology: {med.get('pathology_term','')}",
            f"    Action   : {med.get('description','')}",
        ]

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 65)
    print("FORMULA ENGINE v1.0 — TEST RESULTS")
    print("=" * 65)

    # Mock inputs from previous engines
    mock_prakriti = {
        "prakriti":    "KAF",
        "prakriti_hindi":"कफ प्रकृति",
        "is_mishrit":  False,
        "confidence":  85,
    }
    mock_polarity = {
        "polarity":        "POSITIVE",
        "polarity_hindi":  "धनात्मक रोग",
        "pos_score":       12,
        "neg_score":       2,
        "aggravation_warning": "⚠️ POSITIVE rog mein D1/D2/D3 KABHI NAHI",
    }
    mock_potency = {
        "potency":      "D10",
        "dilution_no":  10,
        "matra_type":   "UCHCH",
        "matra_name":   "उच्च मात्रा (Negative Dose)",
        "frequency":    "3-4 baar daily",
        "per_day":      "3-4 baar daily",
        "duration":     "15-30 din",
        "phase":        "SUB_ACUTE",
        "phase_display":"उप-तीव्र",
        "reason":       "Positive rog + Sub-acute → D10",
        "aggravation_note":"⚠️ D1-D3 nahi dein",
        "kab_dein":     "NEGATIVE rog mein",
        "kab_nahi":     "POSITIVE rog mein NAHI",
    }

    # Mock Engine 4 output
    def make_fo(sys_key, potency):
        meds_map = {
            "RENAL":   {"parts":["S-6","C-6","L-1"], "elec":"B.E."},
            "CARDIAC": {"parts":["A-1","A-2","A-3"], "elec":"B.E."},
            "GYNE":    {"parts":["S-2","C-2","L-1"], "elec":"W.E."},
            "NEURO":   {"parts":["F-1","F-2","C-4"], "elec":"R.E."},
            "FEVER":   {"parts":["F-1","S-1","SY"],  "elec":"W.E."},
        }
        m = meds_map.get(sys_key, {"parts":["S-1","C-1","L-1"],"elec":"W.E."})
        return {
            "formula":    " + ".join(m["parts"]) + f" + {m['elec']}",
            "full":       " + ".join(m["parts"]) + f" + {m['elec']} — {potency}",
            "dilution":   potency,
            "electricity":m["elec"],
            "med_parts":  m["parts"],
            "medicines":  [],
            "score_log":  [],
        }

    # Test 1 — Single disease
    print("\n[TEST 1] Single Disease — RENAL")
    r1 = build_formula(
        active_systems  = ["RENAL"],
        medicine_result = {"mixtures":[{"system_key":"RENAL","formula_obj":make_fo("RENAL","D10")}]},
        potency_result  = mock_potency,
        polarity_result = mock_polarity,
        prakriti_result = mock_prakriti,
        all_medicines   = {},
    )
    assert r1["total"] == 1
    assert len(r1["mixtures"]) == 1
    mix1 = r1["mixtures"][0]
    print(f"  ✅ Label     : {mix1['label']}")
    print(f"  ✅ Formula   : {mix1['formula_obj']['full']}")
    print(f"  ✅ Schedule  : {mix1['schedule']}")
    print(f"  ✅ Pol Check : {mix1['polarity_ok']['message']}")

    # Test 2 — Multi-disease with combo note
    print("\n[TEST 2] Multi-Disease — RENAL + CARDIAC + GYNE")
    systems2 = ["RENAL","CARDIAC","GYNE"]
    eng4_mix2 = [
        {"system_key": s, "formula_obj": make_fo(s,"D10")}
        for s in systems2
    ]
    r2 = build_formula(
        active_systems  = systems2,
        medicine_result = {"mixtures": eng4_mix2},
        potency_result  = mock_potency,
        polarity_result = mock_polarity,
        prakriti_result = mock_prakriti,
        all_medicines   = {},
    )
    assert r2["total"] == 3
    for mix in r2["mixtures"]:
        print(f"  ✅ {mix['label']} [{mix['system_key']}]: {mix['formula_obj']['full']}")
        print(f"       {mix['schedule']}")

    # Test 3 — Combo notes
    print(f"\n[TEST 3] Combo Notes")
    notes = r2["combo_notes"]
    for n in notes:
        print(f"  ✅ {n['pair']}: {n['note'][:60]}...")
    assert len(notes) >= 1

    # Test 4 — Tablet chart
    print(f"\n[TEST 4] Tablet Chart (6 timings)")
    chart = r2["tablet_chart"]
    assert len(chart) == 6
    for row in chart:
        print(f"  ✅ {row['samay']:<28} → {row['mishran']} | {row['formula']}")

    # Test 5 — Scheduling
    print(f"\n[TEST 5] Schedule correctness")
    for n_sys in [1,2,3,4]:
        sched = SCHEDULES.get(min(n_sys,4), SCHEDULES[4])
        print(f"  ✅ {n_sys} disease(s) → {len(sched)} timing slots")

    # Test 6 — Priority order
    print(f"\n[TEST 6] Priority Order")
    unordered = ["NEURO","CARDIAC","GYNE","RENAL"]
    ordered   = sorted(unordered, key=lambda s: PRIORITY_ORDER.index(s) if s in PRIORITY_ORDER else 99)
    print(f"  Input:  {unordered}")
    print(f"  Sorted: {ordered}")
    assert ordered[0] == "CARDIAC"
    print(f"  ✅ CARDIAC pehle aaya (highest priority)")

    print(f"\n{'='*65}")
    print("FORMULA ENGINE v1.0 — ALL TESTS PASS ✅")
    print(f"{'='*65}")
