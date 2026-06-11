import sqlite3
import os
import psycopg
from psycopg.rows import dict_row
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
REPO_ROOT = Path(__file__).resolve().parent.parent.parent
load_dotenv(REPO_ROOT / ".env")

DB_PATH = "eh-expert-engine/data/electrohomeopathy.db"
os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)

MISSING_MEDICINES = [
    ("S1","Scrofoloso 1","S-Group","Lymphatic/Mixed",
     "General Lymphatic Network","The lymphatic system maintains fluid balance and immunity.",
     "General Debility / Anemia","General debility from lymphatic sluggishness.",
     "Master lymph purifier; raises vital force."),
    ("S2","Scrofoloso 2","S-Group","Pelvic mucosa",
     "Pelvic Mucosa","Pelvic mucosa includes endometrium and cervix.",
     "Leucorrhea / Pelvic Catarrh","Mucosal inflammation causing white discharge.",
     "Regulates pelvic mucosal secretions; controls safed pani."),
    ("S3","Scrofoloso 3","S-Group","Sanguine/Mixed",
     "Skin Dermis","Dermis contains blood capillaries and sebaceous glands.",
     "Skin Eruptions / Eczema","Blood toxin overflow drives eruptive skin conditions.",
     "Deep skin repair; purifies blood capillaries."),
    ("S5","Scrofoloso 5","S-Group","Biliary/Mixed",
     "Liver Hepatocytes","Hepatocytes arranged in lobules around central veins.",
     "Jaundice / Hepatic Stasis","Impaired hepatic processing causes jaundice.",
     "Stimulates hepatocyte function; regulates bile secretion."),
    ("S6","Scrofoloso 6","S-Group","Lymphatic",
     "Renal Parenchyma Glomeruli","Renal parenchyma contains nephrons for filtration.",
     "Oliguria / Renal Edema","Impaired glomerular filtration causes edema.",
     "Stimulates glomerular filtration; clears edema."),
    ("S10","Scrofoloso 10","S-Group","Mixed",
     "Gastric Mucosa","Gastric mucosa contains parietal and chief cells.",
     "Acidity / Indigestion / Gas","Mucosal weakness causes gas and bloating.",
     "Regulates gastric enzyme secretion; corrects bloating."),
    ("S11","Scrofoloso 11","S-Group","Mixed",
     "Digestive Glands","Pancreas secretes digestive enzymes.",
     "Indigestion / Enzyme Deficiency","Enzyme deficiency leads to malabsorption.",
     "Stimulates digestive gland secretions."),
    ("S12","Scrofoloso 12","S-Group","Mixed",
     "Intestinal Mucosa","Villi and microvilli increase absorptive surface.",
     "Chronic Constipation","Reduced peristalsis causes constipation.",
     "Acts on intestinal mucosal tone; improves peristalsis."),
    ("C1","Canceroso 1","C-Group","Lymphatic",
     "Lymphatic Glands","Lymph nodes filter lymph and mount immune responses.",
     "Glandular Congestion / Hard Nodes","Lymphatic congestion causes palpable hardening.",
     "Reduces glandular induration; dissolves hard nodes."),
    ("C2","Canceroso 2","C-Group","Lymphatic",
     "Uterine Endometrium","Endometrium undergoes cyclical changes.",
     "Uterine Disorders / Leucorrhea","Endometrial congestion causes chronic inflammation.",
     "Targets structural uterine congestion; heals endometrium."),
    ("C3","Canceroso 3","C-Group","Sanguine/Mixed",
     "Subcutaneous Tissue","Subcutaneous layer contains adipose and lymph channels.",
     "Chronic Eczema / Non-healing Ulcers","Chronic dermal inflammation with thickening.",
     "Heals chronic skin ulcers at deep subcutaneous level."),
    ("C4","Canceroso 4","C-Group","Nervous/Mixed",
     "Spinal Cord Brain Tissue","Spinal cord contains gray and white matter.",
     "CNS Disorders / Convulsions","CNS disorders include convulsions and neurodegeneration.",
     "Acts on brain and spinal cord structural integrity."),
    ("C5","Canceroso 5","C-Group","Biliary/Mixed",
     "Portal Vein Hepatic Sinusoids","Portal system carries blood from GI tract to liver.",
     "Hepatic Ulcers / Portal Congestion","Portal hypertension leads to liver enlargement.",
     "Heals liver ulcers; drains portal venous congestion."),
    ("C6","Canceroso 6","C-Group","Lymphatic",
     "Renal Interstitium Ureter","Renal interstitium contains connective tissue.",
     "Chronic Nephritis / Urinary Burning","Persistent glomerular inflammation.",
     "Anti-inflammatory on kidney interstitium."),
    ("C10","Canceroso 10","C-Group","Mixed",
     "Large Intestine Rectal Mucosa","Colon absorbs water from undigested food.",
     "Constipation / Colitis","Mucosal inflammation causing mucus stools.",
     "Resolves chronic constipation; heals colitis."),
    ("C13","Canceroso 13","C-Group","Lymphatic",
     "Mammary Glands Endocrine","Mammary glands richly supplied with lymphatics.",
     "Hard Glandular Nodes / Breast Lumps","Focal lymphatic stasis in mammary tissue.",
     "Specific for hard glandular nodes and breast lumps."),
    ("C15","Canceroso 15","C-Group","Mixed",
     "Connective Tissue","Connective tissue forms structural framework of organs.",
     "Tissue Degeneration / Cellular Breakdown","Progressive cellular deterioration.",
     "Arrests tissue breakdown; supports cellular regeneration."),
    ("C17","Canceroso 17","C-Group","Mixed",
     "Mucosal Tissue Multi-system","Mucosal tissue lines digestive and urogenital cavities.",
     "Chronic Ulcers / Mucosal Erosion","Progressive loss of protective epithelial lining.",
     "Heals chronic mucosal ulcers across multiple systems."),
    ("A1","Angioitico 1","A-Group","Sanguine/Mixed",
     "Arterial Walls Aorta","Arterial walls have tunica intima, media and adventitia.",
     "Arterial Stiffness / High BP","Atherosclerosis causes vessel narrowing.",
     "Improves arterial wall elasticity; reduces arteriosclerosis."),
    ("A2","Angioitico 2","A-Group","Sanguine/Mixed",
     "Arterioles Microcirculation","Arterioles regulate blood to capillary beds.",
     "Blood Pressure Imbalance","Arteriolar vasoconstriction raises BP.",
     "Regulates arteriolar tone; normalizes blood pressure."),
    ("A3","Angioitico 3","A-Group","Sanguine/Mixed",
     "Venous Circulation Venous Valves","Venous system returns blood to heart.",
     "Varicose Veins / Venous Insufficiency","Valve incompetence causes blood pooling.",
     "Improves venous return; strengthens venous valves."),
    ("P1","Pectorale 1","P-Group","Mixed",
     "Pleura Thoracic Cavity","Pleura are thin membranes surrounding lungs.",
     "Pleurisy / Thoracic Pain","Pleural inflammation causes sharp chest pain.",
     "Acts on pleura and thoracic cavity; relieves pleuritic pain."),
    ("P2","Pectorale 2","P-Group","Mixed",
     "Trachea Upper Respiratory","Trachea connects larynx to bronchi.",
     "Laryngitis / Tracheal Catarrh","Vocal cord inflammation causes hoarseness.",
     "Clears upper respiratory catarrh; relieves laryngitis."),
    ("P3","Pectorale 3","P-Group","Mixed",
     "Mediastinum Bronchial Lymphatics","Mediastinum contains heart and lymph nodes.",
     "Mediastinal Congestion / Bronchial Lymph","Lymph congestion causes chest heaviness.",
     "Drains mediastinal and bronchial lymphatics."),
    ("P4","Pectorale 4","P-Group","Mixed",
     "Bronchial Tubes Lower Airways","Bronchial tubes branch from trachea.",
     "Chronic Cough / Bronchitis / Asthma","Excess mucus causes persistent cough.",
     "Clears bronchial congestion; dilates bronchioles."),
    ("F1","Febrifugo 1","F-Group","Mixed",
     "Autonomic Nervous System Hypothalamus","Hypothalamus regulates core temperature.",
     "Fever / Backache / Nerve Pain","Hypothalamic thermostat dysregulation.",
     "Sedates pyrexia; regulates autonomic nerve pain."),
    ("F2","Febrifugo 2","F-Group","Mixed",
     "Peripheral Nerves Sciatic Brachial","Sciatic nerve runs from lumbar to leg.",
     "Neuralgia / Sciatica / Shooting Pain","Sciatic nerve compression causes shooting pain.",
     "Relieves peripheral neuralgia and sciatica."),
    ("Ver1","Vermifugo 1","Ver-Group","Mixed",
     "Intestinal Lumen Enteric Wall","Enteric wall contains smooth muscle.",
     "Worm Infestation / Intestinal Parasites","Parasites disrupt intestinal absorption.",
     "Anti-parasitic; creates inhospitable intestinal environment."),
    ("Ver2","Vermifugo 2","Ver-Group","Mixed",
     "Enteric Mucosa Intestinal Immune","GALT provides local immune defense.",
     "Parasitic Toxicity / Post-worm Damage","Parasitic toxins damage mucosal integrity.",
     "Clears parasitic toxins; repairs mucosal damage."),
    ("L1","Linfatico 1","L-Group","Lymphatic",
     "Systemic Lymph Vessels Lymph Nodes","Lymph capillaries collect interstitial fluid.",
     "Lymph Stasis / Diffuse Edema","Lymphatic stasis causes tissue fluid accumulation.",
     "Master systemic lymph drainer; resolves diffuse edema."),
    ("Ven1","Venereo 1","Ven-Group","Mixed",
     "Genitourinary Tissues Mucosa","Urethra and prostate vulnerable to inflammation.",
     "Venereal Disorders / Genital Inflammation","Chronic genitourinary mucosal inflammation.",
     "Clears genitourinary inflammation and chronic discharge."),
    ("S-Lass","Laxativo","Special","Mixed",
     "Sigmoid Colon Lower Intestine","Sigmoid musculature controls propulsion.",
     "Constipation / Lower Intestinal Stasis","Sigmoid peristalsis failure causes stagnation.",
     "Stimulates lower intestinal peristalsis; softens stools."),
    ("APP","Aqua Perla Pelli","Special","Sanguine/Mixed",
     "Epithelial Tissues Skin Surface","Epidermis provides primary barrier.",
     "Skin Care / Epithelial Disorders","Epithelial barrier dysfunction.",
     "Specific for epithelial surface conditions."),
    ("SY","Synthesis","Special","Mixed",
     "Constitutional System Multi-organ","Constitutional system represents overall vital force.",
     "Chronic Weakness / Constitutional Debility","Constitutional bio-energetic depletion.",
     "Constitutional synthesis; rebuilds depleted vital force."),
    ("W.E.","White Electricity","Electricity","Neutral",
     "Nervous System Brain Spinal Cord","CNS comprises brain and spinal cord.",
     "Nervous Disorders / Mental Weakness","Nervous system disorders affect brain.",
     "NEUTRAL bijli — dono shaktiyon ko samaan rakhti hai. Kahin bhi laga sakte hain."),
    ("R.E.","Red Electricity","Electricity","Positive",
     "Peripheral Nervous System Motor Nerves","Motor neurons innervate skeletal muscles.",
     "Nerve Weakness / Paralysis / Anemia","Peripheral nerve weakness manifests as reduced strength.",
     "POSITIVE bijli — stimulant. NEGATIVE rog mein use karo."),
    ("Y.E.","Yellow Electricity","Electricity","Negative",
     "Smooth Muscle Autonomic Ganglia","Smooth muscle found in hollow organs.",
     "Sujan / Fever / Pain / Spasm","Inflammation causes cardinal signs of disease.",
     "NEGATIVE bijli — sedative. POSITIVE rog mein use karo."),
    ("B.E.","Blue Electricity","Electricity","Negative",
     "Venous System Cardiac Chambers","Venous system returns blood to heart.",
     "High BP / Cardiac Disorders / Edema","Hypertension causes increased cardiac workload.",
     "NEGATIVE bijli — venous constrictor, anti-edema. Cardiac + Renal mein."),
    ("G.E.","Green Electricity","Electricity","Negative",
     "Lymphatic System Hepatic Portal","Lymphatic network maintains fluid balance.",
     "Skin Toxins / Lymph Stasis / Tumor","Dermal toxicity from blood impurities.",
     "NEGATIVE bijli — anti-toxic, blood purifier. Skin + Parasitic mein."),
]

def seed_sqlite():
    print("Seeding SQLite...")
    conn = sqlite3.connect(DB_PATH)
    conn.execute("CREATE TABLE IF NOT EXISTS medicines (id TEXT PRIMARY KEY, name TEXT, group_name TEXT, system TEXT, organ TEXT, action TEXT, keywords TEXT, detail TEXT, summary TEXT)")
    
    existing = [r[0] for r in conn.execute("SELECT id FROM medicines").fetchall()]
    added = 0
    for m in MISSING_MEDICINES:
        if m[0] not in existing:
            conn.execute("INSERT INTO medicines VALUES (?,?,?,?,?,?,?,?,?)", m)
            added += 1
    conn.commit()
    total = conn.execute("SELECT COUNT(*) FROM medicines").fetchone()[0]
    print(f"SQLite: Added {added}, Total {total}")
    conn.close()

def seed_postgres():
    print("Seeding PostgreSQL...")
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        user = os.getenv("POSTGRES_USER")
        password = os.getenv("POSTGRES_PASSWORD")
        host = os.getenv("POSTGRES_HOST", "127.0.0.1")
        port = os.getenv("POSTGRES_PORT", "5432")
        db = os.getenv("POSTGRES_DB")
        if user and db:
            from urllib.parse import quote_plus
            pw = quote_plus(password or "")
            db_url = f"postgresql://{user}:{pw}@{host}:{port}/{db}?sslmode=disable"
    
    if not db_url:
        print("DATABASE_URL or POSTGRES_* vars not found in .env")
        return

    try:
        with psycopg.connect(db_url) as conn:
            with conn.cursor() as cur:
                # Check existing codes
                cur.execute("SELECT medicine_code FROM eh_materia_medica")
                existing = {r[0] for r in cur.fetchall()}
                
                added = 0
                for m in MISSING_MEDICINES:
                    code = m[0]
                    # Normalize code for Postgres if needed (e.g. S1 -> S-1)
                    # But the user's list has S1, S2, etc. and the existing has S-1, S-2.
                    # I'll check both.
                    alt_code = code
                    if len(code) > 1 and code[0].isalpha() and code[1:].isdigit():
                        alt_code = f"{code[0]}-{code[1:]}"
                    
                    if code not in existing and alt_code not in existing:
                        # Map 9-tuple to Postgres columns:
                        # medicine_code, group_name, target_system, target_organ, polarity, action, keywords, book_page
                        group = m[2]
                        system = m[3]
                        organ = m[4]
                        # item 5 is action-like, item 8 is summary-like
                        action = f"{m[5]} {m[8]}"
                        # item 6 and 7 are keywords-like
                        keywords = f"{m[6]}, {m[7]}"
                        
                        # Determine polarity from item 3 or 5
                        polarity = "MIXED"
                        if "Positive" in m[3] or "Positive" in m[5]: polarity = "POSITIVE"
                        elif "Negative" in m[3] or "Negative" in m[5]: polarity = "NEGATIVE"
                        elif "Neutral" in m[3] or "Neutral" in m[5]: polarity = "MIXED"
                        elif "Neutral" in m[2]: polarity = "MIXED"

                        cur.execute(
                            """
                            INSERT INTO eh_materia_medica 
                            (medicine_code, group_name, target_system, target_organ, polarity, action, keywords)
                            VALUES (%s, %s, %s, %s, %s, %s, %s)
                            """,
                            (code, group, system, organ, polarity, action, keywords)
                        )
                        added += 1
                
                conn.commit()
                cur.execute("SELECT COUNT(*) FROM eh_materia_medica")
                total = cur.fetchone()[0]
                print(f"PostgreSQL: Added {added}, Total {total}")
    except Exception as e:
        print(f"PostgreSQL error: {e}")

if __name__ == "__main__":
    seed_sqlite()
    seed_postgres()
