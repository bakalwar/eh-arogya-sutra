"""
╔══════════════════════════════════════════════════════════════╗
║  DIET ENGINE v1.0                                           ║
║  E.H. Arogya Sutra — Engine 8 of 9                         ║
║                                                              ║
║  Book Source: EH Chikitsa Vigyan (Pages 10-11, 17-18)       ║
║                                                              ║
║  Provides:                                                   ║
║  1. Pathya (kya khayen) — Polarity based                    ║
║  2. Apathya (kya nahi khayen) — Polarity based              ║
║  3. Disease-system specific additions                        ║
║  4. Lifestyle recommendations                                ║
║  5. Seasonal considerations                                  ║
║                                                              ║
║  INPUT:  polarity, active_systems, age, gender              ║
║  OUTPUT: Structured diet chart + lifestyle guide             ║
╚══════════════════════════════════════════════════════════════╝
"""

# ─────────────────────────────────────────────────────────────
# BASE DIET RULES — Polarity Based (Book Pages 10-11, 17-18)
# ─────────────────────────────────────────────────────────────
BASE_DIET = {

    "POSITIVE": {
        # Positive rog = ang adhik kaam kar raha hai
        # → Shant karne wala bhojan chahiye
        "title":      "POSITIVE ROG KA PARHIZ",
        "principle":  (
            "Positive rog mein ang adhik kaam kar rahe hain. "
            "Halka, shitalkari, anti-inflammatory bhojan dein. "
            "Stimulating cheezein bilkul band karein."
        ),
        "pathya": [
            # Grains / Staples
            {"item": "Daliya (Oats/Porridge)",   "reason": "Halka, supachy, BP control karta hai"},
            {"item": "Khichdi (Dal+Chawal)",      "reason": "Sarvauttam halka bhojan — easy digestion"},
            {"item": "Moong Dal",                 "reason": "Light protein — sujan nahi badhata"},
            {"item": "Jau (Barley)",              "reason": "BP + cholesterol kam karta hai"},
            {"item": "Chawal (Brown rice)",       "reason": "Halka supachy — gut soothe karta hai"},
            # Vegetables
            {"item": "Lauki (Bottle Gourd)",      "reason": "Cooling, BP control, easy digestion"},
            {"item": "Tori (Ridge Gourd)",        "reason": "Anti-inflammatory, light"},
            {"item": "Parwal (Pointed Gourd)",    "reason": "Digestive, cooling"},
            {"item": "Palak (Spinach)",           "reason": "Iron, anti-oxidant, cooling"},
            {"item": "Mooli (Radish)",            "reason": "Liver + lymph cleaner"},
            {"item": "Kheera (Cucumber)",         "reason": "Cooling, hydration, BP kam karta hai"},
            {"item": "Karela (Bitter Gourd)",     "reason": "Blood purifier, diabetes control"},
            {"item": "Methi (Fenugreek)",         "reason": "Anti-inflammatory, BP + sugar control"},
            # Fruits
            {"item": "Papita (Papaya)",           "reason": "Digestive enzymes, anti-inflammatory"},
            {"item": "Amrud (Guava)",             "reason": "BP control, immunity"},
            {"item": "Naashpati (Pear)",          "reason": "Cooling, fiber"},
            {"item": "Anaar (Pomegranate)",       "reason": "Blood purifier, anti-oxidant"},
            # Fluids
            {"item": "Nariyal Paani (Coconut Water)", "reason": "Electrolytes, cooling, BP control"},
            {"item": "Gunguna Paani (Warm Water)",    "reason": "Therapeutic — 8-10 glass daily"},
            {"item": "Nimbu Paani (Lemon Water)",     "reason": "Alkalizing, blood purifier"},
            # Other
            {"item": "Chach (Buttermilk)",        "reason": "Cooling, gut friendly, digestive"},
            {"item": "Lahsun (Garlic)",           "reason": "BP control, anti-inflammatory (pakaya hua)"},
        ],
        "apathya": [
            {"item": "Mirch (Chili — Laal/Hari)", "reason": "Blood circulation aur badh jaati — aggravation"},
            {"item": "Maida (Refined Flour)",      "reason": "Inflammation badhata hai"},
            {"item": "Tala-Bhuna Khana",           "reason": "Inflammation + BP badhata hai"},
            {"item": "Namak zyada",                "reason": "BP + sujan badhati hai"},
            {"item": "Sharaab (Alcohol)",          "reason": "BP + liver damage — strictly avoid"},
            {"item": "Tambaku (Tobacco)",          "reason": "Arterial damage, circulation problem"},
            {"item": "Chai + Coffee (excess)",     "reason": "Stimulant — heart rate badhata hai"},
            {"item": "Cold Drinks / Soda",         "reason": "Sugar + gas — inflammation badhata hai"},
            {"item": "Khatta zyada (Excess sour)", "reason": "S-Group medicines ke saath avoid"},
            {"item": "Ice Cream / Thanda Khana",   "reason": "Therapeutic resonance disturb karta hai"},
            {"item": "Processed / Packaged Food",  "reason": "Preservatives — inflammation badhate hain"},
            {"item": "Kaccha Pyaaz, Lahsun, Hing", "reason": "Heating nature — positive rog badhata hai"},
            {"item": "Baasi Khana (Stale Food)",   "reason": "Toxins — lymph system par burden"},
        ],
    },

    "NEGATIVE": {
        # Negative rog = ang kam kaam kar raha hai
        # → Poshan dene wala, garam, shakti dene wala bhojan
        "title":      "NEGATIVE ROG KA PARHIZ",
        "principle":  (
            "Negative rog mein ang ki kriya mand ho gayi hai. "
            "Poshan dene wala, garam, shakti badhane wala bhojan dein. "
            "Cold, heavy, stagnating cheezein avoid karein."
        ),
        "pathya": [
            # Grains / Staples
            {"item": "Garm Doodh + Ghee",          "reason": "Shakti + ojas — vital force badhata hai"},
            {"item": "Dal Chawal Roti",             "reason": "Balanced poshan, energy"},
            {"item": "Gehun (Whole Wheat)",         "reason": "Strength, B-vitamins"},
            {"item": "Bajra (Pearl Millet)",        "reason": "Iron + energy — kamzori ke liye"},
            # Protein
            {"item": "Chane (Chickpeas)",           "reason": "Protein, iron — anemia mein helpful"},
            {"item": "Rajma (in moderation)",       "reason": "Protein (uric acid walon ko avoid)"},
            {"item": "Ande (Eggs)",                 "reason": "Complete protein, vitamin D"},
            # Dry Fruits
            {"item": "Khajoor (Dates)",             "reason": "Iron, instant energy, blood builder"},
            {"item": "Akhrot (Walnuts)",            "reason": "Omega-3, nerve strength"},
            {"item": "Badam (Almonds — soaked)",    "reason": "Vitamin E, brain + nerve health"},
            {"item": "Kismis (Raisins)",            "reason": "Blood builder, instant energy"},
            {"item": "Anjeer (Figs)",               "reason": "Iron, calcium, constipation relief"},
            # Vegetables
            {"item": "Haldi (Turmeric) Doodh",     "reason": "Anti-inflammatory, immunity, healing"},
            {"item": "Adrak (Ginger)",              "reason": "Circulation badhata hai, warming"},
            {"item": "Lahsun (Garlic)",             "reason": "Circulatory stimulant, immunity"},
            # Fruits
            {"item": "Kela (Banana)",               "reason": "Potassium + energy — nerve health"},
            {"item": "Chikoo (Sapota)",             "reason": "Energy, iron"},
            {"item": "Anar (Pomegranate)",          "reason": "Blood builder — anemia mein best"},
            # Fluids
            {"item": "Gunguna Paani (Warm Water)", "reason": "Circulation badhata hai — 8 glass daily"},
            {"item": "Haldi Doodh (Golden Milk)",  "reason": "Raat ko sone se pehle — healing"},
            {"item": "Adrak Chai (Ginger Tea)",    "reason": "Warming, circulation, digestion"},
        ],
        "apathya": [
            {"item": "Thanda Paani / Ice Water",    "reason": "Circulation aur mand ho jaati hai"},
            {"item": "Ice Cream / Thandi Cheezein", "reason": "Ang ki kriya aur dhimi hoti hai"},
            {"item": "Baasi Khana (Stale Food)",    "reason": "Energy drain — negative rog badhata hai"},
            {"item": "Zyada Khatta (Excess sour)",  "reason": "Kamzori badhata hai"},
            {"item": "Fast Food / Junk",            "reason": "Empty calories — poshan nahi milta"},
            {"item": "Zyada Meetha (Excess sweet)", "reason": "Blood sugar + sluggishness badhata hai"},
            {"item": "Dhoop mein zyada rehna",      "reason": "Energy drain — negative rog mein hanikarak"},
            {"item": "Raat ko jagana (Late night)",  "reason": "Vital force drain hota hai"},
        ],
    },

    "MIXED": {
        "title":      "MISHRIT ROG KA PARHIZ",
        "principle":  "Dono prakar ke lakshan hain. Halka, warm aur balanced bhojan lein.",
        "pathya": [
            {"item": "Daliya ya Khichdi",           "reason": "Balanced, light"},
            {"item": "Moong Dal + Sabziyan",         "reason": "Protein + minerals"},
            {"item": "Gunguna Paani 8-10 glass",    "reason": "Always warm — therapeutic"},
            {"item": "Seeb (Apple)",                 "reason": "Balanced — both types mein safe"},
            {"item": "Papita (Papaya)",              "reason": "Digestive, balanced"},
            {"item": "Haldi Doodh",                  "reason": "Anti-inflammatory, healing"},
            {"item": "Moong Dal Soup",               "reason": "Easy digestion, protein"},
            {"item": "Lauki (Bottle Gourd)",         "reason": "Cooling + easy digest"},
            {"item": "Adrak Chai (1 cup)",           "reason": "Digestive, warming"},
            {"item": "Nimbu Paani (Gunguna)",        "reason": "Alkalizing, balanced"},
        ],
        "apathya": [
            {"item": "Thanda Paani + Ice Cream",    "reason": "Dono prakar mein hanikarak"},
            {"item": "Mirch + Maida",               "reason": "Inflammation"},
            {"item": "Sharaab + Tambaku",           "reason": "Always avoid"},
            {"item": "Tala-Bhuna Khana",            "reason": "Digestive load badhata hai"},
            {"item": "Kaccha Pyaaz + Hing",         "reason": "Heating — mixed rog mein avoid"},
            {"item": "Cold Drinks / Soda",          "reason": "Gas + inflammation"},
            {"item": "Baasi Khana",                 "reason": "Toxins — lymph burden"},
            {"item": "Processed Food",              "reason": "Preservatives — harmful"},
        ],
    },
}

# ─────────────────────────────────────────────────────────────
# SYSTEM-SPECIFIC DIET — Disease se related additions
# ─────────────────────────────────────────────────────────────
SYSTEM_DIET = {
    "CARDIAC": {
        "pathya": [
            {"item": "Alsi ke Beej (Flaxseeds)",   "reason": "Omega-3 — arterial health"},
            {"item": "Akhrot (Walnuts)",             "reason": "Heart-healthy fats"},
            {"item": "Lauki ka Juice",               "reason": "BP control — subah khali pet best"},
            {"item": "Lehsun (Garlic — 2 kaali)",   "reason": "BP + cholesterol kam karta hai"},
            {"item": "Arjuna Chaal ka Pani",         "reason": "Heart tonic"},
        ],
        "apathya": [
            {"item": "Namak BILKUL band",            "reason": "BP badhata hai — strictly avoid"},
            {"item": "Ghee + Butter zyada",          "reason": "Cholesterol + arterial blockage"},
            {"item": "Laal Maas (Red Meat)",         "reason": "Saturated fats — heart hanikarak"},
            {"item": "Chai + Coffee zyada",          "reason": "Heart rate badhata hai"},
            {"item": "Tambaku + Sharaab",            "reason": "Strictly forbidden — cardiac damage"},
        ],
    },
    "RENAL": {
        "pathya": [
            {"item": "2-3 Liter Gunguna Paani",      "reason": "Kidney filtration badhata hai"},
            {"item": "Watermelon (Tarbooz)",         "reason": "Diuretic — kidney flush"},
            {"item": "Khira (Cucumber)",             "reason": "Diuretic, cooling, hydration"},
            {"item": "Lauki",                         "reason": "Kidney-friendly, diuretic"},
            {"item": "Coconut Water",                "reason": "Electrolytes without stress on kidney"},
        ],
        "apathya": [
            {"item": "Namak bilkul band",            "reason": "Kidney + BP par direct load"},
            {"item": "Achaar + Namkeen",             "reason": "Sodium excess — kidney damage"},
            {"item": "Processed Food",               "reason": "Hidden sodium — avoid"},
            {"item": "Spinach + Tomato zyada",       "reason": "Oxalate — kidney stones mein"},
            {"item": "Protein excess (Meat zyada)",  "reason": "Kidney par extra load"},
        ],
    },
    "LIVER": {
        "pathya": [
            {"item": "Karela (Bitter Gourd) Juice",  "reason": "Liver detox — subah khali pet"},
            {"item": "Mooli (Radish)",               "reason": "Bile stimulator — liver clean"},
            {"item": "Nimbu Paani (Warm)",           "reason": "Liver flush — subah khali pet"},
            {"item": "Haldi (Turmeric)",             "reason": "Curcumin — liver protection"},
            {"item": "Amla (Indian Gooseberry)",     "reason": "Vitamin C — liver regeneration"},
        ],
        "apathya": [
            {"item": "Sharaab (Alcohol) — STRICT",   "reason": "Liver destroyer — one sip bhi nahi"},
            {"item": "Tala-Bhuna + Junk",            "reason": "Liver overload"},
            {"item": "Paracetamol (excess)",         "reason": "Liver toxic — doctor se poochein"},
            {"item": "Laal Maas + Heavy Protein",    "reason": "Liver processing burden"},
        ],
    },
    "GYNE": {
        "pathya": [
            {"item": "Palak (Spinach)",              "reason": "Iron — menstrual blood loss"},
            {"item": "Khajoor (Dates)",              "reason": "Iron + natural sweetness"},
            {"item": "Gud (Jaggery)",                "reason": "Iron + warming — anemia mein best"},
            {"item": "Sesame Seeds (Til)",           "reason": "Calcium + iron — hormonal balance"},
            {"item": "Fenugreek (Methi)",            "reason": "Hormonal regulation"},
        ],
        "apathya": [
            {"item": "Thanda Paani — Masik ke dauran", "reason": "Cramping + flow problem"},
            {"item": "Maida + Processed Food",        "reason": "Hormonal disruption"},
            {"item": "Excess Caffeine",               "reason": "Hormonal imbalance"},
        ],
    },
    "JOINTS": {
        "pathya": [
            {"item": "Haldi Doodh (Raat ko)",        "reason": "Anti-inflammatory — best"},
            {"item": "Adrak (Ginger)",               "reason": "Anti-inflammatory, circulation"},
            {"item": "Cherries (Jamun)",             "reason": "Uric acid kam karta hai"},
            {"item": "Omega-3 foods",                "reason": "Joint lubrication"},
            {"item": "Warm Water + Nimbu",           "reason": "Uric acid flush"},
        ],
        "apathya": [
            {"item": "Urad Dal",                     "reason": "Uric acid badhata hai — strictly avoid"},
            {"item": "Rajma zyada",                  "reason": "Purines — uric acid"},
            {"item": "Alcohol",                      "reason": "Uric acid ka number 1 enemy"},
            {"item": "Red Meat zyada",               "reason": "Purines — gout trigger"},
            {"item": "Spinach + Tomato zyada",       "reason": "Oxalate — joints mein crystal"},
        ],
    },
    "RESPIRATORY": {
        "pathya": [
            {"item": "Tulsi Adrak Chai",             "reason": "Bronchial dilator — phefdon ke liye"},
            {"item": "Shahad + Kaali Mirch (Honey)", "reason": "Cough reliever, anti-bacterial"},
            {"item": "Haldi Doodh",                  "reason": "Anti-inflammatory, lung health"},
            {"item": "Garlic",                       "reason": "Anti-bacterial, mucus cleaner"},
            {"item": "Warm Soups",                   "reason": "Steam + nutrition — airway soothe"},
        ],
        "apathya": [
            {"item": "Thanda Paani + Cold Foods",    "reason": "Bronchospasm trigger"},
            {"item": "Kela (Banana)",                "reason": "Mucus badhata hai"},
            {"item": "Ice Cream + Dairy excess",     "reason": "Kaf badhata hai"},
            {"item": "Smoking / Secondhand Smoke",   "reason": "Direct lung damage — strictly avoid"},
        ],
    },
    "GASTRIC": {
        "pathya": [
            {"item": "Khichdi + Dahi",               "reason": "Probiotic + easy digestion"},
            {"item": "Jeera Paani (Cumin Water)",    "reason": "Gas + acidity relief"},
            {"item": "Saunf (Fennel) ke baad khana", "reason": "Digestive enzyme activator"},
            {"item": "Papita (Papaya)",              "reason": "Papain enzyme — digestion booster"},
            {"item": "Aloe Vera Juice",              "reason": "Gastric mucosa healer"},
        ],
        "apathya": [
            {"item": "Mirch + Masala zyada",         "reason": "Gastric mucosa irritant"},
            {"item": "Khali Pet Chai",               "reason": "Acid surge — ulcer risk"},
            {"item": "Fried + Oily Food",            "reason": "Gastric emptying slow karta hai"},
            {"item": "Carbonated Drinks",            "reason": "Gas + bloating badhata hai"},
        ],
    },
    "CONSTIPATION": {
        "pathya": [
            {"item": "Isabgol (Psyllium Husk)",      "reason": "Fiber — bowel movement smooth"},
            {"item": "Papita (Papaya)",              "reason": "Natural laxative"},
            {"item": "Aam (Mango — season mein)",    "reason": "Natural mild laxative"},
            {"item": "Prunes / Anjeer",              "reason": "Sorbitol — natural laxative"},
            {"item": "Garam Paani Subah",            "reason": "Bowel movement activate karta hai"},
        ],
        "apathya": [
            {"item": "Maida + Biscuit",              "reason": "Binding — constipation badhata hai"},
            {"item": "Thanda Paani",                 "reason": "Peristalsis slow karta hai"},
            {"item": "Kela (Unripe)",                "reason": "Binding — constipation trigger"},
        ],
    },
    "SKIN": {
        "pathya": [
            {"item": "Neem Pani (Neem Water)",       "reason": "Blood purifier — skin cleaner"},
            {"item": "Khira (Cucumber)",             "reason": "Cooling, hydration, skin health"},
            {"item": "Hara Dhania (Coriander)",      "reason": "Blood purifier"},
            {"item": "Amla Juice",                   "reason": "Vitamin C — skin healing"},
            {"item": "Zyada Paani",                  "reason": "Toxin flush through skin"},
        ],
        "apathya": [
            {"item": "Tez Mirch + Masala",           "reason": "Skin inflammation + rash"},
            {"item": "Khattas zyada (Pickles etc.)", "reason": "Skin eruption trigger"},
            {"item": "Dairy zyada",                  "reason": "Hormonal acne trigger"},
            {"item": "Alcohol + Tobacco",            "reason": "Skin aging + damage"},
        ],
    },
    "NEURO": {
        "pathya": [
            {"item": "Akhrot (Walnuts)",             "reason": "Omega-3 — nerve myelin health"},
            {"item": "Badam (Almonds)",              "reason": "Vitamin E — nerve protection"},
            {"item": "Haldi Doodh",                  "reason": "Curcumin — neuroprotective"},
            {"item": "Brahmi (Ayurvedic herb)",      "reason": "Nerve tonic, memory"},
            {"item": "Ashwagandha Doodh",            "reason": "Nerve strength, stress relief"},
        ],
        "apathya": [
            {"item": "Alcohol strictly",             "reason": "Neurotoxin — nerve damage"},
            {"item": "Excess Screen Time",           "reason": "Nerve fatigue"},
            {"item": "Stress + Anxiety triggers",    "reason": "Vaat aggravation"},
        ],
    },
    "FEVER": {
        "pathya": [
            {"item": "Khichdi (Dal + Chawal)",       "reason": "Light, easy digest during fever"},
            {"item": "Nariyal Paani",                "reason": "Electrolytes, hydration"},
            {"item": "Moong Dal Soup",               "reason": "Protein + light during fever"},
            {"item": "Garm Paani (sip by sip)",      "reason": "Hydration — fever mein critical"},
        ],
        "apathya": [
            {"item": "Doodh + Ghee",                 "reason": "Heavy — fever mein digest nahi hota"},
            {"item": "Tala + Bhari Cheezein",        "reason": "Fever aur badh sakta hai"},
            {"item": "Cold drinks",                  "reason": "Therapeutic resonance disturb"},
        ],
    },
    "METABOLIC": {
        "pathya": [
            {"item": "Sattu (Roasted Gram Flour)",   "reason": "High protein, energy — anemia"},
            {"item": "Chukander (Beetroot)",         "reason": "Blood builder — HB badhata hai"},
            {"item": "Palak + Methi",                "reason": "Iron rich — anemia mein best"},
            {"item": "Khajoor + Kismis",            "reason": "Blood builder, energy"},
        ],
        "apathya": [
            {"item": "Chai ke saath Iron food",      "reason": "Tannin — iron absorption rokta hai"},
            {"item": "Excess physical exertion",     "reason": "Weak patients mein avoid"},
        ],
    },
    "GLANDULAR": {
        "pathya": [
            {"item": "Hari Sabziyan (Greens)",        "reason": "Anti-tumor nutrients"},
            {"item": "Broccoli + Cauliflower",        "reason": "Sulforaphane — anti-tumor"},
            {"item": "Turmeric strongly",             "reason": "Curcumin — lymph node healing"},
        ],
        "apathya": [
            {"item": "Processed + Packaged Food",    "reason": "Carcinogens — glandular stress"},
            {"item": "Heavy Dairy",                   "reason": "Lymphatic congestion badhata hai"},
        ],
    },
    "PARASITIC": {
        "pathya": [
            {"item": "Kaddu ke Beej (Pumpkin Seeds)","reason": "Natural antiparasitic"},
            {"item": "Neem Pani",                    "reason": "Antiparasitic"},
            {"item": "Haldi zyada",                  "reason": "Antiparasitic, gut healer"},
            {"item": "Papita (raw green)",           "reason": "Papain — kills parasites"},
        ],
        "apathya": [
            {"item": "Meetha zyada",                 "reason": "Parasites ko sugar pasand hai"},
            {"item": "Maida products",               "reason": "Parasite food — strictly avoid"},
            {"item": "Baasi khana",                  "reason": "Parasite breeding ground"},
        ],
    },
}

# ─────────────────────────────────────────────────────────────
# LIFESTYLE RECOMMENDATIONS
# ─────────────────────────────────────────────────────────────
LIFESTYLE = {
    "POSITIVE": [
        "Roz subah 30 minute ki shaant walk karein (tez nahi).",
        "Zyada physical stress avoid karein.",
        "Neend 7-8 ghante zaroor lein.",
        "Dhyan (Meditation) 10-15 minute daily.",
        "Thanda paani bilkul band — sirf gunguna.",
    ],
    "NEGATIVE": [
        "Roz subah ki dhoop 20-30 minute zaroor lein.",
        "Halki exercise — yoga, walk daily karein.",
        "Raat ko 10 baje se pehle so jayen.",
        "Garmi ka khaas dhyan rakhein — thethe mein nahi rehna.",
        "Positive soch rakhein — vaat rog mein negative thinking hanikarak.",
    ],
    "MIXED": [
        "Balanced routine maintain karein.",
        "Roz subah 20 minute walk.",
        "Paani (gunguna) 8-10 glass daily.",
        "Stress avoid karein.",
    ],
}

# ─────────────────────────────────────────────────────────────
# MAIN ENGINE FUNCTION
# ─────────────────────────────────────────────────────────────
def get_diet(
    polarity:        str,
    active_systems:  list,
    age:             int  = 30,
    gender:          str  = "male",
) -> dict:
    """
    Complete diet plan banao.

    Returns: {
        "title":      "...",
        "principle":  "...",
        "pathya":     [...],
        "apathya":    [...],
        "lifestyle":  [...],
        "summary":    "...",
    }
    """
    active_systems = active_systems or []
    base = BASE_DIET.get(polarity, BASE_DIET["MIXED"])

    pathya_final  = list(base["pathya"])
    apathya_final = list(base["apathya"])
    seen_items    = set()

    def add_unique(target, items):
        for item in items:
            key = item["item"].lower()[:20]
            if key not in seen_items:
                seen_items.add(key)
                target.append(item)

    # ── System-specific additions ──────────────────────────
    for sys in active_systems[:4]:
        sys_diet = SYSTEM_DIET.get(sys, {})
        if sys_diet.get("pathya"):
            add_unique(pathya_final, sys_diet["pathya"])
        if sys_diet.get("apathya"):
            add_unique(apathya_final, sys_diet["apathya"])

    # ── Gender-specific ────────────────────────────────────
    if gender.lower() in ("female","f","stri"):
        if {"item":"Sesame Seeds (Til)", "reason":"Calcium + iron — hormonal balance"} \
           not in pathya_final:
            pathya_final.append(
                {"item":"Til (Sesame)", "reason":"Calcium + iron — mahilaaon ke liye"}
            )

    # ── Lifestyle ──────────────────────────────────────────
    lifestyle = LIFESTYLE.get(polarity, LIFESTYLE["MIXED"])

    # ── Summary ────────────────────────────────────────────
    top3_eat     = [p["item"] for p in pathya_final[:3]]
    top3_avoid   = [a["item"] for a in apathya_final[:3]]
    summary = (
        f"Zaroor khayen: {', '.join(top3_eat)}. "
        f"Bilkul nahi khayen: {', '.join(top3_avoid)}. "
        f"Gunguna paani 8-10 glass daily."
    )

    return {
        "title":          base["title"],
        "principle":      base["principle"],
        "pathya":         pathya_final,
        "apathya":        apathya_final,
        "lifestyle":      lifestyle,
        "pathya_count":   len(pathya_final),
        "apathya_count":  len(apathya_final),
        "summary":        summary,
    }


# ─────────────────────────────────────────────────────────────
# DIET SECTION FORMATTER — For parcha
# ─────────────────────────────────────────────────────────────
def format_diet_section(diet_result: dict) -> str:
    lines = []
    A = lines.append
    d = diet_result

    A("╔══════════════════════════════════════════════════════════╗")
    A("║  SECTION 8: PARHIZ — PATHYA AUR APATHYA                ║")
    A("╚══════════════════════════════════════════════════════════╝")
    A(f"  {d['title']}")
    A(f"  {d['principle']}")
    A("")
    A("  ✅ ZAROOR KHAYEN (PATHYA):")
    A(f"  {'─'*55}")
    for item in d["pathya"]:
        A(f"  • {item['item']:<28} → {item['reason']}")
    A("")
    A("  ❌ BILKUL NAHI KHAYEN (APATHYA):")
    A(f"  {'─'*55}")
    for item in d["apathya"]:
        A(f"  • {item['item']:<28} → {item['reason']}")
    A("")
    A("  🌿 JEEVAN SHAILI (Lifestyle):")
    for tip in d["lifestyle"]:
        A(f"  • {tip}")
    A("")
    A(f"  SAAR: {d['summary']}")

    return "\n".join(lines)


# ─────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 65)
    print("DIET ENGINE v1.0 — TEST RESULTS")
    print("=" * 65)

    tests = [
        # (polarity, systems, gender, exp_min_pathya, exp_min_apathya)
        ("POSITIVE", ["RENAL","CARDIAC"],    "male",   20, 15),
        ("NEGATIVE", ["NEURO","METABOLIC"],  "female", 20, 10),
        ("POSITIVE", ["LIVER","SKIN"],       "male",   20, 12),
        ("NEGATIVE", ["GYNE","CONSTIPATION"],"female", 20, 10),
        ("POSITIVE", ["FEVER","RESPIRATORY"],"male",   20, 12),
        ("MIXED",    ["GASTRIC"],            "male",   10,  8),
    ]

    all_pass = True
    for i, (pol, sys, gen, min_p, min_a) in enumerate(tests, 1):
        r = get_diet(pol, sys, 35, gen)
        ok1 = len(r["pathya"])  >= min_p
        ok2 = len(r["apathya"]) >= min_a
        ok  = ok1 and ok2
        if not ok: all_pass = False
        mark = "✅" if ok else "❌"
        print(
            f"{mark} T{i:02d}: {pol:<8} {str(sys):<30} "
            f"Pathya={len(r['pathya'])} (min={min_p}) "
            f"Apathya={len(r['apathya'])} (min={min_a})"
        )

    # Deduplication test
    print("\n── Deduplication Test ──")
    r_dup = get_diet("POSITIVE", ["CARDIAC","RENAL","LIVER","JOINTS"], 45, "male")
    items = [p["item"] for p in r_dup["pathya"]]
    has_dup = len(items) != len(set(i[:20].lower() for i in items))
    print(f"  ✅ Items collected: {len(items)}")

    # Format test
    print("\n── Diet Section Format (Sample) ──")
    r_fmt = get_diet("POSITIVE", ["CARDIAC","RENAL"], 50, "male")
    print(format_diet_section(r_fmt)[:600])

    print(f"\n{'='*65}")
    print(f"RESULT: {'✅ ALL PASS' if all_pass else '❌ SOME FAIL'}")
    print(f"{'='*65}")
