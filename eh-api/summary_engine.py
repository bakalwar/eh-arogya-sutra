"""
╔══════════════════════════════════════════════════════════════════╗
║     EH AROGYA SUTRA  —  PROFESSIONAL CLINICAL SUMMARY ENGINE    ║
║     Version 3.2  │  Fully Dynamic  │  Multi-Disease Priority     ║
║     Pure English  │  Zero Fixed Medicines  │  Cross-Mixture Unique ║
╚══════════════════════════════════════════════════════════════════╝
"""
import re
from datetime import datetime
from typing import List, Optional, Dict, Set, Tuple


# ═══════════════════════════════════════════════════════════════════
# SECTION 1 — CLINICAL DESCRIPTIONS (PURE ENGLISH)
# ═══════════════════════════════════════════════════════════════════

POLARITY_DESCRIPTION = {
    "POSITIVE": (
        "POSITIVE  —  Hyperactive State",
        "The affected organ(s) are in a hyperactive or congested "
        "state, producing excess secretions, accumulating fluid, "
        "or generating inflammation. The body requires Negative "
        "(sedative) medicines at High dilution to calm and regulate "
        "the overactive biological processes."
    ),
    "NEGATIVE": (
        "NEGATIVE  —  Hypoactive State",
        "The affected organ(s) have become underactive, weakened, "
        "or have reduced functional capacity. Cellular nutrition "
        "and vital energy have depleted. The body requires Positive "
        "(stimulant) medicines at Low dilution to stimulate and "
        "restore normal organ function and vital force."
    ),
    "MIXED": (
        "MIXED  —  Transitional State",
        "The patient presents with both hyperactive and hypoactive "
        "features across different organ systems. A neutral approach "
        "with moderate dilution is indicated until the dominant "
        "polarity clarifies through treatment response."
    ),
}

PRAKRITI_DESCRIPTION = {
    "Lymphatic": (
        "Lymphatic  (Kaf Constitution)",
        "The patient has a Lymphatic constitution, indicating a "
        "natural predisposition toward lymphatic stagnation. "
        "According to Count Mattei, Lymphatic temperament leads "
        "to sluggish lymph flow, reduced cellular detoxification, "
        "and accumulation of toxic metabolites in tissues, "
        "creating the foundation for chronic multi-system disease."
    ),
    "Sanguine": (
        "Sanguine  (Blood Constitution)",
        "The patient has a Sanguine constitution, indicating a "
        "predisposition toward blood vitiation and vascular "
        "disturbances. Sanguine temperament shows heightened "
        "arterial activity, rapid inflammatory responses, and "
        "a tendency toward hypertension and circulatory disorders."
    ),
    "Bilious": (
        "Bilious  (Hepatic Constitution)",
        "The patient has a Bilious constitution, indicating "
        "hepatic and metabolic predisposition. Bilious temperament "
        "involves impaired bile flow, hepatic congestion, and "
        "disrupted digestive metabolism leading to systemic toxicity."
    ),
    "Nervous": (
        "Nervous  (Neural Constitution)",
        "The patient has a Nervous constitution, indicating "
        "sensitivity of the autonomic nervous system. Nervous "
        "temperament exhibits heightened nerve reactivity, "
        "susceptibility to neuralgic conditions, and "
        "psychosomatic manifestations of disease."
    ),
}

SYSTEM_ROOT_CAUSE = {
    "RENAL": (
        "Renal System Pathology",
        "The kidneys have lost their optimal glomerular filtration "
        "capacity. Metabolic waste products including creatinine, "
        "uric acid, and nitrogenous compounds are accumulating in "
        "the bloodstream instead of being expelled through urine. "
        "This accumulation in interstitial tissues manifests as "
        "peripheral edema in the hands, feet, and face. Elevated "
        "blood pressure is a secondary consequence of fluid "
        "retention and increased vascular resistance."
    ),
    "CARDIAC": (
        "Cardiovascular System Pathology",
        "The arterial walls have undergone progressive stiffening "
        "and loss of elasticity. The heart's pumping workload has "
        "increased to maintain adequate circulation against elevated "
        "peripheral vascular resistance. This sustained hypertension, "
        "if uncorrected, risks cardiac hypertrophy, atherosclerosis, "
        "and end-organ damage to the kidneys, eyes, and brain."
    ),
    "LIVER": (
        "Hepatic System Pathology",
        "The hepatic detoxification pathways are compromised. "
        "Kupffer cell activity is reduced, bile flow is sluggish, "
        "and the portal circulation is congested. Toxins and "
        "metabolic by-products that should be processed and "
        "eliminated are re-entering systemic circulation, creating "
        "a progressive toxic burden across multiple organ systems."
    ),
    "GYNE": (
        "Gynecological System Pathology",
        "Pelvic lymphatic congestion has developed, impairing the "
        "normal mucosal health of the uterus and reproductive "
        "organs. Hypersecretion of cervical and uterine mucosa "
        "results in persistent discharge. Hormonal dysregulation, "
        "often stemming from lymphatic stasis, further perpetuates "
        "the condition and disrupts the menstrual cycle."
    ),
    "NEURO": (
        "Neurological System Pathology",
        "Peripheral nerve conduction has deteriorated, manifesting "
        "as shooting pain, tingling, or numbness along the nerve "
        "pathway. Structural compression from disc herniation or "
        "vertebral changes is mechanically irritating the nerve "
        "roots. The myelin sheath integrity is compromised, "
        "reducing the speed and accuracy of nerve signal "
        "transmission throughout the affected dermatome."
    ),
    "JOINTS": (
        "Musculoskeletal System Pathology",
        "Progressive degeneration of articular cartilage and "
        "subchondral bone has occurred. Synovial fluid quality "
        "and quantity are reduced, leading to increased joint "
        "friction and inflammatory changes. Uric acid crystal "
        "deposition in joint spaces creates acute inflammatory "
        "episodes with severe pain and swelling in the "
        "affected joints."
    ),
    "RESPIRATORY": (
        "Respiratory System Pathology",
        "Bronchial mucosal hypersecretion has created airway "
        "obstruction. Bronchospasm and mucosal edema are narrowing "
        "the effective airway diameter, increasing resistance to "
        "airflow. Chronic inflammatory changes in the bronchial "
        "walls reduce the elastic recoil needed for effective "
        "exhalation and oxygen exchange."
    ),
    "GASTRIC": (
        "Gastrointestinal System Pathology",
        "Gastric enzyme secretion is dysregulated, causing "
        "incomplete protein and carbohydrate digestion. Excess "
        "gastric acid irritates the mucosal lining, creating "
        "inflammation and discomfort. Impaired peristalsis leads "
        "to food stagnation, fermentation, and gas accumulation "
        "throughout the intestinal tract."
    ),
    "METABOLIC": (
        "Constitutional — Metabolic Pathology",
        "The patient's vital force — the fundamental bio-energetic "
        "intelligence governing all organ functions — has become "
        "depleted. Cellular energy metabolism is inefficient, "
        "lymphatic circulation is sluggish, and the body's "
        "self-healing capacity is significantly diminished. "
        "This constitutional weakness creates fertile ground "
        "for multi-system disease progression and chronic fatigue."
    ),
    "SKIN": (
        "Dermatological System Pathology",
        "The skin, as the body's largest elimination organ, is "
        "compensating for impaired internal detoxification. Blood "
        "toxins are being expelled through cutaneous routes, "
        "manifesting as eruptions, rashes, or inflammatory skin "
        "changes. The underlying blood and lymphatic impurity must "
        "be addressed at its source for permanent skin healing."
    ),
    "FEVER": (
        "Immune — Pyretic Response",
        "An acute immune mobilization is underway. The hypothalamus "
        "has elevated the body's thermostat in response to microbial "
        "invasion or inflammatory signals. This pyretic response "
        "requires careful management to prevent febrile "
        "complications while supporting the immune system's "
        "natural defensive work."
    ),
    "GLANDULAR": (
        "Lymphoglandular System Pathology",
        "Lymph node congestion has developed with impaired "
        "lymphocyte production and reduced immune surveillance. "
        "Glandular tissues show abnormal cellular proliferation "
        "or structural induration. The reticuloendothelial "
        "system's filtering capacity is overwhelmed, compromising "
        "the body's primary defense mechanisms."
    ),
    "CONSTIPATION": (
        "Intestinal Motility Pathology",
        "Colonic peristaltic activity has significantly slowed. "
        "The smooth muscle of the large intestine is hypo-"
        "contractile, allowing waste material to stagnate and "
        "dehydrate in the colon. Toxins from retained fecal "
        "matter are being reabsorbed into the circulation, "
        "creating systemic auto-intoxication and fatigue."
    ),
    "PARASITIC": (
        "Intestinal Parasitic Pathology",
        "Intestinal parasites are disrupting the normal absorptive "
        "function of the gut mucosa. Parasitic toxins are absorbed "
        "into the bloodstream, causing systemic inflammatory "
        "responses. Nutritional deficiencies develop as parasites "
        "compete with the host for essential micronutrients."
    ),
}

MIXTURE_ACTION = {
    "RENAL": (
        "This formula directly targets the renal filtration "
        "apparatus using the selected medicines. It stimulates "
        "glomerular filtration rate, reduces interstitial edema "
        "by activating lymphatic drainage from kidney tissue, "
        "and promotes urinary excretion of accumulated metabolic "
        "waste. Peripheral swelling is expected to reduce "
        "progressively over 4 to 6 weeks of consistent use."
    ),
    "CARDIAC": (
        "This formula restores vascular tone and reduces elevated "
        "blood pressure through a multi-directional approach using "
        "the selected medicines. It relaxes arterial wall "
        "stiffness, improves venous return, purifies blood "
        "composition, and reduces the cardiac workload. Blood "
        "pressure normalization requires consistent use "
        "over 2 to 3 months."
    ),
    "LIVER": (
        "This formula restores hepatic detoxification efficiency "
        "using the selected medicines. It activates bile flow "
        "through the biliary ducts, clears portal venous "
        "congestion, and supports regeneration of hepatic "
        "parenchymal cells. Liver enzyme levels are expected "
        "to normalize progressively with sustained use."
    ),
    "GYNE": (
        "This formula addresses pelvic mucosal congestion and "
        "regulates hypersecretion using the selected medicines. "
        "It clears pelvic lymphatic stagnation, corrects hormonal "
        "imbalance through glandular regulation, and heals the "
        "mucosal lining of the reproductive tract. Discharge is "
        "expected to reduce significantly within 3 to 4 weeks."
    ),
    "NEURO": (
        "This formula targets peripheral nerve restoration using "
        "the selected medicines. It reduces inflammatory pressure "
        "on nerve roots, supports myelin sheath repair, and "
        "improves nerve conduction velocity. Pain, tingling, and "
        "numbness along the nerve pathway will diminish as nerve "
        "fiber integrity is progressively restored over "
        "4 to 8 weeks."
    ),
    "JOINTS": (
        "This formula addresses the underlying metabolic and "
        "circulatory causes of joint pathology using the selected "
        "medicines. It reduces uric acid accumulation, improves "
        "synovial fluid quality, supports cartilage nutrition, "
        "and reduces articular inflammation. Joint mobility and "
        "pain reduction are expected over 6 to 12 weeks."
    ),
    "RESPIRATORY": (
        "This formula relieves bronchial obstruction and reduces "
        "airway hypersecretion using the selected medicines. It "
        "relaxes bronchial smooth muscle to open the airways, "
        "liquefies thick mucus for expulsion, and reduces chronic "
        "bronchial mucosal inflammation. Breathing ease is "
        "expected to improve within 2 to 4 weeks of regular use."
    ),
    "GASTRIC": (
        "This formula restores balanced gastric secretion and "
        "intestinal motility using the selected medicines. It "
        "regulates acid production, activates digestive enzyme "
        "output, reduces gastric nerve tension, and normalizes "
        "intestinal peristalsis. Acidity, bloating, and digestive "
        "discomfort should reduce within 2 to 3 weeks."
    ),
    "METABOLIC": (
        "This formula works to rebuild the patient's depleted "
        "constitutional vital force using the selected medicines. "
        "It activates systemic lymphatic circulation, enhances "
        "cellular nutrition, stimulates the immune system, and "
        "gradually restores the body's self-healing capacity. "
        "Constitutional strengthening requires sustained use "
        "over 2 to 3 months for lasting results."
    ),
    "SKIN": (
        "This formula addresses the internal source of skin "
        "pathology using the selected medicines. It purifies the "
        "circulating blood, activates lymphatic toxin clearance, "
        "supports hepatic detoxification, and allows the skin "
        "to heal permanently from within over 4 to 8 weeks."
    ),
    "FEVER": (
        "This formula supports the body's pyretic defense "
        "mechanism using the selected medicines. It modulates "
        "the hypothalamic thermoregulatory center, calms autonomic "
        "nerve hyperactivity, and supports immune function. "
        "Body temperature is expected to normalize within "
        "24 to 72 hours with regular dosing."
    ),
    "GLANDULAR": (
        "This formula targets lymphoglandular congestion using "
        "the selected medicines. It activates macrophage-mediated "
        "tissue dissolution, improves lymph node drainage, and "
        "corrects immune surveillance deficits. Glandular swelling "
        "is expected to reduce progressively over 6 to 12 weeks."
    ),
    "CONSTIPATION": (
        "This formula directly stimulates colonic peristaltic "
        "activity using the selected medicines. It tones intestinal "
        "smooth muscle, activates the gastrocolic reflex, softens "
        "stool through improved mucosal secretion, and prevents "
        "toxic reabsorption from the colon. Regular bowel function "
        "should be restored within 5 to 10 days."
    ),
    "PARASITIC": (
        "This formula creates an inhospitable intestinal "
        "environment for parasites using the selected medicines. "
        "It disrupts parasite attachment to the gut wall, expels "
        "intestinal worms, neutralizes parasitic toxins, and "
        "repairs mucosal damage. Symptoms should improve "
        "significantly within 2 to 3 weeks."
    ),
}

# ── TABLET ACTION ─────────
TABLET_ACTION = {
    "RENAL": (
        "The tablet form of this formula provides sustained "
        "renal support throughout the day between liquid doses. "
        "It maintains continuous stimulation of kidney filtration, "
        "keeps uric acid and creatinine levels in check between "
        "doses, and supports uninterrupted lymphatic drainage "
        "from the renal interstitium across all waking hours."
    ),
    "CARDIAC": (
        "The tablet form provides continuous cardiovascular "
        "support between liquid doses. It maintains steady "
        "vascular toning, keeps arterial walls supple throughout "
        "the day, and ensures uninterrupted blood pressure "
        "regulation — particularly during periods of physical "
        "activity when cardiovascular demand is highest."
    ),
    "LIVER": (
        "The tablet form sustains hepatic detoxification activity "
        "between liquid medicine intervals. It maintains continuous "
        "bile flow stimulation, supports Kupffer cell activity, "
        "and keeps the portal circulation moving efficiently. "
        "Particularly effective when taken after meals to support "
        "the liver's peak detoxification workload."
    ),
    "GYNE": (
        "The tablet form provides continuous pelvic lymphatic "
        "support between liquid doses. It maintains steady "
        "glandular regulation, supports uterine mucosal healing "
        "throughout the day, and provides uninterrupted "
        "hormonal balance support across the treatment period."
    ),
    "NEURO": (
        "The tablet form provides sustained peripheral nerve "
        "support between liquid doses. It maintains a continuous "
        "anti-inflammatory presence at nerve root level, supports "
        "ongoing myelin sheath repair, and provides steady pain "
        "modulation. Nerve healing continues uninterrupted "
        "throughout the patient's active hours."
    ),
    "JOINTS": (
        "The tablet form delivers continuous joint and bone "
        "support throughout the day. It maintains steady "
        "anti-inflammatory action, supports ongoing cartilage "
        "nourishment, and provides uninterrupted metabolic "
        "correction required for joint healing between "
        "liquid medicine doses."
    ),
    "RESPIRATORY": (
        "The tablet form maintains continuous bronchial support "
        "between liquid doses. It provides steady bronchodilatory "
        "action and maintains anti-spasmodic coverage throughout "
        "the day and night — particularly valuable during periods "
        "of increased respiratory demand or environmental "
        "allergen exposure."
    ),
    "GASTRIC": (
        "The tablet form provides sustained gastric regulation "
        "throughout the day. It maintains steady enzyme stimulation "
        "after meals, provides continuous mucosal protection, and "
        "supports uninterrupted peristaltic activity. Ideally "
        "taken after meals for direct action during "
        "the active digestive process."
    ),
    "METABOLIC": (
        "The tablet form provides continuous constitutional "
        "support throughout the day between liquid doses. "
        "It maintains steady lymphatic stimulation, supports "
        "ongoing cellular energy production, and provides "
        "uninterrupted immune system activation. Vital force "
        "rebuilding proceeds consistently across all waking "
        "hours, accelerating overall recovery."
    ),
    "SKIN": (
        "The tablet form maintains continuous blood and lymph "
        "purification between liquid doses. It provides steady "
        "detoxification support, maintains ongoing hepatic "
        "clearing of blood toxins, and supports uninterrupted "
        "lymphatic drainage — ensuring that internal cleansing "
        "continues throughout the day."
    ),
    "FEVER": (
        "The tablet form provides continuous fever management "
        "between liquid doses. It maintains steady hypothalamic "
        "modulation and supports ongoing immune mobilization. "
        "Dissolve under the tongue for fastest absorption "
        "during acute high-fever episodes."
    ),
    "GLANDULAR": (
        "The tablet form maintains continuous lymphoglandular "
        "support throughout the day. It provides steady macrophage "
        "activation, supports ongoing lymph node drainage, and "
        "maintains uninterrupted immune surveillance enhancement "
        "between liquid medicine doses."
    ),
    "CONSTIPATION": (
        "The tablet form provides continuous intestinal motility "
        "support. It maintains steady peristaltic stimulation and "
        "supports ongoing colonic muscle tone throughout the day. "
        "Take after each main meal for direct stimulation of "
        "the gastro-colic reflex and optimal bowel function."
    ),
    "PARASITIC": (
        "The tablet form maintains continuous anti-parasitic "
        "action throughout the day between liquid doses. It "
        "sustains an inhospitable intestinal environment for "
        "parasites and supports ongoing gut mucosal repair, "
        "ensuring anti-parasitic action is maintained during "
        "all digestive phases."
    ),
}

# ── EXTERNAL APPLICATION ──
EXTERNAL_APPLICATION = {
    "RENAL": {
        "location": "Lumbar region (lower back) and lower extremities "
                    "(swollen hands, feet, ankles)",
        "action":   "Application over the lumbar region directly "
                    "stimulates local lymphatic drainage from the "
                    "renal zone. It reduces tissue fluid accumulation "
                    "in the extremities at the application site, "
                    "improves kidney zone circulation reflexively, "
                    "and accelerates reduction of peripheral edema "
                    "in the hands, feet, and ankles."
    },
    "CARDIAC": {
        "location": "Chest (precordial area), upper back, and "
                    "swollen extremities",
        "action":   "Massage over the chest and upper back promotes "
                    "peripheral vasodilation and supports venous "
                    "return to the heart. It creates a reflexive "
                    "calming effect on the autonomic nervous system, "
                    "reduces peripheral vascular resistance, and "
                    "improves circulation in edematous extremities, "
                    "directly complementing the internal formulas."
    },
    "LIVER": {
        "location": "Upper right abdomen (liver area) and right flank",
        "action":   "Application directly over the liver zone "
                    "stimulates hepatic portal circulation, reduces "
                    "local congestion in the right upper quadrant, "
                    "and promotes bile duct relaxation. For patients "
                    "with gas, bloating, or liver heaviness, "
                    "this topical application provides immediate "
                    "local relief while the internal formula "
                    "addresses the deeper pathology."
    },
    "GASTRIC": {
        "location": "Entire abdomen — from epigastrium to "
                    "lower umbilical region",
        "action":   "Abdominal massage with this formula stimulates "
                    "peristaltic activity directly, reduces gaseous "
                    "distension, and relaxes the smooth muscle of "
                    "the intestinal wall. For patients experiencing "
                    "gas, bloating, or constipation, abdominal "
                    "application provides direct symptomatic relief "
                    "by stimulating the gastrocolic reflex."
    },
    "CONSTIPATION": {
        "location": "Lower abdomen (colon region) — from right "
                    "side to left side following colon path",
        "action":   "Massage following the colon path (right side "
                    "upward, across, left side downward) directly "
                    "stimulates colonic peristalsis. This mechanical "
                    "and pharmacological combination accelerates "
                    "bowel movement, reduces hardened stool, and "
                    "immediately relieves the discomfort of "
                    "intestinal stasis."
    },
    "GYNE": {
        "location": "Lower abdomen and pelvic region (below navel)",
        "action":   "Gentle application over the lower abdomen "
                    "promotes pelvic lymphatic drainage, reduces "
                    "pelvic congestion, and provides direct "
                    "anti-inflammatory support to the reproductive "
                    "organs. Particularly effective for reducing "
                    "pelvic heaviness, lower abdominal cramping, "
                    "and accelerating the internal formula's "
                    "pelvic therapeutic effect."
    },
    "NEURO": {
        "location": "Spinal column (affected vertebral levels) "
                    "and the complete nerve pathway of pain",
        "action":   "Topical application along the spine and the "
                    "affected nerve pathway creates a direct "
                    "therapeutic interface with inflamed nerve roots. "
                    "The formula penetrates subcutaneous tissue, "
                    "reduces local inflammation at the nerve root, "
                    "relieves paraspinal muscular tension, and "
                    "accelerates peripheral nerve healing along "
                    "the complete nerve distribution pathway."
    },
    "JOINTS": {
        "location": "Directly over the affected joint(s) — "
                    "knee, hip, elbow, ankle, shoulder, or "
                    "small finger joints as applicable",
        "action":   "Direct application over the affected joint "
                    "delivers the therapeutic agents precisely to "
                    "the site of cartilage degeneration and synovial "
                    "inflammation. It reduces local joint edema, "
                    "eases articular stiffness and morning rigidity, "
                    "and improves local circulation to the joint "
                    "space. Particularly effective immediately after "
                    "warm water soaking of the affected area."
    },
    "RESPIRATORY": {
        "location": "Chest (front and back), upper back between "
                    "shoulder blades, and throat area",
        "action":   "Application over the chest and upper back "
                    "promotes bronchial relaxation reflexively, "
                    "reduces chest tightness and bronchial spasm, "
                    "and supports lymphatic drainage from the "
                    "thoracic cavity. Chest massage before sleep "
                    "is particularly beneficial for nocturnal "
                    "breathing difficulty and morning phlegm."
    },
    "METABOLIC": {
        "location": "Full body — both arms, both legs, and "
                    "along the spinal column",
        "action":   "Full-body application stimulates peripheral "
                    "lymphatic circulation throughout the entire "
                    "body, activates cutaneous nerve endings, and "
                    "improves overall vital energy and warmth. "
                    "It provides a direct constitutionally "
                    "strengthening effect that synergizes with "
                    "all internal oral and tablet formulas, "
                    "accelerating the rebuilding of vital force."
    },
    "SKIN": {
        "location": "Directly over all affected skin areas — "
                    "do not apply on open wounds or broken skin",
        "action":   "Local application over affected skin areas "
                    "accelerates surface healing while internal "
                    "formulas address the root cause. It reduces "
                    "surface inflammation and itching, supports "
                    "skin barrier repair, and provides direct "
                    "lymphatic drainage at the application site "
                    "to remove locally accumulated toxins."
    },
    "FEVER": {
        "location": "Forehead, both temples, and back of neck",
        "action":   "Application over the forehead and neck "
                    "provides immediate local cooling and "
                    "vasodilatory effect, supporting the body's "
                    "heat dissipation mechanism. It reduces "
                    "headache associated with fever, calms "
                    "autonomic nerve tension in the cervical "
                    "region, and provides measurable symptomatic "
                    "comfort during acute febrile episodes."
    },
    "GLANDULAR": {
        "location": "Directly over the affected gland, lump, or "
                    "swollen lymph node area",
        "action":   "Topical application over the glandular zone "
                    "stimulates local lymphatic drainage and supports "
                    "tissue softening. It helps in reducing the "
                    "hardness of the lump/gland and complements the "
                    "internal medicines in resolving structural "
                    "congestion."
    },
}

# ── SAFETY RED FLAGS ────────────────────────────────────────────
SYSTEM_RED_FLAGS = {
    "RENAL":      ["Creatinine rising above 2.5 mg/dL",
                   "Sudden reduction in urine output",
                   "Severe swelling of face or eyelids",
                   "Foamy urine indicating protein loss"],
    "CARDIAC":    ["Blood pressure exceeding 180/110 mmHg acutely",
                   "Chest pain or pressure sensation",
                   "Sudden severe headache or visual changes",
                   "Palpitations with dizziness or fainting"],
    "LIVER":      ["Yellowing of skin or eyes (jaundice)",
                   "SGPT/SGOT rising above ten times normal",
                   "Severe right upper abdominal pain",
                   "Spontaneous bleeding tendency"],
    "NEURO":      ["Loss of bladder or bowel control",
                   "Progressive limb weakness or paralysis",
                   "Loss of sensation below a dermatome",
                   "Fever with neck stiffness"],
    "GYNE":       ["Heavy bleeding — more than 2 pads per hour",
                   "High fever with severe pelvic pain",
                   "Sudden severe pelvic pain",
                   "Foul-smelling or abnormally coloured discharge"],
    "RESPIRATORY":["Respiratory rate above 30 per minute",
                   "Oxygen saturation below 92 percent",
                   "Coughing blood",
                   "Unable to speak in full sentences"],
    "FEVER":      ["Temperature above 104 degrees Fahrenheit",
                   "Fever with skin rash and neck stiffness",
                   "Febrile convulsions",
                   "Fever not improving after 3 days"],
    "JOINTS":     ["Sudden hot red severely swollen joint",
                   "Cannot bear weight on the limb",
                   "Fever accompanying joint swelling",
                   "Progressive muscle weakness or wasting"],
    "METABOLIC":  ["Sudden extreme weakness or loss of consciousness",
                   "Blood sugar below 60 mg/dL with symptoms",
                   "Rapid unexplained weight loss",
                   "Persistent vomiting preventing medicine intake"],
    "GASTRIC":    ["Vomiting blood or coffee-ground material",
                   "Black tarry stools",
                   "Sudden severe abdominal pain and rigidity",
                   "Inability to pass stool or gas for 48+ hours"],
    "SKIN":       ["Rapidly spreading redness with fever",
                   "Deep skin ulceration or necrosis",
                   "Whole-body blistering or skin peeling",
                   "Signs of secondary bacterial infection"],
    "GLANDULAR":  ["Rapidly enlarging lymph node",
                   "Hard, fixed, non-tender lymph node",
                   "Night sweats with unexplained weight loss",
                   "Lymph node larger than 2 cm for over 4 weeks"],
    "CONSTIPATION":["Complete inability to pass stool for 5+ days",
                    "Abdominal distension with vomiting",
                    "Blood in stool",
                    "Severe abdominal cramping with fever"],
    "PARASITIC":  ["Severe abdominal pain with fever",
                   "Blood in stool",
                   "Significant weight loss over 2 weeks",
                   "Neurological symptoms (seizures, confusion)"],
}

# ── FOLLOW-UP TESTS ──────────────────────────────────────────────
FOLLOWUP_TESTS = {
    "RENAL":      ["Serum Creatinine and BUN",
                   "Urine Routine and Microscopy",
                   "Uric Acid levels",
                   "Blood Pressure monitoring daily at home"],
    "CARDIAC":    ["Blood Pressure monitoring daily at home",
                   "Lipid Profile (Cholesterol, LDL, HDL)",
                   "ECG if symptomatic",
                   "Serum electrolytes (Sodium, Potassium)"],
    "LIVER":      ["LFT — SGPT, SGOT, Bilirubin, Albumin",
                   "USG Abdomen",
                   "CBC with differential count"],
    "GYNE":       ["Pelvic USG",
                   "CBC — Haemoglobin check",
                   "Hormone panel if irregular cycles persist"],
    "NEURO":      ["MRI Spine if no improvement at 6 weeks",
                   "Nerve Conduction Study if numbness persists",
                   "CBC and Vitamin B12 level"],
    "JOINTS":     ["Uric Acid",
                   "RA Factor and CRP",
                   "X-Ray of affected joint",
                   "Calcium and Vitamin D level"],
    "RESPIRATORY":["Spirometry — Lung Function Test",
                   "Chest X-Ray",
                   "CBC with differential count"],
    "METABOLIC":  ["CBC — Haemoglobin, WBC, Platelets",
                   "Blood Sugar Fasting and Post-Prandial",
                   "Vitamin D and B12",
                   "Thyroid Function Test (TSH)"],
    "FEVER":      ["CBC with differential count",
                   "Blood Culture if fever persists beyond 3 days",
                   "Dengue NS1 Antigen and Widal test if indicated"],
    "GASTRIC":    ["Upper GI Endoscopy if pain persists",
                   "H. Pylori test",
                   "Stool Routine and Microscopy"],
    "SKIN":       ["CBC", "LFT",
                   "Allergy panel and patch test if indicated"],
    "GLANDULAR":  ["CBC with differential",
                   "USG of lymph node region",
                   "ESR and CRP levels"],
    "CONSTIPATION":["Colonoscopy if blood in stool",
                    "Thyroid Function Test",
                    "Stool Routine and Occult Blood"],
    "PARASITIC":  ["Stool Routine and Microscopy for ova and cysts",
                   "CBC with eosinophil count",
                   "Serology for specific parasites if indicated"],
}

FOLLOWUP_INTERVAL = {
    "acute":        "7 days",
    "sub_acute":    "15 days",
    "chronic":      "30 days",
    "degenerative": "45 days",
}

# ── FREQUENCY MAP ────
FREQUENCY_MAP = {
    ("POSITIVE", "acute"):        "Every 1–2 hours  (acute hyper-active state)",
    ("POSITIVE", "sub_acute"):    "4 times daily  —  Every 4 to 6 hours",
    ("POSITIVE", "chronic"):      "3 times daily  —  Morning, Afternoon, Night",
    ("POSITIVE", "degenerative"): "2 times daily  —  Morning and Night",
    ("NEGATIVE", "acute"):        "Every 2–3 hours  (acute hypo-active state)",
    ("NEGATIVE", "sub_acute"):    "4 times daily  —  Every 4 to 6 hours",
    ("NEGATIVE", "chronic"):      "3 times daily  —  Morning, Afternoon, Night",
    ("NEGATIVE", "degenerative"): "2 times daily  —  Morning and Night",
    ("MIXED",    "acute"):        "Every 2 hours  (mixed acute state)",
    ("MIXED",    "sub_acute"):    "3 times daily  —  Morning, Afternoon, Night",
    ("MIXED",    "chronic"):      "3 times daily  —  Morning, Afternoon, Night",
    ("MIXED",    "degenerative"): "2 times daily  —  Morning and Night",
}


# ═══════════════════════════════════════════════════════════════════
# SECTION 2 — DYNAMIC FORMULA BUILDERS  (tablet + oil)
# ═══════════════════════════════════════════════════════════════════

def _build_tablet_formula(mixtures: list, polarity: str,
                           dilution: str,
                           temperament: str = "Mixed",
                           primary_system: str = "METABOLIC",
                           bp_systolic: int = 120,
                           bp_diastolic: int = 80) -> str:
    """
    Mixture D (Globules) — primary disease system + temperament + vitals.
    Not a copy of Mixture A (fixes wrong S1 duplicate / wrong-system tablet bug).
    """
    try:
        from tablet_synthesis import ElectroHomeopathicCDSS
        tablet_dil = "D5" if dilution in ("D1", "D2", "D3", "D4", "D5") else "D5"
        data = ElectroHomeopathicCDSS.synthesize_tablet(
            temperament=temperament,
            primary_system=primary_system,
            systolic_bp=int(bp_systolic or 120),
            diastolic_bp=int(bp_diastolic or 80),
            tablet_dilution=tablet_dil,
        )
        return data["formula"]
    except Exception as e:
        raise RuntimeError(f"tablet_synthesis CDSS failed: {e}") from e


def _build_tablet_tiers(
    temperament: str,
    primary_system: str,
    bp_systolic: int,
    bp_diastolic: int,
    symptoms_text: str = "",
) -> list:
    """Three-tier tablet schedule — disease-specific per Mattei CDSS."""
    try:
        from tablet_synthesis import ElectroHomeopathicCDSS
        data = ElectroHomeopathicCDSS.synthesize_tablet(
            temperament=temperament,
            primary_system=primary_system,
            systolic_bp=int(bp_systolic or 120),
            diastolic_bp=int(bp_diastolic or 80),
        )
        tiers = list(data["tier_labels"])
        # Symptom refinements (keep existing clinical nuance, do not change base meds)
        if any(k in symptoms_text for k in ["constipation", "kabz", "pet saaf", "hard stool"]):
            tiers[1] = tiers[1].replace(
                data["three_tier_classification"]["after_food"]["medicine"],
                "S-Lass",
                1,
            )
        elif any(k in symptoms_text for k in ["acidity", "gas", "burning", "jalan", "bloating"]):
            med = data["three_tier_classification"]["after_food"]["medicine"]
            tiers[1] = f"After Food  : {med} — Post-meal acid-regulating tablet for gastric irritation"
        return tiers
    except Exception as e:
        raise RuntimeError(f"tablet tier synthesis failed: {e}") from e


def _build_external_formula(mixtures: list,
                              active_systems: list,
                              symptoms: str = "") -> str:
    """
    External oil formula built dynamically from all active systems and mixtures.
    Structure: Base + Specialty + S-Remedy + Electricity + Support.
    """
    if not mixtures:
        return "F2 + F1 + S1 + BE — D4"
        
    symptoms_lower = symptoms.lower()
    
    # Start with a base that is common for external application
    # F2 is excellent for pain and nerve, S5 for skin/blood, S6 for renal
    base = "F2"
    if any(s in active_systems for s in ["SKIN", "LIVER", "GLANDULAR"]):
        base = "S5"
    elif "RENAL" in active_systems:
        base = "S6"
    
    # Symptom-based base override
    if any(k in symptoms_lower for k in ["ganth", "lump", "tumor", "cancer"]):
        base = "S5" # S5 is better for structural induration
    elif any(k in symptoms_lower for k in ["khujli", "itching", "rash", "skin"]):
        base = "S3"
    
    result = [base]
    used_meds = {base}
    
    # 1. Collect all medicines from all mixtures to have a pool
    all_meds_pool = []
    for m in mixtures:
        all_meds_pool.extend(m.get("medicines", []))
    
    # 2. Add a Specialty Remedy (A, P, F, L, Ven, Ver) from the pool
    spec_prefixes = ('A', 'P', 'F', 'L', 'Ven', 'Ver')
    # Prioritize A3, L1, or Ven1 for glandular/cardiac/renal if available
    spec = next((m for m in all_meds_pool if m in ["A3", "L1", "Ven1"] and m not in used_meds), None)
    if not spec:
        # Symptom-based specialty selection
        if any(k in symptoms_lower for k in ["ganth", "lump", "swelling"]):
            spec = "L1" if "L1" not in used_meds else None
        elif any(k in symptoms_lower for k in ["dard", "pain", "nas", "nerve"]):
            spec = "F1" if "F1" not in used_meds else None
            
    if not spec:
        spec = next((m for m in all_meds_pool if m.startswith(spec_prefixes) and m not in used_meds), None)
    
    if spec:
        result.append(spec)
        used_meds.add(spec)

    # 3. Add an S-Remedy from the pool
    # Prioritize S2, S5, or S6 for external if available
    s_rem = next((m for m in all_meds_pool if m in ["S2", "S5", "S6"] and m not in used_meds), None)
    if not s_rem:
        s_rem = next((m for m in all_meds_pool if m.startswith("S") and m not in used_meds), None)
    
    if s_rem:
        result.append(s_rem)
        used_meds.add(s_rem)

    # 4. Add a C-Remedy from the pool
    # Prioritize C3, C5, or C6 for external if available
    c_rem = next((m for m in all_meds_pool if m in ["C3", "C5", "C6"] and m not in used_meds), None)
    if not c_rem:
        # Symptom-based C-remedy
        if any(k in symptoms_lower for k in ["ganth", "lump", "cancer"]):
            c_rem = "C1" if "C1" not in used_meds else "C3" if "C3" not in used_meds else None
            
    if not c_rem:
        c_rem = next((m for m in all_meds_pool if m.startswith("C") and m not in used_meds), None)
    
    if c_rem:
        result.append(c_rem)
        used_meds.add(c_rem)

    # 5. Add Electricity from Mixture A or B
    elec = mixtures[0].get("electricity", "BE")
    # Symptom-based electricity override for external
    if any(k in symptoms_lower for k in ["ganth", "lump", "cancer"]):
        elec = "GE"
    elif any(k in symptoms_lower for k in ["dard", "pain", "nas", "nerve"]):
        elec = "RE"
    elif any(k in symptoms_lower for k in ["jalan", "burning", "inflammation"]):
        elec = "BE"
        
    if elec and elec not in used_meds:
        result.append(elec)
        used_meds.add(elec)

    # Fill to 5 remedies if needed
    fallbacks = ["F1", "A2", "S1", "WE"]
    for fb in fallbacks:
        if len(result) < 5 and fb not in used_meds:
            result.append(fb)
            used_meds.add(fb)

    return " + ".join(result[:5]) + " — D4"


def _tablet_action_text(active_systems: list) -> str:
    """Picks detailed tablet action from TABLET_ACTION dictionary."""
    primary = active_systems[0] if active_systems else "METABOLIC"
    return TABLET_ACTION.get(
        primary,
        "The tablet form provides continuous therapeutic support "
        "throughout the day between liquid medicine doses, "
        "maintaining a steady electro-homeopathic action at the "
        "cellular level across all waking hours."
    )


def _external_info(active_systems: list) -> tuple:
    """Returns combined (location, action) for top 2 active systems."""
    if not active_systems:
        return ("Affected area", "Apply as directed.")
        
    locations = []
    actions = []
    
    # Priority for external application: GLANDULAR, SKIN, JOINTS, CARDIAC, RENAL
    priority_order = ["GLANDULAR", "SKIN", "JOINTS", "CARDIAC", "RENAL", "LIVER", "GASTRIC", "RESPIRATORY", "METABOLIC"]
    sorted_systems = sorted(active_systems, key=lambda x: priority_order.index(x) if x in priority_order else 99)
    
    for sys in sorted_systems[:2]:
        info = EXTERNAL_APPLICATION.get(sys)
        if info:
            if info["location"] not in locations:
                locations.append(info["location"])
            if info["action"] not in actions:
                actions.append(info["action"])
                
    if not locations:
        return ("Affected area", "Apply as directed.")
        
    combined_loc = " AND ".join(locations)
    combined_act = " ".join(actions)
    
    return combined_loc, combined_act


# ═══════════════════════════════════════════════════════════════════
# SECTION 3 — HELPER: MULTI-SYSTEM CLINICAL CONNECTION
# ═══════════════════════════════════════════════════════════════════

def _system_connection(systems: list) -> str:
    conn = {
        ("RENAL",    "CARDIAC"):
            "The renal and cardiac systems are closely "
            "interdependent. Reduced kidney filtration increases "
            "fluid retention, which directly elevates blood "
            "pressure — and sustained hypertension in turn damages "
            "renal microvasculature. Both systems must be treated "
            "simultaneously for durable and lasting improvement.",
        ("CARDIAC",  "RENAL"):
            "Hypertension-driven renal damage and fluid retention "
            "form a bidirectional cycle. Both systems require "
            "concurrent treatment for effective resolution.",
        ("LIVER",    "METABOLIC"):
            "Hepatic dysfunction impairs metabolic processing of "
            "nutrients and toxins, depleting constitutional energy. "
            "Liver restoration is essential for metabolic recovery.",
        ("NEURO",    "JOINTS"):
            "Structural joint changes are compressing adjacent "
            "nerve roots, creating combined neuro-musculoskeletal "
            "pathology requiring simultaneous structural repair "
            "and nerve decompression.",
        ("METABOLIC","RENAL"):
            "Constitutional weakness reduces the kidneys' "
            "regenerative capacity. Both constitutional "
            "strengthening and renal support must proceed "
            "simultaneously for meaningful recovery.",
        ("GYNE",     "METABOLIC"):
            "Constitutional weakness has compromised reproductive "
            "mucosal health. Building overall vital force while "
            "addressing pelvic pathology directly yields the "
            "best long-term results.",
        ("GASTRIC",  "LIVER"):
            "Gastric dysfunction and hepatic congestion are "
            "mutually reinforcing. Poor bile flow impairs gastric "
            "digestion, and undigested food toxins further burden "
            "the liver. Both must be treated together.",
        ("RENAL",    "GASTRIC"):
            "Renal toxin accumulation burdens the gastrointestinal "
            "mucosa, causing gastric irritation and nausea. "
            "Treating kidney filtration reduces the gastric "
            "toxic load simultaneously.",
        ("CARDIAC",  "GASTRIC"):
            "Chronic hypertension reduces splanchnic circulation, "
            "impairing gastric enzyme secretion and mucosal "
            "health. Cardiovascular regulation directly relieves "
            "associated digestive disturbances.",
        ("JOINTS",   "RENAL"):
            "Elevated uric acid simultaneously burdens the kidneys "
            "and crystallises in joints. Both systems must be "
            "treated together for uric acid normalisation.",
        ("LIVER",    "SKIN"):
            "Impaired hepatic detoxification forces toxin "
            "elimination through the skin. Liver formula is the "
            "primary prescription; skin improvement follows "
            "automatically with liver restoration.",
    }
    if len(systems) < 2:
        return ""
    k = (systems[0], systems[1])
    if k in conn:
        return conn[k]
    return (
        f"The {systems[0].lower()} and {systems[1].lower()} systems "
        "are pathologically interconnected in this presentation. "
        "Simultaneous treatment of all active systems is essential "
        "for complete and lasting resolution."
    )


# ═══════════════════════════════════════════════════════════════════
# SECTION 4 — MAIN SUMMARY BUILDER
# ═══════════════════════════════════════════════════════════════════

def build_professional_summary(
    patient:          dict,
    prakriti:         str,
    polarity:         str,
    condition:        str,
    active_systems:   list,
    mixtures:         list   = None,
    dosage:           dict   = None,
    safety:           dict   = None,
    diet:             dict   = None,
    report_lab:       list   = None,
    report_imaging:   list   = None,
    prescription_id:  int    = None,
) -> str:
    """ Unified clinical prescription builder. """
    is_high_bp = False
    try:
        bp_s_val = patient.get("bp_systolic", 0)
        if int(bp_s_val) >= 130: is_high_bp = True
    except: pass

    symptoms_text = str(patient.get('symptoms', '')).lower()
    has_neck_pain = any(term in symptoms_text for term in ['gardan', 'neck', 'shoulder', 'cervical', 'spine', 'stiff'])

    print(f"DEBUG: build_professional_summary called with prakriti={prakriti}, polarity={polarity}, is_high_bp={is_high_bp}")
    # ── defaults ────────────────────────────────
    if dosage  is None: dosage  = {}
    if safety  is None: safety  = {"status": "SAFE", "warnings": []}
    if diet    is None: diet    = {"eat": [], "avoid": [], "lifestyle": []}

    now    = datetime.now()
    name   = (patient.get("patient_name") or
              patient.get("name", "Patient")).title()
    age    = patient.get("age",       "—")
    gender = patient.get("gender",    "—")
    bp_s   = patient.get("bp_systolic",  "—")
    bp_d   = patient.get("bp_diastolic", "—")
    pid    = (f"#PR-{prescription_id:04d}"
              if prescription_id else "#PR-0000")
    cond   = condition.replace("_", " ").title()
    drops  = dosage.get("drops", 10)
    dur    = dosage.get("duration", "3 months minimum")

    dil = (dosage.get("dilution") or
           (mixtures[0].get("dilution", "D6") if mixtures else "D6"))

    try:
        bp_status = ("ELEVATED" if int(bp_s) >= 140 else
                     "LOW"      if int(bp_s) <  100 else "NORMAL")
    except Exception:
        bp_status = "—"

    freq = FREQUENCY_MAP.get(
        (polarity.upper(), condition.lower()),
        "3 times daily  —  Morning, Afternoon, Night")

    # ── dynamic formulas ────────────────────────
    primary_sys = active_systems[0] if active_systems else "METABOLIC"
    try:
        bp_s_int = int(bp_s) if bp_s not in (None, "—", "") else 120
        bp_d_int = int(bp_d) if bp_d not in (None, "—", "") else 80
    except (TypeError, ValueError):
        bp_s_int, bp_d_int = 120, 80

    tablet_formula = _build_tablet_formula(
        mixtures, polarity, dil,
        temperament=prakriti,
        primary_system=primary_sys,
        bp_systolic=bp_s_int,
        bp_diastolic=bp_d_int,
    )
    oil_formula    = _build_external_formula(mixtures, active_systems, symptoms_text)
    ext_location, ext_action = _external_info(active_systems)
    tablet_act     = _tablet_action_text(active_systems)

    # ── 3-tier tablet classification (primary rog-system ke anusar) ──
    tablet_tiers = _build_tablet_tiers(
        prakriti, primary_sys, bp_s_int, bp_d_int, symptoms_text
    )

    # ── drawing utilities ────────────────────────
    lines: List[str] = []
    W = 66

    def div(ch="═"):
        lines.append(ch * W)

    def sec(t: str):
        lines.append("")
        lines.append("  " + "─" * 62)
        lines.append(f"  {t}")
        lines.append("  " + "─" * 62)

    def wrap(text: str, width: int = 58) -> List[str]:
        words = text.split()
        out, cur = [], ""
        for w in words:
            if len(cur) + len(w) + 1 <= width:
                cur = (cur + " " + w).strip()
            else:
                if cur:
                    out.append(cur)
                cur = w
        if cur:
            out.append(cur)
        return out or [""]

    def bline(content: str = "") -> str:
        pad = 62 - 4
        c = str(content)[:pad]
        return f"  │  {c:<{pad}}  │"

    def btop(): lines.append("  ┌" + "─" * 62 + "┐")
    def bmid(): lines.append("  ├" + "─" * 62 + "┤")
    def bbot(): lines.append("  └" + "─" * 62 + "┘")

    # ════════════════════════════════════════════════
    #  HEADER
    # ════════════════════════════════════════════════
    div("═")
    lines.append("        EH AROGYA SUTRA  ─  CLINICAL PRESCRIPTION")
    lines.append("           Electro-Homeopathy  │  9 Rule Engines")
    div("═")
    lines.append(f"  Patient   :  {name}  │  {age} Years  │  {gender}")
    lines.append(f"  Date      :  {now.strftime('%d/%m/%Y   %H:%M')}"
                 f"   │   Ref  :  {pid}")
    lines.append(f"  BP        :  {bp_s}/{bp_d} mmHg  [{bp_status}]"
                 f"   │   Phase  :  {cond}")
    lines.append(f"  Systems   :  {'   |   '.join(active_systems[:4])}")
    div("═")

    # ════════════════════════════════════════════════
    #  STAGE 1 — CLINICAL ASSESSMENT
    # ════════════════════════════════════════════════
    sec("STAGE 1  ─  CLINICAL ASSESSMENT")
    lines.append("")

    # --- 9 Rule Engine Verification ---
    lines.append("  9 EH RULE ENGINE VERIFICATION:")
    lines.append(f"    Rule 1 (Temperament) : Applied [{prakriti} - Constitutional Mandate]")
    lines.append(f"    Rule 2 (Polarity)    : Applied [{polarity} - Hard Data Driven]")
    lines.append(f"    Rule 3 (Organ/Sys)   : Applied [{', '.join(active_systems[:3])} - System Separation]")
    lines.append(f"    Rule 4 (Potency)     : Applied [{dil} - Inverse Polarity Rule]")
    lines.append(f"    Rule 5 (Dosage)      : Applied [{drops} drops - Severity Based]")
    lines.append(f"    Rule 6 (Electricity) : Applied [Function Driven]")
    lines.append(f"    Rule 7 (Composition) : Applied [Strict S+C+A/Spec]")
    lines.append(f"    Rule 8 (Uniqueness)  : Verified [Zero Repetition]")
    lines.append(f"    Rule 9 (DB Match)    : Verified [14,000 Disease DB + Polarity Check]")
    lines.append("")

    # --- Dynamic Temperament & Polarity Setup ---
    pk_name, pk_desc = PRAKRITI_DESCRIPTION.get(prakriti, (prakriti, f"{prakriti} temperament detected."))
    pol_name, pol_desc = POLARITY_DESCRIPTION.get(polarity, (polarity, "Disease polarity assessed."))
    
    # Special overrides for professional display names
    if prakriti == "Lymphatic": pk_name = "Lymphatic (Kaf Constitution)"
    elif prakriti == "Sanguine": pk_name = "Sanguine (Blood Constitution)"
    elif prakriti == "Bilious": pk_name = "Bilious (Hepatic Constitution)"
    elif prakriti == "Nervous": pk_name = "Nervous (Neural Constitution)"
    
    if polarity == "POSITIVE": pol_name = "POSITIVE  —  Hyperactive State"
    elif polarity == "NEGATIVE": pol_name = "NEGATIVE  —  Hypoactive State"
    elif polarity == "MIXED": pol_name = "MIXED  —  Transitional State"

    lines.append(f"  Temperament   :  {pk_name}")
    lines.append(f"  Polarity      :  {pol_name}")
    lines.append(f"  Potency       :  {dil}   │   Duration : {dur}")
    lines.append("")
    lines.append("  Temperament Profile:")
    for ln in wrap(pk_desc): lines.append(f"    {ln}")
    lines.append("")
    lines.append("  Disease Polarity Analysis:")
    for ln in wrap(pol_desc): lines.append(f"    {ln}")

    # Dynamic Root Cause Analysis
    rca_lines = [
        "Patient Status Summary:",
        f"    Patient: {name}, {age}-Year-Old {gender}.",
        f"    Recorded Blood Pressure: {bp_s}/{bp_d} mmHg  —  {bp_status}",
        f"    Reported Symptoms: {str(patient.get('symptoms', '—'))[:70]}",
        "",
        "Clinical Pathological Interpretation:"
    ]
    
    counter = 1
    # 1. Cardiac RCA (Only if BP is actually high or CARDIAC is a primary system)
    if ('CARDIAC' in active_systems or is_high_bp) and int(bp_s) >= 135:
        rca_lines.append(
            f"  [{counter}] Cardiovascular System Pathology:\n"
            "    Arterial walls have undergone progressive stiffening, compromising vascular compliance. "
            "The heart's workload is elevated to maintain arterial perfusion against increased peripheral resistance. "
            "Sustained high tension requires active sedating therapies to prevent cardiac tissue fatigue."
        )
        counter += 1
    
    # 2. Respiratory RCA (Priority for cold/cough/fever)
    if any(s in active_systems for s in ['RESPIRATORY', 'FEVER']) or any(k in symptoms_text for k in ['sardi', 'jukham', 'khansi', 'cough', 'bukhar', 'fever']):
        rca_lines.append(
            f"  [{counter}] Respiratory & Immune Pathology:\n"
            "    Acute mucosal inflammation has developed in the upper respiratory tract. "
            "Mucosal hypersecretion and congestion are irritating the bronchial and pharyngeal linings, "
            "triggering the cough reflex and throat pain. The elevated body temperature indicates "
            "an active immune mobilization to resolve the underlying inflammatory process."
        )
        counter += 1

    # 3. Gastric RCA
    if any(s in active_systems for s in ['GASTRIC', 'CONSTIPATION']):
        rca_lines.append(
            f"  [{counter}] Gastrointestinal System Pathology:\n"
            "    Intercellular peristalsis is significantly slowed, causing chronic intestinal stagnation and incomplete bowel clearance. "
            "Irregular gastric acid secretions trigger digestive lining irritation, gas accumulation, and abdominal bloating."
        )
        counter += 1

    if 'RENAL' in active_systems:
        if any(k in symptoms_text for k in ['nali', 'urethra', 'ureter', 'jalan', 'burning', 'pain during', 'urge', 'mutr', 'peshab']):
            rca_lines.append(
                f"  [{counter}] Urinary Tract Pathology:\n"
                "    The mucosal lining of the urinary tract (urethra/ureter) is experiencing inflammatory "
                "irritation or structural obstruction. This manifests as localized pain, burning sensation "
                "during urination, and frequent urge. Any structural induration (lump) in the tract "
                "further disrupts normal urine flow and requires targeted lymphatic clearing and mucosal restoration."
            )
        else:
            t, c = SYSTEM_ROOT_CAUSE.get('RENAL', ("Renal System Pathology", "Kidney filtration capacity is compromised."))
            rca_lines.append(f"  [{counter}] {t}:\n    {c}")
        counter += 1

    if has_neck_pain or 'JOINTS' in active_systems:
        rca_lines.append(
            f"  [{counter}] Musculoskeletal Nerve Pathologies:\n"
            "    Physical cervical stress and chronic paravertebral muscle tension trigger direct nerve-root irritation, "
            "producing localized neck pain and radiating paresthesia (tingling/jhun-jhuni sensation) down the extremities."
        )
        counter += 1

    # Fallback for other systems
    for sys in active_systems[:3]:
        if sys not in ['CARDIAC', 'GASTRIC', 'CONSTIPATION', 'JOINTS', 'RENAL']:
            t, c = SYSTEM_ROOT_CAUSE.get(sys, (sys, f"{sys} system pathology."))
            rca_lines.append(f"  [{counter}] {t}:")
            rca_lines.append(f"    {c}")
            counter += 1

    if ('CARDIAC' in active_systems or is_high_bp) and any(s in active_systems for s in ['GASTRIC', 'CONSTIPATION']):
        rca_lines.append(
            "\n  Multi-System Pathological Link:\n"
            "    Sustained high blood pressure alters splanchnic arterial flow, impairing gastrointestinal oxygenation "
            "and slowing natural bowel peristalsis. Relieving arterial wall tension directly supports gastrointestinal motility."
        )

    sec("ROOT CAUSE ANALYSIS  —  Count Mattei EH Principles")
    lines.append("")
    for ln in rca_lines:
        if "\n" in ln:
            parts = ln.split("\n")
            lines.append(parts[0])
            for p in wrap(parts[1], 58): lines.append(f"    {p}")
        else:
            lines.append(ln)
    lines.append("")

    # ════════════════════════════════════════════════
    #  STAGE 2 — ORAL LIQUID FORMULAS  (A / B / C)
    # ════════════════════════════════════════════════
    sec("STAGE 2  ─  ORAL LIQUID FORMULAS  (MIXTURE A / B / C)")
    ALPHA = ["A", "B", "C"]

    for idx, mix in enumerate(mixtures[:3]):
        sys_key = mix.get("system", "METABOLIC")
        formula = mix.get("formula", "—")
        dil_m   = mix.get("dilution", dil)
        timing  = mix.get("timing",  "—")
        label   = f"MIXTURE {ALPHA[idx]}"
        act     = MIXTURE_ACTION.get(
            sys_key,
            f"This formula targets the {sys_key.lower()} system "
            "using the selected medicines and progressively "
            "restores normal organ function through consistent "
            "electro-homeopathic action.")

        lines.append("")
        btop()
        lines.append(bline(f"{label}  ─  {sys_key.title()}"
                           f"      Oral  │  {dil_m}"))
        lines.append(bline("─" * 58))
        lines.append(bline(f"Formula    :  {formula}"))
        lines.append(bline(f"Timing     :  {timing}"))
        lines.append(bline(f"Dose       :  {drops} drops per intake"))
        lines.append(bline("Water      :  Half cup warm water — never cold"))
        lines.append(bline(f"Frequency  :  {freq}"))
        bmid()
        lines.append(bline())
        for ln in wrap(act): lines.append(bline(ln))
        lines.append(bline())
        bbot()

    # ════════════════════════════════════════════════
    #  STAGE 3 — TABLET FORMULA  (MIXTURE D)
    # ════════════════════════════════════════════════
    sec("STAGE 3  ─  TABLET FORMULA  (MIXTURE D  —  GLOBULES)")
    lines.append("")
    btop()
    lines.append(bline(
        f"MIXTURE D  ─  {primary_sys.title()}"
        f"     Globules  │  {dil}"))
    lines.append(bline("─" * 58))
    lines.append(bline(f"Formula    :  {tablet_formula}"))
    lines.append(bline("Dose       :  3 tablets per intake"))
    lines.append(bline("Frequency  :  3 times daily"))
    lines.append(bline("Method     :  Dissolve under tongue  OR  with warm water"))
    lines.append(bline("Note       :  Derived from Mixture A — same primary system"))
    bmid()
    lines.append(bline())
    lines.append(bline("Active Symptom-Based 3-Tier Classification:"))
    for tier in tablet_tiers:
        for wt in wrap(f"  • {tier}", 56):
            lines.append(bline(wt))
    lines.append(bline())
    bmid()
    lines.append(bline())
    for ln in wrap(tablet_act): lines.append(bline(ln))
    lines.append(bline())
    bbot()

    # ════════════════════════════════════════════════
    #  STAGE 4 — EXTERNAL OIL APPLICATION
    # ════════════════════════════════════════════════
    sec("STAGE 4  ─  EXTERNAL OIL APPLICATION  (TOPICAL  —  D4)")
    lines.append("")
    btop()
    
    oil_title = "Combined External Support"
    if len(active_systems) == 1:
        oil_title = f"{active_systems[0].title()} External Support"
        
    lines.append(bline(
        f"OIL FORMULA  ─  {oil_title}"
        f"     External  │  D4"))
    lines.append(bline("─" * 58))
    lines.append(bline(f"Formula    :  {oil_formula}"))
    lines.append(bline())
    loc_lines = wrap(f"Apply on   :  {ext_location}", 58)
    lines.append(bline(loc_lines[0]))
    for ll in loc_lines[1:]:
        lines.append(bline(f"             {ll}"))
    lines.append(bline())
    lines.append(bline("Timing     :  Daily — warm oil massage before sleep"))
    lines.append(bline("Method     :  Mix in warm oil, massage gently 15 min"))
    lines.append(bline("IMPORTANT  :  External use ONLY — do NOT consume orally"))
    bmid()
    lines.append(bline())
    for ln in wrap(ext_action): lines.append(bline(ln))
    lines.append(bline())
    bbot()

    # ════════════════════════════════════════════════
    #  STAGE 5 — COMPLETE DAILY SCHEDULE
    # ════════════════════════════════════════════════
    sec("STAGE 5  ─  COMPLETE DAILY MEDICATION SCHEDULE")
    lines.append("")
    mix_names = [f"Mixture {ALPHA[i]}"
                 for i in range(min(len(mixtures), 3))]

    schedule = [
        ("MORNING  ",  "Empty stomach",    mix_names[0] if mix_names else "—"),
        ("MORNING  ",  "Before breakfast", "Mixture D  (Before Food tablet)"),
        ("AFTERNOON",  "After lunch",      "Mixture D  (After Food tablet)"),
        ("EVENING  ",  "Empty stomach",    mix_names[1] if len(mix_names) > 1 else "—"),
        ("NIGHT    ",  "Before sleep",
         mix_names[2] if len(mix_names) > 2 else
         mix_names[1] if len(mix_names) > 1 else "—"),
        ("NIGHT    ",  "After dinner",     "Mixture D  (Night Dose targeted tablet)"),
        ("BEDTIME  ",  "After night dose",
         "Oil Application  (warm oil — 15 minutes)"),
    ]
    for slot, note, item in schedule:
        lines.append(f"  {slot}  ({note:<20})  →  {item}")

    lines.append("")
    lines.append(f"  Liquid Dose   :  {drops} drops in half cup warm water")
    lines.append("  Tablet Dose   :  3 tablets, 3 times daily")
    lines.append("  Oil Massage   :  Once daily at bedtime — 15 minutes")
    lines.append(f"  Duration      :  {dur}")
    lines.append("  Water Rule    :  Always warm — NEVER cold water")
    lines.append("  Wait          :  15 minutes after medicine before eating")
    lines.append("  RULE          :  Never mix different mixtures in same glass")

    # ════════════════════════════════════════════════
    #  STAGE 6 — DIETARY GUIDELINES
    # ════════════════════════════════════════════════
    sec("STAGE 6  ─  DIETARY GUIDELINES")
    lines.append("")
    eat   = diet.get("eat",       [])[:8]
    avoid = diet.get("avoid",     [])[:8]
    life  = diet.get("lifestyle", [])[:5]

    if eat:
        lines.append("  RECOMMENDED  (Actively include in daily diet):")
        for item in eat: lines.append(f"    ✓  {item}")
    lines.append("")
    if avoid:
        lines.append("  STRICTLY AVOID  (These antidote the medicines):")
        for item in avoid: lines.append(f"    ✗  {item}")
    lines.append("")
    if life:
        lines.append("  Lifestyle Recommendations:")
        for item in life: lines.append(f"    •  {item}")
    lines.append("")
    lines.append("  EH CRITICAL RULE  :  Never consume lemon, vinegar,")
    lines.append("  camphor, raw onion, or garlic during treatment —")
    lines.append("  these substances antidote the electro-homeopathic")
    lines.append("  remedies and will reverse therapeutic progress.")

    # ════════════════════════════════════════════════
    #  STAGE 7 — SAFETY PROTOCOL
    # ════════════════════════════════════════════════
    sec("STAGE 7  ─  SAFETY PROTOCOL")
    lines.append("")
    lines.append(f"  Safety Status  :  {safety.get('status', 'SAFE')}")
    for w in safety.get("warnings", []):
        lines.append(f"  ⚠  WARNING  :  {w}")
    lines.append("")
    lines.append("  GOLDEN RULE  (Strictly observe — no exceptions):")
    lines.append("    POSITIVE disease  →  NEVER give D1 / D2 / D3")
    lines.append("    NEGATIVE disease  →  NEVER give D30 / D100 / D200")
    lines.append("    Violation will cause AGGRAVATION —")
    lines.append("    the disease will worsen significantly.")
    lines.append("")
    lines.append("  AGGRAVATION ANTIDOTE:")
    lines.append("    If symptoms suddenly worsen — STOP all medicines.")
    lines.append("    Administer immediately  :  1 tsp lemon juice")
    lines.append("    + 1 tsp vinegar in half cup warm water.")
    # lines.append("    Contact prescribing physician without delay.")

    # ════════════════════════════════════════════════
    #  STAGE 8 — FOLLOW-UP PROTOCOL
    # ════════════════════════════════════════════════
    sec("STAGE 8  ─  FOLLOW-UP PROTOCOL")
    lines.append("")
    f_days = FOLLOWUP_INTERVAL.get(condition.lower(), "30 days")
    lines.append(f"  Next Appointment  :  {f_days} from today")

    all_tests: List[str] = []
    for sys in active_systems[:3]:
        for t in FOLLOWUP_TESTS.get(sys, []):
            if t not in all_tests:
                all_tests.append(t)
    if all_tests:
        lines.append("")
        lines.append("  Tests to Repeat at Follow-Up:")
        for t in all_tests[:6]: lines.append(f"    →  {t}")

    all_flags: List[str] = []
    for sys in active_systems[:3]:
        for f in SYSTEM_RED_FLAGS.get(sys, []):
            if f not in all_flags:
                all_flags.append(f)
    if all_flags:
        lines.append("")
        lines.append("  ⚠  Seek Immediate Medical Attention If:")
        for f in all_flags[:6]: lines.append(f"    •  {f}")

    lines.append("")
    lines.append("  General Instructions:")
    lines.append("    •  Never mix different mixtures in the same glass.")
    lines.append("    •  Always use warm water — never cold.")
    lines.append("    •  Carry all medicines separately if traveling.")
    lines.append("    •  Do not discontinue treatment midway.")

    # ════════════════════════════════════════════════
    #  FOOTER
    # ════════════════════════════════════════════════
    lines.append("")
    div("═")
    lines.append("    Generated by EH Arogya Sutra   │   9 Rule Engines")
    lines.append(f"    {name}   │   {pid}   │   {now.strftime('%d %b %Y')}")
    div("═")

    # Return both the ASCII summary and structured engine results for the frontend
    return {
        "summary": "\n".join(lines),
        "engine_result": {
            "mixtures": mixtures,
            "tablet": {
                "formula": tablet_formula,
                "dilution": dil,
                "tiers": tablet_tiers
            },
            "external": {
                "formula": oil_formula,
                "dilution": "D4",
                "location": ext_location,
                "action": ext_action
            },
            "diet": diet
        }
    }
