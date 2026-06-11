"""
╔══════════════════════════════════════════════════════════════╗
║  PARCHA ENGINE v1.0  (Engine 9 of 9 — FINAL)               ║
║  E.H. Arogya Sutra — Complete Prescription Generator        ║
║                                                              ║
║  Connects: All 8 Engines → Final Clinical Prescription      ║
║                                                              ║
║  9 Sections:                                                 ║
║  1. Rogi ki Jankari        (Patient Profile)                 ║
║  2. AI Reasoning           (Symptom Analysis)                ║
║  3. Spagyric Formula       (All Mixtures)                    ║
║  4. Tablet Chart           (6-timing schedule)               ║
║  5. Potency ka Chunaav     (Why this dilution)               ║
║  6. Dawa Banane ki Vidhi   (Step-by-step)                    ║
║  7. Matra aur Samay        (Dosage protocol)                 ║
║  8. Parhiz                 (Diet + Lifestyle)                ║
║  9. Safety + Agli Jaanch   (Safety + Follow-up)              ║
╚══════════════════════════════════════════════════════════════╝
"""

from datetime import datetime

CLINIC_NAME    = "E.H. AROGYA SUTRA CLINIC"
CLINIC_ADDRESS = "Jagdamba Clinic, Seoni M.P."
VERSION        = "v4.0 — EH AI System"
ALPHA          = ["A","B","C","D","E","F","G","H"]

# ─────────────────────────────────────────────────────────────
# ELECTRICITY DESCRIPTIONS
# ─────────────────────────────────────────────────────────────
ELEC_DESC = {
    "W.E.": "White Electricity — Systemic neutral stabilizer (Trophic)",
    "R.E.": "Red Electricity   — Stimulant, nerve energizer (Positive)",
    "Y.E.": "Yellow Electricity— Sedative, anti-spasmodic (Negative)",
    "B.E.": "Blue Electricity  — Venous constrictor, anti-edema",
    "G.E.": "Green Electricity — Anti-toxic, blood purifier",
}

# ─────────────────────────────────────────────────────────────
# SECTION BUILDERS
# ─────────────────────────────────────────────────────────────

def _sec_header(num: int, title: str) -> list:
    return [
        f"╔══════════════════════════════════════════════════════════╗",
        f"║  SECTION {num}: {title:<50}║",
        f"╚══════════════════════════════════════════════════════════╝",
    ]


def build_sec1_patient(patient: dict, prakriti: dict,
                        polarity: dict) -> list:
    """SECTION 1 — Rogi ki Jankari"""
    L = []
    A = L.append
    L += _sec_header(1, "ROGI KI JANKARI (Patient Profile)")
    A(f"  Naam       : {patient.get('name') or '—'}")
    A(f"  Umra       : {patient.get('age') or '—'} Saal")
    A(f"  Ling       : {patient.get('gender') or '—'}")
    A(f"  BP         : {patient.get('bp_systolic','?')}/{patient.get('bp_diastolic','?')} mmHg")
    A(f"  Rog Prakriti: {patient.get('nature','neutral').upper()}")
    A("")
    A(f"  MIZAJ (Temperament):")
    A(f"  {prakriti.get('prakriti_hindi','—')} ({prakriti.get('prakriti_english','—')})")
    A(f"  Aadhar: {prakriti.get('reasoning','—')}")
    A(f"  Mishrit: {'Haan — L-1 add kiya gaya' if prakriti.get('is_mishrit') else 'Nahi'}")
    A("")
    A(f"  ROG PRAKRITI (Disease Polarity):")
    A(f"  {polarity.get('polarity_hindi','—')} | Pos Score: {polarity.get('pos_score',0)} | "
      f"Neg Score: {polarity.get('neg_score',0)}")
    A(f"  {polarity.get('aggravation_warning','')}")
    A("")
    A(f"  MUKHYA LAKSHAN:")
    A(f"  {patient.get('symptoms','—')}")
    return L


def build_sec2_reasoning(polarity: dict, prakriti: dict,
                          logs: list, active_systems: list) -> list:
    """SECTION 2 — AI Clinical Reasoning"""
    L = []
    A = L.append
    L += _sec_header(2, "AI NAIDANIK VIVECHNA (Clinical Reasoning)")
    A("  Step 1 — Symptom Parsing:")
    for log in (logs or [])[:10]:
        if log.get("type") == "phrase":
            A(f"    ✅ Phrase: \"{log.get('found','')}\" → {log.get('cat','')}")
        else:
            A(f"    ✏️  \"{log.get('found','')}\" ≈ \"{log.get('matched','')}\" → [{log.get('cat','')}]")
    A("")
    A("  Step 2 — Active Disease Systems:")
    for i, s in enumerate(active_systems or []):
        A(f"    {i+1}. {s}")
    A("")
    A("  Step 3 — Mattei Polarity Law Applied:")
    pol = polarity.get("polarity","MIXED")
    if pol == "POSITIVE":
        A("    POSITIVE rog → Ang adhik kaam kar raha hai")
        A("    → NEGATIVE medicine (C-Group) + NEGATIVE dose (D6+) deni chahiye")
    elif pol == "NEGATIVE":
        A("    NEGATIVE rog → Ang kam kaam kar raha hai")
        A("    → POSITIVE medicine (S-Group) + POSITIVE dose (D1-D3) deni chahiye")
    else:
        A("    MIXED rog → D4/D5 (Neutral) se shuru karein")
    A("")
    A(f"  Step 4 — Prakriti Aadharit Medicine:")
    pk = prakriti.get("prakriti","KAF")
    pk_med = {"KAF":"S-Group","RAKT":"A-Group","PITT":"S5","VAAT":"S1+F1+F2","MIXED":"L-Group"}
    A(f"    {prakriti.get('prakriti_hindi',pk)} → {pk_med.get(pk,'S-Group')} boost")
    A(f"    Book Rule: {prakriti.get('reasoning','')[:80]}")
    return L


def build_sec3_formula(mixtures, formula, potency_result, dosage_result):
    """
    SIMPLE, SAAF formula section.
    Doctor ko seedhi jankari — koi extra data nahi.
    """
    L = []
    A = L.append

    A("╔══════════════════════════════════════════════════════════╗")
    A("║  SECTION 3: AUSHADHI FORMULA (Spagyric Prescription)   ║")
    A("╚══════════════════════════════════════════════════════════╝")
    A(f"  Kul Mishran  : {len(mixtures)}")
    A(f"  {formula.get('non_interference_rule','')}")
    A("")

    ALPHA = ["A","B","C","D","E","F"]

    for idx, mix in enumerate(mixtures):
        fo     = mix.get("formula_obj", mix.get("fo", {}))
        icon   = mix.get("icon", "💊")
        ne     = mix.get("name_en", mix.get("ne", ""))
        nh     = mix.get("name_hi", mix.get("nh", ""))
        elec   = fo.get("electricity", "W.E.")
        pot    = fo.get("dilution", potency_result.get("potency","—"))
        sched  = mix.get("schedule", "—")
        drops  = dosage_result.get("matra","10 boonden")

        A(f"  {'━'*58}")
        A(f"  {icon}  MIXTURE {ALPHA[idx]}  —  {nh}")
        A(f"       {ne}")
        A(f"  {'━'*58}")
        A("")

        # ── Formula (saaf, bada dikhao) ──
        parts   = fo.get("med_parts", [])
        formula_str = " + ".join(parts) + f" + {elec}"
        A(f"  📐 FORMULA  :  {formula_str}")
        A(f"  🧪 POTENCY  :  {pot}")
        A("")

        # ── Dose + Timing ──
        A(f"  💧 MATRA    :  {drops}  —  aadha cup gungune paani mein")
        A(f"  🕐 SAMAY    :  {sched}")
        A("")

        # ── Simple kaam explanation ──
        A(f"  ⚕️  YEH FORMULA KYA KAREGA:")
        meds = fo.get("medicines", [])
        for med in meds:
            if not med or not isinstance(med, dict):
                continue
            mid   = med.get("id","")
            kaam  = _get_medicine_kaam(mid)
            A(f"  ▸ {mid:>5}  →  {kaam}")

        elec_kaam = _get_electricity_kaam(elec)
        A(f"  ▸ {elec:>5}  →  {elec_kaam}")
        A("")

        # ── Polarity check ──
        pol_ok = mix.get("polarity_ok", {})
        if pol_ok.get("message"):
            A(f"  ✅ {pol_ok['message']}")
        A("")

    # Combo notes (simple)
    combo = formula.get("combo_notes", [])
    if combo:
        A("  ⚠️  VISHESH NIRDESH:")
        for cn in combo:
            A(f"  •  {cn.get('note','')}")
        A("")

    return L


# ─── Medicine ka simple kaam — ek line mein ───────────────────
def _get_medicine_kaam(med_id: str) -> str:
    """Har medicine ka ek line mein saaf kaam."""
    try:
        from reasoning_engine import MEDICINE_KAAM
        return MEDICINE_KAAM.get(med_id, f"{med_id} — targeted organ par kaam karega")
    except ImportError:
        # Fallback if reasoning_engine not found
        KAAM = {
            # S-Group
            "S1":   "Poore sharir ki lymph safai + jeevan urja badhayega",
            "S2":   "Garbhashay ki mucosal safai → safed pani band karega",
            "S3":   "Khoon mein zeher saaf → tvacha ke daane theek honge",
            "S5":   "Yakrit (liver) jagayega → pitt sahi bnega → gas door",
            "S6":   "Gurde ki chhanane ki shakti badhega → sujan utaregi",
            "S10":  "Pet ki gas + acidity theek karega → khana pachayega",
            "S11":  "Pancreas ke enzyme badhayega → digestion sudharega",
            "S12":  "Aant ki harkat badhayega → kabjiyat door karega",
            # C-Group
            "C1":   "Ganth aur giltiyan naram → dheere pighlayega",
            "C2":   "Garbhashay ki deewar repair → discharge band",
            "C3":   "Tvacha ke purane daane aur eczema ko gehrai se theek",
            "C4":   "Reedh + dimag ki naadi mazboot karega",
            "C5":   "Liver ke zamav door + portal circulation theek",
            "C6":   "Gurde ki sujan + jalan door karega",
            "C10":  "Badi aant ki sujan theek → mucous stool band",
            "C13":  "Seene ya glandular ganth naram → pighlayega",
            "C15":  "Toot-phooti cells ki jagah naye healthy cells banayega",
            "C17":  "Aant ke purane ghaav theek karega",
            # A-Group
            "A1":   "Dhamniyon ki akadahat door → BP normal karega",
            "A2":   "Chhhoti nadiyon mein pravaah theek → BP balance",
            "A3":   "Shiron (veins) ko mazboot → varicose veins door",
            # P-Group
            "P1":   "Pleura + seene ka dard door karega",
            "P2":   "Galey ki sujan + khansi door karega",
            "P3":   "Seene ki lymph safai + bhaari pan door",
            "P4":   "Phephdon ka rasta khulega → khansi + dama theek",
            # F-Group
            "F1":   "Bukhar shant karega + badan + kamar ka dard door",
            "F2":   "Jhunjhuni + shooting pain + sciatica door karega",
            # Others
            "L1":   "Poore sharir ki lymph naliyan saaf → sujan utaregi",
            "Ver1": "Aant ke kide (parasites) saaf karega",
            "Ver2": "Kide ke zeher door + aant repair karega",
            "Ven1": "Gupt rog + jalan + mucosal inflammation door",
            "S-Lass":"Aant ki harkat jagayega → sahaj shaucha hoga",
            "APP":  "Tvacha ki surface theek karega",
            "SY":   "Poore sharir ki jeevan urja rebuild karega",
        }
        return KAAM.get(med_id, f"{med_id} — targeted organ par kaam karega")


def _get_electricity_kaam(elec: str) -> str:
    """Electricity ka ek line mein kaam."""
    EKAAM = {
        "W.E.": "Nervous system balance karega — dono sides safe",
        "R.E.": "Kamzor angon mein urja bharega — circulation tez",
        "Y.E.": "Sujan + dard + spasm shant karega",
        "B.E.": "Nadiyon se excess fluid nikaalega → BP + sujan kam",
        "G.E.": "Khoon saaf karega → tvacha + lymph zeher bahar",
    }
    return EKAAM.get(elec, f"{elec} — therapeutic electrical action")


def build_sec4_tablet_chart(tablet_chart: list, dosage: dict) -> list:
    """SECTION 4 — Tablet Chart"""
    L = []
    A = L.append
    L += _sec_header(4, "TABLET CHART — DIN KA SCHEDULE")
    A("")
    A(f"  {'Samay':<28} {'Mishran':<12} {'Formula':<16} {'Potency':<8} Matra")
    A(f"  {'─'*70}")
    for row in (tablet_chart or []):
        samay = row.get("samay_hi", row.get("samay","—"))
        A(
            f"  {samay:<28} {row.get('mishran','—'):<12} "
            f"{row.get('formula','—'):<16} {row.get('potency','—'):<8} "
            f"{row.get('matra','5 boonden')}"
        )
    A("")
    A(f"  Paani: {dosage.get('water', 'Aadha cup gunguna paani')}")
    A(f"  ⚠️  Thanda paani bilkul nahi — therapeutic resonance disturb hoti hai")
    return L


def build_sec5_potency(potency: dict, polarity: dict) -> list:
    """SECTION 5 — Potency ka Chunaav"""
    L = []
    A = L.append
    L += _sec_header(5, "POTENCY KA CHUNAAV AUR KARAN")
    A(f"  Chuni Gayi Potency : {potency.get('potency','—')}")
    A(f"  Matra Prakar       : {potency.get('matra_name','—')}")
    A(f"  Awastha (Phase)    : {potency.get('phase_display','—')}")
    A("")
    A(f"  KARAN (Why this potency):")
    reason = potency.get("reason","")
    for ln in reason.split(". "):
        if ln.strip():
            A(f"  {ln.strip()[:70]}")
    A("")
    A(f"  Yeh Kab Dein : {potency.get('kab_dein','—')}")
    A(f"  Yeh Kab NAHI : {potency.get('kab_nahi','—')}")
    A(f"  {potency.get('aggravation_note','')}")
    A("")
    A("  MATTEI KA POLARITY NIYAM (Book Pages 9-10):")
    pol = polarity.get("polarity","MIXED")
    if pol == "POSITIVE":
        A("  Dhnatmak rog = Ang ka kaam ADHIK hai")
        A("  → Ṛṇātmak aushadhi + Uchch matra (D6+) → Adhik kriya SHANT hogi")
        A("  ❌ D1/D2/D3 KABHI NAHI → AGGRAVATION hoga")
    elif pol == "NEGATIVE":
        A("  Ṛṇātmak rog = Ang ka kaam KAM hai")
        A("  → Dhnatmak aushadhi + Teevra matra (D1-D3) → Mand kriya JAGEGI")
        A("  ❌ D30/D100 KABHI NAHI → AGGRAVATION hoga")
    else:
        A("  Mishrit rog — D4/D5 (Neutral) se shuru karein")
    return L


def build_sec6_dawa_vidhi(potency: dict, mixtures: list) -> list:
    """SECTION 6 — Dawa Banane ki Vidhi"""
    L = []
    A = L.append
    L += _sec_header(6, "DAWA BANANE KI VIDHI (Step-by-Step)")
    A("  1:9 Anupaat — Decimal Scale (Book Page 17)")
    A("")

    vidhi_raw = potency.get("dilution_vidhi","")
    if vidhi_raw:
        for ln in vidhi_raw.split("\n"):
            A(f"  {ln}")
    else:
        # Build from first mixture
        if mixtures:
            fo    = mixtures[0].get("formula_obj", mixtures[0].get("fo",{}))
            meds  = fo.get("med_parts", [])
            pot   = fo.get("dilution","D6")
            A(f"  Step 1 : 30ml saaf kaanch ki shishi lein")
            for i, med in enumerate(meds[:3], 2):
                A(f"  Step {i} : {med} ki 5 boonden daalen")
            n = len(meds[:3]) + 2
            A(f"  Step {n} : Baaki hissa Distilled Water se bharein")
            A(f"  Step {n+1}: 100 baar mazboot strokes dein = D1 taiyar")
            try:
                d = int(pot.replace("D",""))
            except Exception:
                d = 6
            if d > 1:
                A(f"  D1 se {pot} banane ke liye yahi process {d} baar dohrayen")
    A("")
    A("  ✅ Sirf Distilled Water use karein")
    A("  ✅ Saaf kaanch ki shishi zaroor")
    A("  ✅ 100 strokes zaroor dein")
    A("  ❌ Nal ka paani KABHI NAHI")
    return L


def build_sec7_dosage(dosage: dict) -> list:
    """SECTION 7 — Matra aur Samay"""
    L = []
    A = L.append
    L += _sec_header(7, "MATRA AUR SAMAY — DOSAGE PROTOCOL")
    A(f"  Matra (Drops) : {dosage.get('matra','—')}  ({dosage.get('matra_note','')})")
    A(f"  Frequency     : {dosage.get('frequency','—')}  ({dosage.get('gap_between','')})")
    A(f"  Timing        : {dosage.get('timing','—')}")
    A(f"  Avadhi (Min)  : {dosage.get('duration_min','—')}")
    A(f"  Avadhi (Max)  : {dosage.get('duration_max','—')}")
    A(f"  Dhyan         : {dosage.get('duration_note','—')}")
    A("")
    A("  PAANI NIYAM:")
    pr = dosage.get("paani_rules", {})
    A(f"  ✅ {pr.get('standard','Aadha cup gunguna paani')}")
    A(f"  ❌ {pr.get('avoid','Thanda paani bilkul nahi')}")
    A(f"  📋 {pr.get('method','')}")
    A(f"  ⏰ {pr.get('timing','')}")
    A("")
    if dosage.get("special_notes"):
        A("  ⚠️ VISHESH NIRDESH:")
        for sn in dosage["special_notes"]:
            A(f"  [{sn['system']}]: {sn['note']}")
    return L


def build_sec8_diet(diet: dict) -> list:
    """SECTION 8 — Parhiz"""
    L = []
    A = L.append
    L += _sec_header(8, "PARHIZ — PATHYA AUR APATHYA")
    A(f"  {diet.get('title','')}")
    A(f"  {diet.get('principle','')}")
    A("")
    A("  ✅ ZAROOR KHAYEN (PATHYA):")
    A(f"  {'─'*55}")
    for item in (diet.get("pathya") or [])[:15]:
        A(f"  • {item['item']:<30} → {item['reason']}")
    A("")
    A("  ❌ BILKUL NAHI KHAYEN (APATHYA):")
    A(f"  {'─'*55}")
    for item in (diet.get("apathya") or [])[:12]:
        A(f"  • {item['item']:<30} → {item['reason']}")
    A("")
    A("  🌿 JEEVAN SHAILI (Lifestyle):")
    for tip in (diet.get("lifestyle") or []):
        A(f"  • {tip}")
    return L


def build_sec9_safety_followup(safety: dict, active_systems: list,
                                potency: dict) -> list:
    """SECTION 9 — Safety + Agli Jaanch"""
    L = []
    A = L.append
    L += _sec_header(9, "SURAKSHA + AGLI JAANCH (Safety + Follow-up)")

    # Safety status
    status = safety.get("overall_status","SAFE")
    A(f"  Safety Status : {status}")
    A(f"  {safety.get('summary','')}")
    A("")

    # Critical errors
    if safety.get("critical_errors"):
        A("  🚨 CRITICAL ERRORS:")
        for e in safety["critical_errors"]:
            A(f"  [{e.get('id','')}] {e.get('message','')}")
            A(f"  Fix: {e.get('fix','')}")
        A("")

    # Warnings (top 3)
    if safety.get("warnings"):
        A("  ⚠️ CHETAVANIYAN (Warnings):")
        for w in safety["warnings"][:4]:
            A(f"  • {w.get('message','')}")
        A("")

    # Auto-correction note
    ac = safety.get("auto_correction",{})
    if ac.get("corrected"):
        A(f"  ✅ AUTO-SUDHAR: {ac['original']} → {ac['potency']}")
        A(f"  {ac.get('note','')}")
        A("")

    # Adjustment guide
    A("  📋 LABH RUK JAYE TO (Adjustment Guide):")
    for adj in (safety.get("adjustment_guide") or []):
        A(f"  • Rule {adj.get('rule_no','')}: {adj.get('situation','')}")
        A(f"    → {adj.get('action','')}")
    A("")

    # Antidote
    ant = safety.get("antidote_ready") or {}
    if not ant:
        from safety_engine import ANTIDOTE_RULES
        ant = ANTIDOTE_RULES["AGGRAVATION_OCCURRED"]
    A("  🆘 AGGRAVATION HONE PAR (Antidote):")
    A(f"  • {ant.get('name',ant.get('antidote','Nimbu-Sirka'))}")
    A(f"  • Tarika: {ant.get('method','')}")
    A(f"  • Samay : {ant.get('timing','Turant dein')}")
    A(f"  • Vikalp: {ant.get('alternative','Viprit dose')}")
    A("")

    # Mixture safety reminder
    A("  ℹ️ MIXTURE NIYAM:")
    A("  ⚠️ Alag-alag Mixture ek glass mein KABHI nahi milayein.")
    A("  ✅ Har Mixture ke beech 2-3 ghante ka antar zaroor rakhein.")
    A("")

    # Follow-up
    A("  📅 AGLI JAANCH (Follow-up Plan):")
    phase = potency.get("phase","CHRONIC")
    follow = {
        "ACUTE":        "7 din mein dobara aayen",
        "SUB_ACUTE":    "15 din mein dobara aayen",
        "CHRONIC":      "30 din mein dobara aayen",
        "DEGENERATIVE": "15 din mein dobara aayen",
    }.get(phase, "15 din mein dobara aayen")
    A(f"  • {follow}")
    A(f"  • Koi nayi takleef ho to turant sampark karein")
    A(f"  • Dawa beech mein kabhi band nahi karni — niyamit leni hai")
    return L


# ─────────────────────────────────────────────────────────────
# HEADER + FOOTER
# ─────────────────────────────────────────────────────────────
def build_header(patient: dict, now: datetime) -> list:
    dt = now.strftime("%d %B %Y, %I:%M %p")
    name = patient.get("name") or "—"
    return [
        "━"*68,
        f"  ⚕  {CLINIC_NAME}",
        f"     {CLINIC_ADDRESS}",
        f"     {VERSION}",
        "━"*68,
        f"  AI NAIDANIK PARCHA (EH Clinical Prescription)",
        f"  Tanukaran Vidhi: Decimal Scale (1:9)",
        f"  Data: electrohomeopathy.db + Wikipedia FREE API",
        f"  Tarikh: {dt}",
        "━"*68,
        "",
    ]


def build_footer() -> list:
    return [
        "",
        "━"*68,
        f"  ⚕  {CLINIC_NAME}  |  {CLINIC_ADDRESS}",
        "  ⚖️  DISCLAIMER: AI-assisted EH support tool.",
        "     Registered EH Physician se zaroor verify karein.",
        "     Yeh parcha kewal EH chikitsa ke liye hai.",
        "━"*68,
    ]


# ─────────────────────────────────────────────────────────────
# MAIN PARCHA GENERATOR
# ─────────────────────────────────────────────────────────────
def generate_parcha(
    patient:         dict,
    prakriti_result: dict,
    polarity_result: dict,
    potency_result:  dict,
    formula_result:  dict,
    safety_result:   dict,
    dosage_result:   dict,
    diet_result:     dict,
    active_systems:  list,
    logs:            list,
) -> str:
    """
    Sab engines ka output leke complete 9-section parcha banao.

    Returns: Complete prescription as formatted string
    """
    now      = datetime.now()
    mixtures = formula_result.get("mixtures", [])
    tablet   = dosage_result.get("daily_schedule",
                formula_result.get("tablet_chart", []))

    lines = []
    lines += build_header(patient, now)
    lines += build_sec1_patient(patient, prakriti_result, polarity_result)
    lines += [""]
    lines += build_sec2_reasoning(polarity_result, prakriti_result,
                                   logs, active_systems)
    lines += [""]
    lines += build_sec3_formula(mixtures, formula_result, potency_result, dosage_result)
    lines += [""]
    lines += build_sec4_tablet_chart(tablet, dosage_result)
    lines += [""]
    lines += build_sec5_potency(potency_result, polarity_result)
    lines += [""]
    lines += build_sec6_dawa_vidhi(potency_result, mixtures)
    lines += [""]
    lines += build_sec7_dosage(dosage_result)
    lines += [""]
    lines += build_sec8_diet(diet_result)
    lines += [""]
    lines += build_sec9_safety_followup(safety_result, active_systems,
                                         potency_result)
    lines += build_footer()

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# QUICK PARCHA — Without all engines (minimal input)
# ─────────────────────────────────────────────────────────────
def generate_quick_parcha(
    patient_name:    str,
    age:             int,
    gender:          str,
    bp_systolic:     int,
    bp_diastolic:    int,
    symptoms:        str,
    polarity:        str,
    potency:         str,
    mixtures_text:   list,
    nature:          str = "chronic",
) -> str:
    """Quick parcha when full engine results not available."""
    now = datetime.now()
    dt  = now.strftime("%d %B %Y, %I:%M %p")
    lines = [
        "━"*68,
        f"  ⚕  {CLINIC_NAME}",
        f"     {CLINIC_ADDRESS}",
        "━"*68,
        f"  Naam  : {patient_name}",
        f"  Umra  : {age} Saal  |  Ling: {gender}",
        f"  BP    : {bp_systolic}/{bp_diastolic} mmHg",
        f"  Prakriti: {nature.upper()}",
        f"  Lakshan: {symptoms}",
        "",
        f"  ROG   : {polarity}",
        f"  POTENCY: {potency}",
        "",
        "  FORMULA:",
    ]
    for i, m in enumerate(mixtures_text):
        lines.append(f"  MIXTURE {ALPHA[i]}: {m}")
    lines += [
        "",
        f"  Tarikh: {dt}",
        "━"*68,
    ]
    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 68)
    print("PARCHA ENGINE v1.0 — TEST RESULTS")
    print("=" * 68)

    # Mock all engine results
    mock_patient = {
        "name":"Ramesh Kumar","age":"45","gender":"Male",
        "bp_systolic":155,"bp_diastolic":95,
        "nature":"chronic","symptoms":"BP high hai sujan hai tej dhadkan kamar dard",
    }
    mock_prakriti = {
        "prakriti":"KAF","prakriti_hindi":"कफ प्रकृति",
        "prakriti_english":"Lymphatic Temperament",
        "is_mishrit":False,"confidence":85,
        "reasoning":"Kaf prakriti — lymphatic symptoms + gender default",
    }
    mock_polarity = {
        "polarity":"POSITIVE","polarity_hindi":"धनात्मक रोग",
        "pos_score":12,"neg_score":2,
        "aggravation_warning":"⚠️ POSITIVE rog mein D1/D2/D3 KABHI NAHI",
    }
    mock_potency = {
        "potency":"D30","dilution_no":30,"matra_type":"UCHCH",
        "matra_name":"उच्च मात्रा (Negative Dose)",
        "frequency":"2-3 baar daily","per_day":"2-3 baar",
        "duration":"3 mahine","phase":"CHRONIC",
        "phase_display":"पुराना (Chronic — 61-730 din)",
        "reason":"Positive rog + Chronic phase → D30",
        "aggravation_note":"⚠️ D1-D3 KABHI NAHI",
        "kab_dein":"NEGATIVE rog mein","kab_nahi":"POSITIVE rog mein NAHI",
        "dilution_vidhi":"D30 banane ki vidhi:\nStep 1: 30ml shishi\nStep 2: S-6 ki 5 boonden\n...",
    }

    def mock_fo(parts, elec, dil):
        return {
            "formula":    " + ".join(parts) + f" + {elec}",
            "full":       " + ".join(parts) + f" + {elec} — {dil}",
            "dilution":   dil,"electricity":elec,
            "med_parts":  parts,
            "medicines":  [
                {"id":p,"name":p,"medicine_group":"S-Group","temperament":"Lymphatic",
                 "anatomy_term":"Sample Anatomy","anatomy_details":"Sample anatomy detail from Wikipedia.",
                 "pathology_term":"Sample Pathology","pathology_details":"Sample pathology detail.",
                 "description":"Sample EH action for this medicine."}
                for p in parts[:2]
            ],
        }

    mock_formula = {
        "mixtures": [
            {"label":"MIXTURE A","system_key":"CARDIAC","icon":"❤️",
             "name_en":"Cardiovascular Balancer","name_hi":"हृदय नियामक",
             "formula_obj":mock_fo(["A-1","A-2","A-3"],"B.E.","D30"),
             "schedule":"Subah khali pet","polarity_ok":{"message":"C-Group present ✅"},
             "te":"BP normalize karna","th":"रक्तचाप नियंत्रण"},
            {"label":"MIXTURE B","system_key":"RENAL","icon":"💧",
             "name_en":"Renal Fluid Filtration","name_hi":"वृक्क शोधक",
             "formula_obj":mock_fo(["S-6","C-6","L-1"],"B.E.","D30"),
             "schedule":"Dopahar bhojan ke baad","polarity_ok":{"message":"C-Group present ✅"},
             "te":"Kidney filtration badhana","th":"वृक्क निस्पंदन"},
        ],
        "combo_notes":[{"pair":"CARDIAC+RENAL","note":"Namak band. B.E. sirf Mixture A mein."}],
        "non_interference_rule":"⚠️ Alag-alag Mixture ek glass mein KABHI nahi milayein.",
        "tablet_chart":[],
    }

    mock_safety = {
        "overall_status":"WARNING","is_safe":True,
        "summary":"⚠️ 2 warnings. Treatment safe hai.",
        "critical_errors":[],"warnings":[
            {"type":"BP_HIGH","level":"HIGH",
             "message":"⚠️ BP 155/95 — Zyada. CARDIAC zaroor dein.",
             "fix":"CARDIAC add karein."},
        ],
        "auto_correction":{"corrected":False,"potency":"D30","dose_type":"UCHCH"},
        "adjustment_guide":[
            {"rule_no":6,"situation":"Labh ruke to",
             "action":"D30 → D100 dein"},
        ],
        "antidote_ready":None,
        "book_rules_summary":[],
    }

    mock_dosage = {
        "matra":"10 boonden","drops":10,"matra_note":"10 boonden — Full adult dose",
        "frequency":"3 baar daily","baar_per_day":3,
        "gap_between":"Subah, Dopahar, Raat","freq_reason":"Chronic",
        "timing":"Khali pet","timing_reason":"Positive rog",
        "water":"Gunguna paani","paani_ml":"125ml",
        "duration_min":"3 mahine","duration_max":"6 mahine",
        "duration_note":"Beech mein band nahi karni",
        "daily_schedule":[
            {"samay_hi":"सुबह (खाली पेट)","mishran":"MIXTURE A",
             "formula":"A-1+A-2","potency":"D30","matra":"10 boonden"},
            {"samay_hi":"दोपहर (भोजन के बाद)","mishran":"MIXTURE B",
             "formula":"S-6+C-6","potency":"D30","matra":"10 boonden"},
            {"samay_hi":"रात (सोते समय)","mishran":"MIXTURE A",
             "formula":"A-1+A-2","potency":"D30","matra":"10 boonden"},
        ],
        "paani_rules":{
            "standard":"Aadha cup (125ml) gunguna paani",
            "avoid":"Thanda paani BILKUL NAHI",
            "method":"Pehle paani, phir boonden",
            "timing":"15 minute baad kuch mat khao",
        },
        "special_notes":[
            {"system":"CARDIAC","note":"Subah BP check karein."},
            {"system":"RENAL","note":"2-3 liter warm water daily."},
        ],
    }

    mock_diet = {
        "title":"POSITIVE ROG KA PARHIZ",
        "principle":"Halka, shitalkari bhojan lein. BP badhane wali cheezein band.",
        "pathya":[
            {"item":"Khichdi (Dal+Chawal)","reason":"Halka bhojan"},
            {"item":"Lauki (Bottle Gourd)","reason":"BP control"},
            {"item":"Moong Dal",           "reason":"Light protein"},
            {"item":"Nariyal Paani",        "reason":"Electrolytes"},
            {"item":"Gunguna Paani 8-10g",  "reason":"Therapeutic"},
        ],
        "apathya":[
            {"item":"Namak bilkul band",   "reason":"BP badhata hai"},
            {"item":"Tala-Bhuna Khana",    "reason":"Inflammation"},
            {"item":"Chai+Coffee zyada",   "reason":"Heart rate"},
            {"item":"Sharaab+Tambaku",     "reason":"Strictly forbidden"},
        ],
        "lifestyle":["Subah 30 min shaant walk.","Neend 7-8 ghante.","Dhyan 10 min daily."],
    }

    # Generate full parcha
    parcha = generate_parcha(
        patient         = mock_patient,
        prakriti_result = mock_prakriti,
        polarity_result = mock_polarity,
        potency_result  = mock_potency,
        formula_result  = mock_formula,
        safety_result   = mock_safety,
        dosage_result   = mock_dosage,
        diet_result     = mock_diet,
        active_systems  = ["CARDIAC","RENAL"],
        logs            = [
            {"type":"phrase","found":"BP high","cat":"CARDIAC"},
            {"type":"word","found":"sujan","matched":"swelling","cat":"SWELLING"},
        ],
    )

    # Test assertions
    all_pass = True
    checks = [
        ("Section 1 present",     "ROGI KI JANKARI"          in parcha),
        ("Section 2 present",     "AI NAIDANIK VIVECHNA"      in parcha),
        ("Section 3 present",     "SPAGYRIC FORMULA"          in parcha),
        ("Section 4 present",     "TABLET CHART"              in parcha),
        ("Section 5 present",     "POTENCY KA CHUNAAV"        in parcha),
        ("Section 6 present",     "DAWA BANANE KI VIDHI"      in parcha),
        ("Section 7 present",     "MATRA AUR SAMAY"           in parcha),
        ("Section 8 present",     "PARHIZ"                    in parcha),
        ("Section 9 present",     "AGLI JAANCH"               in parcha),
        ("Patient name present",  "Ramesh Kumar"              in parcha),
        ("MIXTURE A present",     "MIXTURE A"                 in parcha),
        ("MIXTURE B present",     "MIXTURE B"                 in parcha),
        ("Clinic name present",   CLINIC_NAME                 in parcha),
        ("Aggravation warning",   "KABHI NAHI"                in parcha),
        ("Antidote present",      "Nimbu-Sirka"               in parcha),
        ("Diet section has food", "Khichdi"                   in parcha),
        ("Apathya present",       "BILKUL NAHI KHAYEN"        in parcha),
        ("Disclaimer present",    "DISCLAIMER"                in parcha),
    ]

    for desc, result in checks:
        mark = "✅" if result else "❌"
        if not result: all_pass = False
        print(f"  {mark} {desc}")

    print(f"\n  Total lines: {len(parcha.splitlines())}")
    print(f"  Total chars: {len(parcha)}")

    # Quick parcha test
    print("\n── Quick Parcha Test ──")
    qp = generate_quick_parcha(
        "Sita Devi",35,"Female",140,90,
        "sujan + safed pani","POSITIVE","D10",
        ["S-2+C-2+L-1+W.E.","S-6+C-6+B.E."]
    )
    print(f"  ✅ Quick parcha: {len(qp.splitlines())} lines")

    print(f"\n{'='*68}")
    print(f"RESULT: {'✅ ALL PASS' if all_pass else '❌ SOME FAIL'}")
    print(f"{'='*68}")

    # Print sample
    print("\n── PARCHA SAMPLE (First 30 lines) ──")
    for ln in parcha.splitlines()[:30]:
        print(ln)
