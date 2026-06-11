import { useState, useEffect, useCallback } from "react";

// ─── CONFIG ───────────────────────────────────────────────────────────────
const BASE_URL = "http://localhost:5000";

// ─── ELECTRICITIES ────────────────────────────────────────────────────────
const ELEC = {
  "W.E.":{ color:"#9ca3af", bg:"#f9fafb", desc:"White — Systemic neutral stabilizer" },
  "R.E.":{ color:"#ef4444", bg:"#fef2f2", desc:"Red — Stimulant, nerve energizer" },
  "Y.E.":{ color:"#f59e0b", bg:"#fffbeb", desc:"Yellow — Sedative, anti-spasmodic" },
  "B.E.":{ color:"#3b82f6", bg:"#eff6ff", desc:"Blue — Venous constrictor, anti-edema" },
  "G.E.":{ color:"#22c55e", bg:"#f0fdf4", desc:"Green — Anti-toxic, blood purifier" },
};
const ACCENT=["#4f46e5","#0891b2","#be185d","#15803d","#b45309","#7c3aed","#be123c","#0369a1","#4d7c0f","#9333ea","#c2410c","#1d4ed8","#0f766e","#a21caf"];

// ─── CLIENT-SIDE SCORING ENGINE (mirrors Python logic for offline) ─────────
const MEDICINES_34 = {
  S1:{id:"S1",name:"Scrofoloso 1",medicine_group:"S-Group",temperament:"Lymphatic/Mixed",anatomy_term:"General Lymphatic Network",anatomy_details:"The lymphatic system is a network of tissues, organs and vessels that maintain fluid balance and immunity. It includes lymph nodes, spleen, thymus and lymph capillaries throughout the body.",pathology_term:"General Debility / Anemia / Lymphatic Stasis",pathology_details:"General debility refers to systemic weakness caused by lymphatic sluggishness. Anemia involves reduced hemoglobin causing fatigue, pallor and breathlessness. Lymphatic stasis leads to cellular waste accumulation.",description:"Master lymph purifier; activates general metabolism and raises vital force. Foundation remedy for all lymphatic conditions."},
  S2:{id:"S2",name:"Scrofoloso 2",medicine_group:"S-Group",temperament:"Lymphatic/Mixed",anatomy_term:"Pelvic Mucosa & Uterine Lining",anatomy_details:"The pelvic mucosa includes endometrium, cervix and bladder lining. Richly supplied with lymphatic vessels prone to catarrhal conditions under hormonal and lymphatic influence.",pathology_term:"Leucorrhea / Pelvic Catarrh / Cystitis",pathology_details:"Leucorrhea is white or yellowish vaginal discharge caused by mucosal inflammation or lymphatic congestion in the pelvic region, often with pelvic heaviness and backache.",description:"Regulates pelvic mucosal secretions; controls uterine discharge (safed pani) and bladder mucosal inflammation."},
  S3:{id:"S3",name:"Scrofoloso 3",medicine_group:"S-Group",temperament:"Sanguine/Mixed",anatomy_term:"Skin Dermis & Superficial Glands",anatomy_details:"The dermis contains blood capillaries, lymph capillaries, sebaceous glands and sweat glands. Skin eruptions reflect internal lympho-sanguine toxicity overflowing through cutaneous routes.",pathology_term:"Skin Eruptions / Eczema / Rashes / Blisters",pathology_details:"Eczema is chronic inflammatory skin condition with itchy, red, scaly patches. Blood capillary toxin overflow drives eruptive skin conditions through cutaneous elimination pathways.",description:"Deep skin and mucosal repair; purifies blood capillaries; clears eruptive toxins from dermal layers."},
  S5:{id:"S5",name:"Scrofoloso 5",medicine_group:"S-Group",temperament:"Biliary/Mixed",anatomy_term:"Liver Hepatocytes & Bile Ducts",anatomy_details:"Hepatocytes arranged in lobules around central veins. Bile canaliculi collect bile and drain into bile ducts. Portal vein supplies nutrient-rich blood from intestines to liver.",pathology_term:"Jaundice / Hepatic Stasis / Biliary Sluggishness",pathology_details:"Jaundice results from elevated bilirubin due to impaired hepatic processing. Hepatic stasis involves sluggish hepatocyte metabolism and portal venous congestion causing abdominal heaviness.",description:"Stimulates hepatocyte function; regulates bile secretion and portal circulation; clears hepatic congestion."},
  S6:{id:"S6",name:"Scrofoloso 6",medicine_group:"S-Group",temperament:"Lymphatic",anatomy_term:"Renal Parenchyma — Glomeruli & Tubules",anatomy_details:"Renal parenchyma consists of cortex and medulla containing approximately 1 million nephrons. Each nephron includes a glomerulus (filtration unit) and tubular system. Bowman capsule surrounds glomerular capillary tuft.",pathology_term:"Oliguria / Renal Edema / Dropsy",pathology_details:"Oliguria refers to urine output below 400ml per day caused by glomerular filtration rate impairment. Renal edema (sujan) results from sodium and water retention due to reduced filtration capacity.",description:"Stimulates glomerular filtration rate; clears extracellular fluid accumulation causing edema (sujan)."},
  S10:{id:"S10",name:"Scrofoloso 10",medicine_group:"S-Group",temperament:"Mixed",anatomy_term:"Gastric Mucosa & Stomach Wall",anatomy_details:"Stomach wall consists of mucosa, submucosa, muscularis and serosa. Gastric mucosa contains parietal cells (HCl), chief cells (pepsinogen) and mucous cells. Pyloric sphincter controls gastric emptying.",pathology_term:"Acidity / Indigestion / Gas / Bloating",pathology_details:"Gastric acidity results from excess HCl production or mucosal barrier failure. Indigestion involves impaired gastric enzyme activity causing bloating, fullness and abdominal discomfort.",description:"Regulates gastric enzyme secretion; restores mucosal integrity; corrects peristaltic stagnation and bloating."},
  S11:{id:"S11",name:"Scrofoloso 11",medicine_group:"S-Group",temperament:"Mixed",anatomy_term:"Digestive Glands — Pancreas & Salivary",anatomy_details:"Digestive glands include the pancreas, salivary glands and Brunner glands. Pancreas secretes digestive enzymes (amylase, lipase, protease) and insulin coordinating digestive juice production.",pathology_term:"Indigestion / Digestive Enzyme Deficiency",pathology_details:"Digestive enzyme deficiency leads to malabsorption, chronic indigestion and nutritional deficiencies. Pancreatic insufficiency causes fatty stools, weight loss and abdominal cramping.",description:"Stimulates digestive gland secretions; improves enzyme production; corrects malabsorption."},
  S12:{id:"S12",name:"Scrofoloso 12",medicine_group:"S-Group",temperament:"Mixed",anatomy_term:"Intestinal Mucosa — Small & Large Intestine",anatomy_details:"Intestinal mucosa lines the small and large intestine. Villi and microvilli increase absorptive surface area. Goblet cells secrete protective mucus layer throughout the intestinal tract.",pathology_term:"Chronic Constipation / Intestinal Stasis",pathology_details:"Chronic constipation involves reduced intestinal peristalsis causing infrequent difficult defecation. Intestinal stasis leads to toxin reabsorption, bloating and systemic inflammatory effects.",description:"Acts on intestinal mucosal tone; improves peristalsis; resolves chronic constipation and intestinal stagnation."},
  C1:{id:"C1",name:"Canceroso 1",medicine_group:"C-Group",temperament:"Lymphatic",anatomy_term:"Lymphatic Glandular Tissues",anatomy_details:"Lymph nodes are bean-shaped organs containing lymphocytes and macrophages. They filter lymph fluid and mount immune responses. Enlarged nodes indicate lymphatic congestion or infection.",pathology_term:"Glandular Congestion / Hard Nodes / Tumors",pathology_details:"Glandular congestion involves accumulation of lymphatic fluid and cellular debris in lymphoid tissue causing palpable swelling and hardening. Lymphadenopathy indicates systemic lymphatic stasis.",description:"Reduces glandular induration and hypertrophy; dissolves hard lymph nodes and localized tissue masses."},
  C2:{id:"C2",name:"Canceroso 2",medicine_group:"C-Group",temperament:"Lymphatic",anatomy_term:"Uterine Endometrial Tissue",anatomy_details:"The uterus consists of endometrium (inner mucosal lining), myometrium (muscular wall) and perimetrium. Endometrium undergoes cyclical changes under hormonal influence. Lymphatic drainage flows to pelvic lymph nodes.",pathology_term:"Uterine Disorders / Irregular Menses / Leucorrhea",pathology_details:"Uterine pathologies include endometrial congestion, irregular menstruation and mucosal catarrh. Structural changes in uterine tissue lead to chronic pelvic inflammation and abnormal discharge.",description:"Targets structural uterine congestion; heals endometrial and cervical tissue inflammation."},
  C3:{id:"C3",name:"Canceroso 3",medicine_group:"C-Group",temperament:"Sanguine/Mixed",anatomy_term:"Subcutaneous Tissue & Deep Dermis",anatomy_details:"The subcutaneous layer contains adipose tissue, blood vessels and lymph channels. Deep reticular dermis has dense collagen fibers providing skin strength and elasticity for tissue repair.",pathology_term:"Chronic Eczema / Non-healing Ulcers / Deep Sores",pathology_details:"Chronic eczema involves persistent dermal layer inflammation with thickening and lichenification. Non-healing ulcers result from impaired tissue repair mechanisms and chronic lymphatic congestion.",description:"Heals chronic skin and mucosal ulcers at deep subcutaneous level; regenerates damaged dermal tissue."},
  C4:{id:"C4",name:"Canceroso 4",medicine_group:"C-Group",temperament:"Nervous/Mixed",anatomy_term:"Spinal Cord & Brain Tissue",anatomy_details:"The spinal cord is a cylindrical bundle of nerve fibers protected by vertebral column. It contains gray matter (nerve cell bodies) and white matter (myelinated axons) forming the central nervous system.",pathology_term:"CNS Disorders / Convulsions / Cognitive Decline",pathology_details:"CNS disorders include convulsions, epilepsy and progressive neurological degeneration. Impaired cerebrospinal fluid dynamics and neuroinflammation contribute to cognitive and motor dysfunction.",description:"Acts on brain and spinal cord structural integrity; stabilizes cerebrospinal fluid dynamics."},
  C5:{id:"C5",name:"Canceroso 5",medicine_group:"C-Group",temperament:"Biliary/Mixed",anatomy_term:"Portal Vein & Hepatic Sinusoids",anatomy_details:"The portal venous system carries blood from the gastrointestinal tract to the liver. Hepatic sinusoids are specialized capillaries within liver lobules where blood filtration occurs by Kupffer cells.",pathology_term:"Hepatic Ulcers / Portal Congestion / Venous Stasis",pathology_details:"Portal hypertension results from increased resistance to portal venous flow. Hepatic sinusoidal congestion leads to liver enlargement, ascites and portal venous pressure elevation.",description:"Heals liver and abdominal tissue ulcers; drains portal venous congestion; repairs mucosal wall damage."},
  C6:{id:"C6",name:"Canceroso 6",medicine_group:"C-Group",temperament:"Lymphatic",anatomy_term:"Renal Interstitium & Ureter",anatomy_details:"The renal interstitium is connective tissue between nephrons containing interstitial cells, capillaries and lymphatics. The ureter carries urine from kidney to bladder through peristaltic contractions.",pathology_term:"Chronic Nephritis / Urinary Burning / Renal Inflammation",pathology_details:"Chronic nephritis involves persistent glomerular and interstitial inflammation leading to progressive renal function decline. Urinary burning results from mucosal irritation in ureter and bladder.",description:"Regulates structural renal tissues and ureter; anti-inflammatory action on kidney interstitium."},
  C10:{id:"C10",name:"Canceroso 10",medicine_group:"C-Group",temperament:"Mixed",anatomy_term:"Large Intestine & Rectal Mucosa",anatomy_details:"The large intestine (colon) absorbs water and electrolytes from undigested food. Mucosal lining contains goblet cells secreting protective mucus. The rectum stores feces before defecation.",pathology_term:"Constipation / Colitis / Mucus Stools",pathology_details:"Chronic constipation results from reduced intestinal peristalsis and excess water absorption from colonic contents. Colitis involves mucosal inflammation causing mucus-laden loose stools.",description:"Resolves chronic constipation; heals large intestine and rectal mucosal catarrh; restores bowel regularity."},
  C13:{id:"C13",name:"Canceroso 13",medicine_group:"C-Group",temperament:"Lymphatic",anatomy_term:"Glandular Tissue — Mammary & Endocrine",anatomy_details:"Glandular tissues include mammary glands, endocrine glands and exocrine glands. These are richly supplied with lymphatic vessels prone to congestion and induration from chronic lymphatic stasis.",pathology_term:"Hard Glandular Nodes / Breast Lumps / Induration",pathology_details:"Glandular induration involves hardening of glandular tissue due to chronic lymphatic congestion. Breast lumps result from focal lymphatic stasis and cellular proliferation in mammary glandular tissue.",description:"Specific for hard glandular nodes and breast lumps; softens indurated glandular tissue."},
  C15:{id:"C15",name:"Canceroso 15",medicine_group:"C-Group",temperament:"Mixed",anatomy_term:"Cellular Tissue — General Connective",anatomy_details:"Cellular connective tissue forms the structural framework of organs. It includes fibroblasts, collagen fibers and ground substance. Cellular degeneration disrupts organ architecture and function.",pathology_term:"Tissue Degeneration / Cellular Breakdown",pathology_details:"Tissue degeneration involves progressive deterioration of cellular structure and function. Chronic inflammation leads to fibrosis replacing normal tissue with non-functional connective tissue.",description:"Acts on degenerating cellular tissue; arrests tissue breakdown; supports cellular regeneration."},
  C17:{id:"C17",name:"Canceroso 17",medicine_group:"C-Group",temperament:"Mixed",anatomy_term:"Mucosal Tissue — Multi-system",anatomy_details:"Mucosal tissue lines digestive, respiratory and urogenital body cavities. It provides protective barrier functions and secretes regulatory substances for organ health and immune defense.",pathology_term:"Chronic Ulcers / Mucosal Erosion",pathology_details:"Chronic mucosal ulcers result from persistent inflammation, acid exposure or lymphatic drainage failure. Mucosal erosion involves progressive loss of protective epithelial lining.",description:"Heals chronic mucosal ulcers across multiple organ systems; restores mucosal barrier integrity."},
  A1:{id:"A1",name:"Angioitico 1",medicine_group:"A-Group",temperament:"Sanguine/Mixed",anatomy_term:"Arterial Walls — Aorta & Large Arteries",anatomy_details:"Arterial walls consist of tunica intima (endothelium), tunica media (smooth muscle) and tunica adventitia (connective tissue). Elastic arteries absorb pulsatile blood pressure from cardiac contractions.",pathology_term:"Arterial Stiffness / Atherosclerosis / High BP",pathology_details:"Atherosclerosis involves lipid plaque deposition in arterial intima causing vessel narrowing. Arterial stiffness reduces vascular compliance, increasing systolic blood pressure and cardiac workload.",description:"Acts on large arterial walls; improves arterial wall elasticity; reduces arteriosclerotic changes."},
  A2:{id:"A2",name:"Angioitico 2",medicine_group:"A-Group",temperament:"Sanguine/Mixed",anatomy_term:"Arterioles & Microcirculation Capillaries",anatomy_details:"Arterioles regulate blood distribution to capillary beds through smooth muscle contraction. Capillaries are the smallest blood vessels where nutrient and gas exchange occurs across thin endothelial walls.",pathology_term:"Blood Pressure Imbalance / Capillary Fragility",pathology_details:"Arteriolar vasoconstriction raises peripheral resistance increasing blood pressure. Capillary fragility leads to easy bruising. Microcirculatory failure causes cold extremities and poor tissue perfusion.",description:"Regulates arteriolar tone and capillary permeability; normalizes blood pressure fluctuations."},
  A3:{id:"A3",name:"Angioitico 3",medicine_group:"A-Group",temperament:"Sanguine/Mixed",anatomy_term:"Venous Circulation & Venous Valves",anatomy_details:"The venous system returns deoxygenated blood to the heart against gravity using one-way valves. Venous pooling occurs when valves become incompetent. Deep veins carry majority of venous return from lower extremities.",pathology_term:"Varicose Veins / Venous Insufficiency",pathology_details:"Varicose veins result from venous valve incompetence causing blood pooling and vessel dilation. Chronic venous insufficiency causes leg heaviness, edema and skin changes above the ankle.",description:"Improves venous return; strengthens venous valves; reduces varicose vein formation and venous pooling."},
  P1:{id:"P1",name:"Pectorale 1",medicine_group:"P-Group",temperament:"Mixed",anatomy_term:"Pleura & Thoracic Cavity",anatomy_details:"The pleura are thin membranes surrounding the lungs. The pleural cavity between visceral and parietal pleura contains lubricating fluid. The thoracic cavity is bounded by ribs, sternum and diaphragm.",pathology_term:"Pleurisy / Thoracic Pain / Chest Congestion",pathology_details:"Pleurisy involves inflammation of pleural membranes causing sharp chest pain worsened by breathing. Pleural effusion results from excess fluid accumulation in the pleural cavity.",description:"Acts on pleura and thoracic cavity; relieves pleuritic pain and thoracic congestion."},
  P2:{id:"P2",name:"Pectorale 2",medicine_group:"P-Group",temperament:"Mixed",anatomy_term:"Trachea & Upper Respiratory Tract",anatomy_details:"The trachea is a cartilaginous tube connecting larynx to bronchi. Upper respiratory tract includes nasal cavity, pharynx and larynx. Mucociliary clearance removes particles and pathogens from airways.",pathology_term:"Laryngitis / Tracheal Catarrh / Hoarseness",pathology_details:"Laryngitis involves inflammation of vocal cords causing hoarseness. Tracheal catarrh produces excessive mucosal secretions in upper airway causing chronic throat clearing and dry cough.",description:"Clears upper respiratory mucosal catarrh; relieves laryngitis and tracheal inflammation."},
  P3:{id:"P3",name:"Pectorale 3",medicine_group:"P-Group",temperament:"Mixed",anatomy_term:"Mediastinum & Bronchial Lymphatics",anatomy_details:"The mediastinum is the central chest compartment containing heart, great vessels, trachea and lymph nodes. Mediastinal lymph nodes drain the lungs and thoracic structures throughout the chest.",pathology_term:"Mediastinal Congestion / Bronchial Lymph Stasis",pathology_details:"Mediastinal lymph congestion causes chest heaviness, cough and difficulty swallowing. Bronchial lymphadenopathy in chronic respiratory conditions leads to airway compression and breathlessness.",description:"Drains mediastinal and bronchial lymphatics; relieves chest heaviness from lymph stasis."},
  P4:{id:"P4",name:"Pectorale 4",medicine_group:"P-Group",temperament:"Mixed",anatomy_term:"Bronchial Tubes & Lower Airways",anatomy_details:"Bronchial tubes branch from the trachea into bronchioles and alveolar ducts. Smooth muscle in bronchial walls controls airway diameter. Bronchial glands secrete mucus for particle trapping and airway lubrication.",pathology_term:"Chronic Cough / Bronchitis / Wheezing / Asthma",pathology_details:"Chronic bronchitis is characterized by excessive mucus production and persistent productive cough. Bronchial asthma involves airway smooth muscle spasm causing wheezing and breathlessness on exertion.",description:"Clears bronchial mucosal congestion; dilates bronchioles; relieves chronic cough, bronchitis and wheezing."},
  F1:{id:"F1",name:"Febrifugo 1",medicine_group:"F-Group",temperament:"Mixed",anatomy_term:"Autonomic Nervous System & Hypothalamus",anatomy_details:"The autonomic nervous system controls involuntary functions including heart rate, digestion and temperature regulation. The hypothalamus acts as the thermostat center regulating core body temperature via autonomic pathways.",pathology_term:"Fever / Backache / Autonomic Nerve Pain",pathology_details:"Pyrexia results from hypothalamic thermostat reset by pyrogens. Autonomic nerve pain causes diffuse backache and spinal discomfort. Excessive autonomic stimulation drives visceral pain syndromes.",description:"Sedates pyrexia; regulates spinal autonomic nerve pain; reduces motor nerve hyperexcitability."},
  F2:{id:"F2",name:"Febrifugo 2",medicine_group:"F-Group",temperament:"Mixed",anatomy_term:"Peripheral Nerve Pathways — Sciatic & Brachial",anatomy_details:"Peripheral nerves carry sensory and motor signals between CNS and body. The sciatic nerve runs from lumbar spine through buttock to leg. Brachial plexus supplies the upper limb with motor and sensory innervation.",pathology_term:"Neuralgia / Sciatica / Jhunjhuni / Shooting Pain",pathology_details:"Sciatica involves compression or irritation of sciatic nerve causing shooting pain from lower back to leg. Peripheral neuralgia produces burning, tingling and numbness along nerve distribution areas.",description:"Relieves peripheral neuralgia and radiating nerve pain; calms sciatic and brachial nerve irritation."},
  Ver1:{id:"Ver1",name:"Vermifugo 1",medicine_group:"Ver-Group",temperament:"Mixed",anatomy_term:"Intestinal Lumen & Enteric Wall",anatomy_details:"The intestinal lumen is the hollow space within intestines where digestion and absorption occur. The enteric wall contains smooth muscle, mucosal glands and lymphoid tissue (Peyer patches) for immune surveillance.",pathology_term:"Worm Infestation / Intestinal Parasites",pathology_details:"Intestinal parasites including roundworms, pinworms and hookworms disrupt intestinal absorption causing malnutrition, abdominal pain and altered bowel habits.",description:"Anti-parasitic remedy; creates inhospitable intestinal environment for worms; restores enteric wall health."},
  Ver2:{id:"Ver2",name:"Vermifugo 2",medicine_group:"Ver-Group",temperament:"Mixed",anatomy_term:"Enteric Mucosa & Intestinal Immune Tissue",anatomy_details:"Enteric mucosa is lined with absorptive enterocytes and secretory goblet cells. Gut-associated lymphoid tissue (GALT) including Peyer patches provides local immune defense against intestinal pathogens.",pathology_term:"Parasitic Toxicity / Post-worm Mucosal Damage",pathology_details:"Parasitic toxins damage enteric mucosal integrity causing increased intestinal permeability and chronic inflammation. Post-worm treatment mucosal repair is essential for recovery.",description:"Clears parasitic toxins; repairs enteric mucosal damage after worm infestation; restores intestinal immune barrier."},
  L1:{id:"L1",name:"Linfatico 1",medicine_group:"L-Group",temperament:"Lymphatic",anatomy_term:"Systemic Lymph Vessels & Lymph Nodes",anatomy_details:"The lymphatic system consists of capillaries, vessels and nodes that collect interstitial fluid and return it to circulation via the thoracic duct. Lymph nodes filter lymph and house immune cells throughout the body.",pathology_term:"Lymph Stasis / Diffuse Edema / Lymphadenopathy",pathology_details:"Lymphatic stasis results from impaired lymph vessel transport causing tissue fluid accumulation. Lymphedema produces non-pitting swelling in extremities. Lymphadenopathy indicates reactive lymph node enlargement.",description:"Master systemic lymph drainer; resolves diffuse fluid retention and lymph vessel stagnation. Universal lymph purifier."},
  Ven1:{id:"Ven1",name:"Venereo 1",medicine_group:"Ven-Group",temperament:"Mixed",anatomy_term:"Genitourinary Tissues & Mucosa",anatomy_details:"Genitourinary tissues include urethra, prostate, seminal vesicles and genitalia. The mucosal lining of these structures is vulnerable to inflammatory and infectious conditions causing chronic discharge.",pathology_term:"Venereal Disorders / Genital Inflammation / Discharge",pathology_details:"Venereal conditions involve chronic inflammation and discharge from genitourinary mucosal surfaces. Lymphatic congestion in pelvic genitourinary tissues causes persistent irritation and mucosal catarrh.",description:"Specific for genitourinary mucosal inflammation; clears chronic discharge; heals genital tissue congestion."},
  "S-Lass":{id:"S-Lass",name:"Laxativo",medicine_group:"Special",temperament:"Mixed",anatomy_term:"Lower Intestine & Sigmoid Colon",anatomy_details:"The sigmoid colon and rectum form the terminal portion of the large intestine. Sigmoid musculature controls propulsion of fecal matter toward the rectum for evacuation through peristaltic reflexes.",pathology_term:"Constipation / Lower Intestinal Stasis",pathology_details:"Lower intestinal stasis involves failure of sigmoid peristalsis causing fecal accumulation and straining. Hard dry stools result from excessive water reabsorption due to prolonged intestinal transit time.",description:"Stimulates lower intestinal peristalsis; softens stools; relieves constipation and sigmoid colon stagnation."},
  APP:{id:"APP",name:"Aqua Perla Pelli",medicine_group:"Special",temperament:"Sanguine/Mixed",anatomy_term:"Epithelial Tissues & Skin Surface",anatomy_details:"Epithelial tissues form protective linings and coverings of body surfaces. The skin epithelium (epidermis) consists of stratified squamous epithelium providing the primary barrier against environmental damage.",pathology_term:"Skin Care / Epithelial Disorders / Surface Conditions",pathology_details:"Epithelial disorders include surface skin conditions, chronic dermatitis and epithelial barrier dysfunction. Impaired epithelial repair leads to chronic surface lesions and pigmentation disorders.",description:"Specific for epithelial surface conditions; improves skin barrier function; supports epithelial tissue repair."},
  SY:{id:"SY",name:"Synthesis",medicine_group:"Special",temperament:"Mixed",anatomy_term:"Constitutional System — Multi-organ",anatomy_details:"The constitutional system represents the overall vital force energy permeating all organ systems simultaneously. It influences cellular metabolism, immune response and the general adaptive capacity of the body.",pathology_term:"Chronic Weakness / Constitutional Debility",pathology_details:"Constitutional debility involves depletion of vital energy across multiple systems simultaneously. Chronic multi-system fatigue requires a constitutional tonic to rebuild the foundational bio-energetic reserve.",description:"Constitutional synthesis remedy; rebuilds depleted vital force; supports recovery in chronic multi-system weakness."},
};

const SYSTEM_META = {
  CARDIAC:     { icon:"❤️",  nameHi:"हृदय एवं रक्तचाप नियामक" },
  RENAL:       { icon:"💧",  nameHi:"वृक्क निस्पंदन एवं सुजन नाशक" },
  GYNE:        { icon:"🌸",  nameHi:"गर्भाशय एवं श्वेत प्रदर नाशक" },
  GASTRIC:     { icon:"🫃",  nameHi:"पाचन, भारीपन एवं गैस नाशक" },
  CONSTIPATION:{ icon:"🔄",  nameHi:"कब्ज एवं अंत्र गतिवर्धक" },
  LIVER:       { icon:"🟡",  nameHi:"यकृत एवं पित्त शोधक" },
  FEVER:       { icon:"🌡️", nameHi:"ज्वर एवं तापमान नाशक" },
  RESPIRATORY: { icon:"🫁",  nameHi:"श्वसन मार्ग एवं कफ नाशक" },
  NEURO:       { icon:"⚡",  nameHi:"नाड़ी संस्थान एवं वात नाशक" },
  JOINTS:      { icon:"🦴",  nameHi:"संधिवात एवं जोड़ों का दर्द नाशक" },
  SKIN:        { icon:"🌿",  nameHi:"त्वचा विकार एवं रक्त शोधक" },
  METABOLIC:   { icon:"💪",  nameHi:"शारीरिक कमजोरी एवं जीवनी शक्ति वर्धक" },
  GLANDULAR:   { icon:"🔴",  nameHi:"गांठ विलायक एवं ग्रंथि शोधक" },
  PARASITIC:   { icon:"🦠",  nameHi:"कृमि नाशक एवं आंत शोधक" },
  VENEREAL:    { icon:"🔵",  nameHi:"गुप्त रोग एवं जनन-मूत्र शोधक" },
};

const PRIORITY_ORDER=["CARDIAC","RENAL","GLANDULAR","FEVER","RESPIRATORY","LIVER","GYNE","GASTRIC","CONSTIPATION","JOINTS","SKIN","NEURO","VENEREAL","DEGENERATIVE","PARASITIC","METABOLIC"];
const ELEC_COMBO={"GYNE+NEURO":["W.E.","Y.E."],"NEURO+GYNE":["W.E.","Y.E."],"RENAL+CARDIAC":["B.E.","W.E."],"CARDIAC+RENAL":["B.E.","W.E."],"SKIN+LIVER":["G.E.","Y.E."],"LIVER+SKIN":["G.E.","Y.E."],"GASTRIC+LIVER":["Y.E.","Y.E."],"LIVER+GASTRIC":["Y.E.","Y.E."],"FEVER+RESPIRATORY":["W.E.","W.E."],"RESPIRATORY+FEVER":["W.E.","W.E."],"NEURO+JOINTS":["R.E.","Y.E."],"JOINTS+NEURO":["R.E.","Y.E."],"RENAL+GYNE":["B.E.","W.E."],"GYNE+RENAL":["B.E.","W.E."],"GLANDULAR+GYNE":["Y.E.","W.E."],"GYNE+GLANDULAR":["Y.E.","W.E."],"GASTRIC+CONSTIPATION":["Y.E.","Y.E."],"CONSTIPATION+GASTRIC":["Y.E.","Y.E."],"CARDIAC+NEURO":["B.E.","R.E."],"NEURO+CARDIAC":["B.E.","R.E."]};
const COMBO_NOTES={"GYNE+NEURO":"F-1 kamar dard hetu S-2+C-2 ke saath dein.","RENAL+CARDIAC":"BP monitor karein. B.E. kewal dopahar se pehle.","SKIN+LIVER":"S-3 aur S-5 hepatic clearance ke raaste synergistically kaam karte hain.","GLANDULAR+GYNE":"C-1+C-13 granthi hetu; S-2+C-2 garbhashay srav hetu alag mixtures.","GASTRIC+CONSTIPATION":"S-10+S-11 din mein; S-12+C-10 raat ko dein.","CARDIAC+NEURO":"BP + nerve: B.E. subah; R.E. shaam separately."};

// ── Client-side Scoring Engine (DEPRECATED — Expert Engine used instead) ────
/*
function scoreEngine(sysKey,sympText,temperament,allMeds,nature,overrideElec){
  const sys=SYSTEMS[sysKey];if(!sys)return null;

  const keywords=sympText.toLowerCase().split(/[\s,।]+/).filter(w=>w.length>3);
  const anatomyKws=sys.anatomy_keywords||[];
  let scored=[];

  Object.values(allMeds).forEach(med=>{
    let score=0,matched=[];
    const anat=(med.anatomy_term||"").toLowerCase();
    for(const ak of anatomyKws){if(ak.toLowerCase() in anat||anat.includes(ak.toLowerCase())){score+=5.0;break;}}
    const pd=(med.pathology_details||"").toLowerCase(),pt=(med.pathology_term||"").toLowerCase();
    keywords.forEach(w=>{if(pd.includes(w)||pt.includes(w)){score+=1.5;matched.push(w);}});
    const mt=(med.temperament||"");
    const ts=temperament.split("(")[0].trim().split(" ")[0].toLowerCase();
    if(mt.toLowerCase().includes(ts)||mt.toLowerCase().includes("mixed"))score+=1.0;
    if(score>0)scored.push({...med,finalScore:score,matched:[...new Set(matched)]});
  });
  scored.sort((a,b)=>b.finalScore-a.finalScore);

  const parts=[],sel=new Set();
  const bS=scored.find(m=>m.medicine_group.startsWith("S")&&!sel.has(m.id));
  if(bS){parts.push(bS);sel.add(bS.id);}
  const bC=scored.find(m=>m.medicine_group.startsWith("C")&&!sel.has(m.id));
  if(bC){parts.push(bC);sel.add(bC.id);}
  const drainGrps=["A-Group","L-Group","F-Group","P-Group","Ver-Group","Ven-Group"];
  const bD=scored.find(m=>drainGrps.includes(m.medicine_group)&&!sel.has(m.id));
  if(bD){parts.push(bD);sel.add(bD.id);}
  if(temperament.toLowerCase().includes("lymphatic")&&!sel.has("L1")){
    const l1=allMeds["L1"];if(l1)parts.push(l1);
  }

  const elec=overrideElec||sys.electricity;
  const dil=nature==="acute"?sys.acuteDil:nature==="chronic"?sys.chronicDil:sys.neutralDil;
  const fmtId=(m)=>{
    const id=m.id;
    if(["S-Lass","APP","SY"].includes(id))return id;
    if(id.startsWith("Ver"))return"Ver-"+id.slice(3);
    if(id.startsWith("Ven"))return"Ven-"+id.slice(3);
    const g=m.medicine_group.split("-")[0];const n=id.replace(/[^0-9]/g,"");
    return n?`${g}-${n}`:id;
  };
  const medParts=parts.map(fmtId);
  return{
    formula:medParts.join(" + ")+` + ${elec}`,
    full:medParts.join(" + ")+` + ${elec} — ${dil}`,
    dilution:dil,electricity:elec,medParts,medicines:parts,
    scoreLog:scored.slice(0,5).map(m=>({id:m.id,name:m.name,score:m.finalScore.toFixed(1),matched:m.matched}))
  };
}
*/

// ── Symptom Detection ──────────────────────────────────────────────────────
const PHRASE_PATTERNS=[
  {phrases:["safed pani","safed paani","white discharge","leucorrhea","likoria","shwet pradar"],cat:"GYNECOLOGICAL"},
  {phrases:["kamar dard","back pain","backache","peeth dard","kamar me dard","kamar mein dard"],cat:"NERVES"},
  {phrases:["saitica","sciatica","sciatic pain","sciatic nerve","saiatica"],cat:"NERVES"},
  {phrases:["jodon mein dard","jodon me dard","joint pain","ghutne mein dard","knee pain","gathiya dard"],cat:"JOINTS"},
  {phrases:["sar dard","sir dard","shir dard","sar me dard","shir me dard","headache","sirdard"],cat:"FEVER"},
  {phrases:["seene me ganth","seene mein ganth","shine me ganth","breast me ganth","chest lump","breast lump","seene ki ganth"],cat:"GLANDULAR"},
  {phrases:["pet saf nahi","pet saaf nahi","malbandh","latrine nahi","shaucha nahi","toilet nahi"],cat:"CONSTIPATION"},
  {phrases:["pet me dard","pet mein dard","pet dard","pet fula","pait phula","bloating","pet bhari"],cat:"DIGESTIVE"},
  {phrases:["saans ki takleef","saans phoolna","saans nahi aana","chest tightness","seena bhaari"],cat:"RESPIRATORY"},
  {phrases:["dil ki dhadkan","dil ghabhrana","chest pain","seene mein dard"],cat:"CARDIAC"},
  {phrases:["haath pair sujan","pair mein sujan","sujan hai","pair sooje"],cat:"SWELLING"},
  {phrases:["aankhein peeli","peeli aankhein"],cat:"LIVER"},
  {phrases:["jhunjhuni","haath kaanpna","kaanpna"],cat:"NERVES"},
  {phrases:["pet mein kide","pet ke kide","intestinal worms"],cat:"PARASITIC"},
  {phrases:["gupt rog","venereal discharge"],cat:"VENEREAL"},
];
const KEYWORD_MAP={SWELLING:["sujan","swelling","edema","dropsy","sooja","phulna","soojan"],URINARY:["urine","peshab","pishab","mutra","kidney","renal","oliguria","bladder","peshaab","jalan"],SKIN:["chale","blister","rash","eruption","skin","khujli","itching","eczema","sore","daane","funsi","kharish"],WEAKNESS:["kamjori","weakness","anemia","thakan","tired","debility","chakar","dizziness","chakkar","fatigue"],NERVES:["paralysis","numbness","nerve","paralyze","sunn","jhunjhuni","tingling","trembling","lakwa","fits","convulsion"],LIVER:["liver","jaundice","piliya","biliary","hepatitis","peela","bile","yakrit"],DIGESTIVE:["kabj","kabz","gas","acidity","indigestion","stomach","gastric","bhaari","diarrhea","dast"],RESPIRATORY:["khansi","cough","asthma","saans","breathe","wheezing","bronchitis","balgam","phlegm","dam"],CARDIAC:["dil","heart","palpitation","dhadkan","cardiac","angina","hypertension","ghabrana"],JOINTS:["gathiya","arthritis","rheumatism","ghutna","knee","gout","stiffness","akdan"],FEVER:["bukhar","fever","tapman","temperature","malaria","tapish","jwar","bukhaar"],GLANDULAR:["ganth","gant","lump","nodule","tumor","gland","rasauli","gaanth","granthi"],CONSTIPATION:["kabj","kabz","constipation","malbandh"],PARASITIC:["kide","worms","parasites"],VENEREAL:["gupt","venereal"]};
const CAT_TO_SYS={SWELLING:"RENAL",URINARY:"RENAL",GYNECOLOGICAL:"GYNE",LIVER:"LIVER",DIGESTIVE:"GASTRIC",SKIN:"SKIN",NERVES:"NEURO",WEAKNESS:"METABOLIC",RESPIRATORY:"RESPIRATORY",CARDIAC:"CARDIAC",JOINTS:"JOINTS",FEVER:"FEVER",GLANDULAR:"GLANDULAR",CONSTIPATION:"CONSTIPATION",PARASITIC:"PARASITIC",VENEREAL:"VENEREAL"};

function pn(w){let s=w.toLowerCase().replace(/[^a-z0-9]/g,"");[["kh","k"],["gh","g"],["jh","z"],["bh","b"],["dh","d"],["th","t"],["ch","c"],["ph","f"],["sh","s"],["ee","i"],["oo","u"],["aa","a"],["ai","a"],["au","a"],["ou","u"],["v","w"],["y","i"]].forEach(([o,n])=>s=s.replaceAll(o,n));return s;}
function lv(a,b){if(a.length<b.length)return lv(b,a);if(!b.length)return a.length;let p=Array.from({length:b.length+1},(_,i)=>i);for(let i=0;i<a.length;i++){const c=[i+1];for(let j=0;j<b.length;j++)c.push(Math.min(p[j+1]+1,c[j]+1,p[j]+(a[i]!==b[j]?1:0)));p=c;}return p[b.length];}
function fz(w,kws){const ni=pn(w);if(ni.length<3)return null;for(const kw of kws){const nk=pn(kw);if(ni===nk)return kw;if(ni.length<=4||nk.length<=4)continue;if(lv(ni,nk)<=2)return kw;}return null;}

function detect(text){
  const lower=text.toLowerCase().trim();
  const words=lower.split(/[\s,।]+/);
  const cats=new Set(),logs=[],skip=new Set();
  PHRASE_PATTERNS.forEach(({phrases,cat})=>{
    for(const p of phrases){if(lower.includes(p)){cats.add(cat);logs.push({type:"phrase",found:p,cat});p.split(" ").forEach(w=>skip.add(w));break;}}
  });
  words.forEach(w=>{
    if(!w||skip.has(w))return;
    for(const [cat,kws] of Object.entries(KEYWORD_MAP)){const m=fz(w,kws);if(m){cats.add(cat);logs.push({type:"word",found:w,matched:m,cat});break;}}
  });
  return{cats,logs};
}

function activateSystems(cats,bpHigh){
  const active=new Set();cats.forEach(c=>{const s=CAT_TO_SYS[c];if(s)active.add(s);});
  if(bpHigh)active.add("CARDIAC");if(!active.size)active.add("METABOLIC");
  return PRIORITY_ORDER.filter(s=>active.has(s));
}

function resolveTemp(ordered){
  const s1=ordered[0];
  if(["RENAL","GYNE"].includes(s1)||ordered.slice(0,2).some(s=>["RENAL","GYNE"].includes(s)))return["Lymphatic Temperament (लसीका प्रधान मिजाज)","Fluid retention / pelvic secretions indicate lymphatic constitutional excess."];
  if(s1==="LIVER")return["Biliary Temperament (पित्त प्रधान मिजाज)","Hepatobiliary symptoms indicate biliary constitutional dominance."];
  if(s1==="SKIN")return["Sanguine / Mixed (रक्त प्रधान / मिश्रित)","Dermal eruptions represent blood capillary heat and congestion."];
  if(s1==="CARDIAC")return["Sanguine Temperament (रक्त प्रधान मिजाज)","Cardiovascular stress indicates sanguine constitutional imbalance."];
  if(s1==="NEURO")return["Nervous Temperament (वात प्रधान मिजाज)","Nerve conduction defects indicate nervous constitutional dominance."];
  if(s1==="GLANDULAR")return["Lymphatic Temperament (लसीका प्रधान मिजाज)","Glandular lymphatic congestion indicates lymphatic constitutional stasis."];
  return["Mixed Temperament (मिश्रित मिजाज)","Multiple system involvement indicates mixed constitutional state."];
}

const SCHEDS={1:["5 बूंद — आधा कप गुनगुने पानी में, सुबह + रात (खाली पेट)"],2:["5 बूंद — सुबह + दोपहर (खाली पेट) | Morning & Noon","5 बूंद — शाम + रात (भोजन के बाद) | Evening & Night"],3:["5 बूंद — सुबह (खाली पेट) | Morning","5 बूंद — दोपहर (भोजन के बाद) | After noon","5 बूंद — रात सोते समय | Bedtime"],4:["5 बूंद — सुबह खाली पेट | Morning","5 बूंद — दोपहर भोजन के बाद | After noon","5 बूंद — शाम खाली पेट | Evening","5 बूंद — रात सोते समय | Bedtime"]};

// ── Report Generator ───────────────────────────────────────────────────────
function generateReport(patient,result){
  const now=new Date();
  const dt=now.toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})+" at "+now.toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"});
  const L=[];
  L.push("=".repeat(72));L.push("   🌿 ELECTRO-HOMOEOPATHY DYNAMIC CLINICAL REPORT (v3.3)");L.push("      (इलेक्ट्रो-होम्योपैथी एआई नैदानिक एवं औषधीय पर्चा)");L.push("      Scoring Engine: EH Triad Law — Complexa Complexis Curantur");L.push("=".repeat(72));
  L.push("\n📋 CHAPTER 1: PATIENT PROFILE");L.push("─".repeat(72));
  L.push(` • NAME       : ${patient.name||"—"}`);L.push(` • AGE        : ${patient.age||"—"} Years`);
  L.push(` • GENDER     : ${patient.gender==="male"?"पुरुष (Male)":patient.gender==="female"?"महिला (Female)":"अन्य"}`);
  L.push(` • BP         : ${patient.bp||"Not measured"}`);
  L.push(` • CONDITION  : ${patient.nature==="acute"?"ACUTE (तीव्र)":patient.nature==="chronic"?"CHRONIC (पुराना)":"NEUTRAL"}`);
  L.push(` • TEMPERAMENT: ${result.temperament}`);L.push(`   Basis: ${result.tempRationale}`);
  L.push(`\n SYMPTOMS: "${patient.symptoms}"`);
  L.push(`\n ACTIVE DISEASE SYSTEMS (${result.ordered.length}):`);
  result.ordered.forEach((s,i)=>{const m=result.mixtures[i];L.push(`   ${i+1}. ${m.icon} ${m.labelEn} — ${m.labelHi}`);});

  L.push("\n\n🧠 CHAPTER 2: AI CLINICAL REASONING (EH Triad Scoring Engine)");L.push("─".repeat(72));
  L.push(" STEP 1 — Symptom Parsing:");
  result.logs.forEach(log=>{if(log.type==="phrase")L.push(`   ✅ Phrase: "${log.found}" → ${log.cat}`);else L.push(`   ✏️  "${log.found}" matched "${log.matched}" → [${log.cat}]`);});
  L.push("\n STEP 2 — System Activation:");
  result.mixtures.forEach(m=>{L.push(`   ${m.icon} ${m.labelEn}`);L.push(`      Path: ${m.path}`);});
  L.push("\n STEP 3 — EH Triad Scoring (per mixture):");
  result.mixtures.forEach(mix=>{
    L.push(`   ${mix.label} — Top scored medicines:`);
    (mix.scoreLog||[]).forEach(s=>L.push(`     • ${s.id} (${s.name}): Score ${s.score}${s.matched.length?` | Matched: ${s.matched.join(", ")}`:""}` ));
  });
  L.push("\n STEP 4 — Mattei Polarity Law:");
  if(patient.nature==="acute")L.push("   ACUTE → Hyperexcited tissues → NEGATIVE DOSE (D10/D30) to sedate.");
  else if(patient.nature==="chronic")L.push("   CHRONIC → Hypo-functional tissues → POSITIVE DOSE (D3/D5) to stimulate.");
  else L.push("   NEUTRAL → BALANCED DOSE (D5/D6) to restore autonomic equilibrium.");

  L.push("\n\n📁 CHAPTER 3: DYNAMIC SPAGYRIC MIXTURES");L.push("─".repeat(72));
  L.push(` Total: ${result.mixtures.length} Mixture(s) | अलग-अलग Mixture एक गिलास में न मिलाएं।\n`);

  result.mixtures.forEach(mix=>{
    L.push(" ┌"+"─".repeat(70));L.push(` │ ${mix.label} — ${mix.nameEn}`);L.push(` │ ${mix.nameHi}`);L.push(" ├"+"─".repeat(70));
    L.push(` │ SYSTEM  : ${mix.labelEn}`);L.push(` │ FORMULA : ${mix.formula.full}`);L.push(" │");
    L.push(" │ MEDICINES (DATA FROM electrohomeopathy.db):");
    mix.formula.medicines.forEach(med=>{
      if(!med)return;L.push(" │");
      L.push(` │  ▸ ${med.id} — ${med.name} [${med.medicine_group} | ${med.temperament}]`);
      L.push(` │    Anatomy Term    : ${med.anatomy_term}`);
      (med.anatomy_details||"").match(/.{1,64}/g)?.forEach((ln,i)=>L.push(` │    ${i===0?"Anatomy Detail : ":"               "}${ln}`));
      L.push(` │    Pathology Term  : ${med.pathology_term}`);
      (med.pathology_details||"").match(/.{1,64}/g)?.forEach((ln,i)=>L.push(` │    ${i===0?"Pathology Detail: ":"               "}${ln}`));
      (med.description||"").match(/.{1,64}/g)?.forEach((ln,i)=>L.push(` │    ${i===0?"EH Action      : ":"               "}${ln}`));
    });
    L.push(" │");
    L.push(` │ TARGET EN: ${mix.targetEn}`);L.push(` │ TARGET HI: ${mix.targetHi}`);
    L.push(` │ ELEC : ${mix.formula.electricity} — ${ELEC[mix.formula.electricity]?.desc||""}`);
    L.push(` │ DIL  : ${mix.formula.dilution}`);L.push(` │ TIME : ${mix.schedule}`);
    L.push(" └"+"─".repeat(70)+"\n");
  });

  if(result.comboNotes?.length){L.push(" ⚠️ COMBINATION NOTES:");result.comboNotes.forEach((n,i)=>L.push(`   ${i+1}. ${n}`));L.push("");}

  L.push("\n⚖️  CHAPTER 4: DOSAGE PROTOCOL");L.push("─".repeat(72));
  L.push(` • Dilution  : ${result.dosage.dil}`);L.push(` • Frequency : ${result.dosage.freq}`);L.push(` • Duration  : ${result.dosage.duration}`);
  if(result.dosage.note)L.push(` • Note      : ${result.dosage.note}`);
  L.push("\n MIXTURE SCHEDULE:");result.mixtures.forEach(m=>L.push(`   ${m.label}: ${m.schedule}`));

  L.push("\n\n🍏 CHAPTER 5: DIETARY GUIDANCE — PARHIZ (Engine 8)");L.push("─".repeat(72));
  if(result.diet){
    const d=result.diet;
    L.push(`  ${d.title}`);
    L.push(`  ${d.principle}`);
    L.push("  ✅ ZAROOR KHAYEN (PATHYA):");
    (d.pathya||[]).slice(0,15).forEach(item=>L.push(`    • ${item.item} — ${item.reason}`));
    L.push("  ❌ BILKUL NAHI KHAYEN (APATHYA):");
    (d.apathya||[]).slice(0,12).forEach(item=>L.push(`    • ${item.item} — ${item.reason}`));
    L.push("  🌿 JEEVAN SHAILI:");
    (d.lifestyle||[]).forEach(tip=>L.push(`    • ${tip}`));
    L.push(`  SAAR: ${d.summary||""}`);
  } else {
    const diet=buildDiet(result.ordered);
    L.push(" ✅ PATHYA:");diet.do.forEach(d=>L.push(`    • ${d}`));
    L.push("\n ❌ APATHYA:");diet.dont.forEach(d=>L.push(`    • ${d}`));
  }

  L.push("\n\n📖 CHAPTER 6: MATTEI'S LAWS APPLIED");L.push("─".repeat(72));
  L.push(" 1. Law of Spagyric Specificity: Each remedy targets a specific anatomical system");
  L.push("    and temperament. The EH Triad Law ensures S+C+Drainage balance per disease.");
  L.push(" 2. Law of Polarity (Positive/Negative Dose): Acute = Higher dilution (negative");
  L.push("    dose) to sedate. Chronic = Lower dilution (positive dose) to stimulate.");
  L.push(" 3. Chrono-Therapeutic Non-Interference: Multiple spagyric formulas MUST NOT be");
  L.push("    mixed in the same glass. Each carries its own bio-electrical vital charge.");
  L.push("\n DATA SOURCE: electrohomeopathy.db | Scoring: EH Triad Law v3.3");
  L.push(`\n${"─".repeat(72)}`);L.push(" ⚖️  DISCLAIMER: AI-assisted EH support tool. Verify with registered E.H. Physician.");
  L.push(` Report: ${dt} | EH Clinical Engine v3.3 | 34 Medicines | Dynamic Scoring`);L.push("=".repeat(72));
  return L.join("\n");
}

function buildDiet(ordered){
  const r={do:["भोजन के 30 मिनट बाद गुनगुना पानी पिएं।","हल्का, ताजा, सुपाच्य गर्म भोजन लें।"],dont:["कच्चा प्याज, लहसुन, हींग — सख्त वर्जित।","S-group के साथ खट्टी चीजें वर्जित।","ठंडा पानी और भारी मसालेदार भोजन न लें।"]};
  const ex={RENAL:{do:"नमक कम करें। 2–3 लीटर गर्म पानी पिएं।",dont:"अचार, नमकीन, प्रसंस्कृत भोजन न लें।"},GYNE:{do:"पालक, खजूर, गुड़ — आयरन युक्त भोजन।",dont:"मासिक धर्म में ठंडा पानी वर्जित।"},LIVER:{do:"करेला, मूली, खाली पेट गर्म नींबू पानी।",dont:"तला-भुना, शराब, लाल मांस — वर्जित।"},CARDIAC:{do:"अलसी के बीज और अखरोट लें।",dont:"चाय, कॉफी, तंबाकू — बिल्कुल बंद।"},JOINTS:{do:"हल्दी दूध रात को; तिल और अदरक लें।",dont:"उड़द दाल, राजमा — यूरिक एसिड बढ़ाने वाले।"},FEVER:{do:"खिचड़ी, मूंग दाल सूप, नारियल पानी।",dont:"दूध और भारी भोजन — बुखार में नहीं।"},RESPIRATORY:{do:"तुलसी-अदरक की चाय दिन में दो बार।",dont:"ठंडे पेय, आइसक्रीम, केला वर्जित।"},SKIN:{do:"नीम का पानी; खीरा और हरी सब्जियां।",dont:"तेज मसाले, तला-भुना, किण्वित भोजन।"},GLANDULAR:{do:"हरी सब्जियां और ब्रोकली खाएं।",dont:"प्रसंस्कृत खाद्य और भारी डेयरी वर्जित।"},CONSTIPATION:{do:"पपीता, इसबगोल, खूब पानी पिएं।",dont:"मैदा, बिस्किट, तली हुई चीजें वर्जित।"},PARASITIC:{do:"कद्दू के बीज, नीम की पत्तियां, हल्दी।",dont:"मीठा, मैदा और बासी भोजन वर्जित।"}};
  ordered.slice(0,4).forEach(s=>{if(ex[s]){r.do.push(ex[s].do);r.dont.push(ex[s].dont);}});
  return r;
}

// ── UI Components ──────────────────────────────────────────────────────────
function FormulaBlock({formula}){
  const ec={"W.E.":"#9ca3af","R.E.":"#ef4444","Y.E.":"#f59e0b","B.E.":"#3b82f6","G.E.":"#22c55e"};
  const parts=(formula.formula||"").split("+").map(p=>p.trim()).filter(Boolean);
  const elec=formula.electricity;
  return(
    <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",borderRadius:12,padding:"12px 14px",marginTop:8}}>
      <div style={{color:"#c7d2fe",fontSize:10,fontWeight:700,letterSpacing:2,marginBottom:5,fontFamily:"sans-serif"}}>📐 SPAGYRIC FORMULA — EH TRIAD LAW</div>
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:4}}>
        {parts.filter(p=>!Object.keys(ec).includes(p)).map((p,i)=>(
          <span key={i} style={{display:"flex",alignItems:"center",gap:3}}>
            <span style={{background:"#4338ca",color:"#fff",borderRadius:7,padding:"4px 11px",fontWeight:800,fontSize:14,fontFamily:"monospace"}}>{p}</span>
            <span style={{color:"#818cf8",fontWeight:700,fontSize:16}}>+</span>
          </span>
        ))}
        <span style={{background:ec[elec]||"#6b7280",color:"#fff",borderRadius:7,padding:"4px 11px",fontWeight:800,fontSize:14}}>{elec}</span>
        <span style={{color:"#818cf8",margin:"0 2px",fontSize:16}}>—</span>
        <span style={{background:"#f59e0b",color:"#fff",borderRadius:7,padding:"4px 11px",fontWeight:800,fontSize:14}}>{formula.dilution}</span>
      </div>
    </div>
  );
}

function MedCard({med,accent}){
  if(!med)return null;
  return(
    <div style={{background:"#f8fafc",borderRadius:10,padding:"9px 11px",marginBottom:6,borderLeft:`3px solid ${accent}`}}>
      <div style={{display:"flex",flexWrap:"wrap",gap:5,alignItems:"center",marginBottom:5}}>
        <span style={{background:accent,color:"#fff",borderRadius:6,padding:"2px 9px",fontWeight:800,fontSize:13,fontFamily:"monospace"}}>{med.id}</span>
        <span style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{med.name}</span>
        <span style={{background:"#e2e8f0",color:"#475569",borderRadius:10,padding:"1px 7px",fontSize:11,fontFamily:"sans-serif"}}>{med.medicine_group}</span>
        <span style={{background:"#ede9fe",color:"#6d28d9",borderRadius:10,padding:"1px 7px",fontSize:11,fontFamily:"sans-serif"}}>{med.temperament}</span>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:5,marginBottom:5}}>
        <div style={{background:"#eff6ff",borderRadius:8,padding:"7px 9px"}}>
          <div style={{color:"#1d4ed8",fontWeight:700,fontSize:10,letterSpacing:1,marginBottom:2,fontFamily:"sans-serif"}}>🏛 ANATOMY (DB से)</div>
          <div style={{color:"#1e40af",fontWeight:600,fontSize:11,marginBottom:2}}>{med.anatomy_term}</div>
          <div style={{color:"#1d4ed8",fontSize:11,lineHeight:1.5}}>{med.anatomy_details}</div>
        </div>
        <div style={{background:"#fdf4ff",borderRadius:8,padding:"7px 9px"}}>
          <div style={{color:"#7e22ce",fontWeight:700,fontSize:10,letterSpacing:1,marginBottom:2,fontFamily:"sans-serif"}}>🔬 PATHOLOGY (DB से)</div>
          <div style={{color:"#6b21a8",fontWeight:600,fontSize:11,marginBottom:2}}>{med.pathology_term}</div>
          <div style={{color:"#7e22ce",fontSize:11,lineHeight:1.5}}>{med.pathology_details}</div>
        </div>
      </div>
      <div style={{background:"#f0fdf4",borderRadius:8,padding:"6px 9px"}}>
        <div style={{color:"#15803d",fontWeight:700,fontSize:10,letterSpacing:1,marginBottom:2,fontFamily:"sans-serif"}}>⚕️ EH ACTION</div>
        <div style={{color:"#166534",fontSize:11,lineHeight:1.5}}>{med.description}</div>
      </div>
    </div>
  );
}

function ScoreLog({log}){
  if(!log?.length)return null;
  return(
    <div style={{background:"#f8faff",borderRadius:8,padding:"7px 10px",marginTop:6,border:"1px solid #c7d2fe"}}>
      <div style={{color:"#4f46e5",fontWeight:700,fontSize:10,letterSpacing:1,marginBottom:4,fontFamily:"sans-serif"}}>📊 SCORING ENGINE LOG (EH Triad)</div>
      {log.map((s,i)=>(
        <div key={i} style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
          <span style={{fontFamily:"monospace",fontSize:11,color:"#374151",minWidth:40}}>{s.id}</span>
          <div style={{background:"#e0e7ff",borderRadius:4,height:6,width:`${Math.min(s.score*10,100)}%`,minWidth:20}}/>
          <span style={{fontSize:10,color:"#6366f1",fontFamily:"sans-serif"}}>{s.score}</span>
          {s.matched?.length>0&&<span style={{fontSize:10,color:"#10b981",fontFamily:"sans-serif"}}>→ {s.matched.join(", ")}</span>}
        </div>
      ))}
    </div>
  );
}

function MixtureCard({ mix, idx }) {
  const [open, setOpen] = useState(false);
  const acc = ACCENT[idx % ACCENT.length];
  const fo  = mix?.formula_obj || mix?.fo || {};

  const KAAM = {
    "S1": "Lymph safai + jeevan urja",
    "S2": "Garbhashay safai → safed pani band",
    "S3": "Khoon saaf → tvacha theek",
    "S5": "Liver jagayega → gas door",
    "S6": "Gurde → sujan door",
    "S10":"Gas + acidity door",
    "S11":"Pachan theek karega",
    "S12":"Kabjiyat door",
    "C1": "Ganth pighlayega",
    "C2": "Garbhashay repair",
    "C4": "Naadi mazboot",
    "C6": "Gurde ki sujan door",
    "C10":"Aanto ki safai",
    "C13":"Ganth + glands par kaam",
    "C15":"Aanto ki shakti",
    "C17":"Hridaya mazboot",
    "A1": "BP normal karega",
    "A2": "Circulation theek",
    "A3": "Nason ko mazboot",
    "F1": "Bukhar + dard door",
    "F2": "Jhunjhuni + sciatica door",
    "L1": "Sujan utaregi",
    "P1": "Khansi + saans door",
    "P2": "Gale ki kharash door",
    "P3": "Chest congestion door",
    "P4": "Purani khansi door",
    "Ver1":"Pet ke kide door",
    "Ver2":"Kide + infection door",
    "Ven1":"Gupt rog + srav door",
    "W.E.":"Nervous system balance",
    "R.E.":"Urja badhayega",
    "Y.E.":"Sujan + dard door",
    "B.E.":"BP + fluid door",
    "G.E.":"Khoon + lymph saaf",
  };

  const parts = fo.med_parts || fo.medicines || [];

  return (
    <div style={{
      background:"#fff", borderRadius:14,
      border:`1.5px solid ${acc}30`,
      borderLeft:`4px solid ${acc}`,
      boxShadow:"0 2px 8px rgba(0,0,0,0.06)",
      marginBottom:12, overflow:"hidden"
    }}>
      {/* Header */}
      <div style={{
        padding:"13px 14px",
        background:`${acc}08`,
        display:"flex", alignItems:"center",
        justifyContent:"space-between",
        cursor:"pointer"
      }} onClick={()=>setOpen(!open)}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{
            width:40,height:40,borderRadius:10,
            background:acc,color:"#fff",
            display:"flex",alignItems:"center",
            justifyContent:"center",fontSize:19
          }}>{mix.icon||"💊"}</div>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:acc}}>
              {mix.label}
            </div>
            <div style={{fontWeight:700,fontSize:13,color:"#1e1b4b"}}>
              {mix.labelHi || mix.name_hi || mix.nh || ""}
            </div>
          </div>
        </div>
        <span style={{color:acc,fontWeight:700}}>{open?"▲":"▼"}</span>
      </div>

      {/* Formula — hamesha dikhe */}
      <div style={{
        margin:"0 14px 0",
        background:"linear-gradient(135deg,#1e1b4b,#312e81)",
        borderRadius:10, padding:"10px 13px",
        display:"flex",flexWrap:"wrap",
        alignItems:"center",gap:6
      }}>
        {parts.map((p,i)=>(
          <span key={i} style={{display:"flex",alignItems:"center",gap:4}}>
            <span style={{
              background:"#4338ca",color:"#fff",
              borderRadius:7,padding:"4px 11px",
              fontWeight:800,fontSize:14,fontFamily:"monospace"
            }}>{p}</span>
            <span style={{color:"#818cf8",fontWeight:700}}>+</span>
          </span>
        ))}
        <span style={{
          background:"#7c3aed",color:"#fff",
          borderRadius:7,padding:"4px 11px",
          fontWeight:800,fontSize:14
        }}>{fo.electricity || mix.electricity}</span>
        <span style={{color:"#818cf8",margin:"0 3px"}}>—</span>
        <span style={{
          background:"#f59e0b",color:"#fff",
          borderRadius:7,padding:"4px 11px",
          fontWeight:800,fontSize:14
        }}>{fo.dilution || mix.dilution || "D6"}</span>
      </div>

      {/* Dose + Timing — hamesha dikhe */}
      <div style={{
        display:"flex",gap:0,
        margin:"10px 14px",
        background:"#f8fafc",
        borderRadius:10,overflow:"hidden",
        border:"1px solid #e2e8f0"
      }}>
        <div style={{
          flex:1,padding:"10px 12px",
          borderRight:"1px solid #e2e8f0"
        }}>
          <div style={{
            fontSize:10,color:"#94a3b8",
            fontWeight:700,marginBottom:3
          }}>💧 MATRA</div>
          <div style={{
            fontSize:13,fontWeight:700,color:"#1e1b4b"
          }}>10 boonden</div>
          <div style={{fontSize:11,color:"#64748b"}}>
            aadha cup gunguna paani
          </div>
        </div>
        <div style={{flex:1,padding:"10px 12px"}}>
          <div style={{
            fontSize:10,color:"#94a3b8",
            fontWeight:700,marginBottom:3
          }}>🕐 SAMAY</div>
          <div style={{
            fontSize:12,fontWeight:600,
            color:"#059669"
          }}>{mix.schedule||"—"}</div>
        </div>
      </div>

      {/* Kaam — expand pe dikhe */}
      {open && (
        <div style={{
          borderTop:"1px solid #f1f5f9",
          padding:"12px 14px",background:"#fafbff"
        }}>
          <div style={{
            fontWeight:700,fontSize:12,
            color:"#5b4fcf",marginBottom:10
          }}>⚕️ YEH FORMULA IS ROG MEIN KYA KAREGA:</div>

          {[...parts, fo.electricity].filter(Boolean).map((p,i)=>(
            <div key={i} style={{
              display:"flex",gap:10,alignItems:"flex-start",
              padding:"7px 0",
              borderBottom: i < parts.length
                ? "1px solid #f1f5f9" : "none"
            }}>
              <span style={{
                background:acc,color:"#fff",
                borderRadius:5,padding:"2px 7px",
                fontWeight:800,fontSize:11,
                fontFamily:"monospace",flexShrink:0,
                minWidth:40,textAlign:"center"
              }}>{p}</span>
              <span style={{
                fontSize:12,color:"#374151",lineHeight:1.6
              }}>
                {KAAM[p] || `${p} — targeted organ par kaam karega`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ───────────────────────────────────────────────────────────────
export default function EHRecommenderV33(){
  const[dbMeds,setDbMeds]=useState({});
  const[dbStatus,setDbStatus]=useState("checking");
  const[form,setForm]=useState({name:"",age:"",gender:"male",bp:"",nature:"chronic",symptoms:""});
  const[result,setResult]=useState(null);
  const[reportText,setReportText]=useState("");
  const[loading,setLoading]=useState(false);
  const[tab,setTab]=useState("visual");

  useEffect(()=>{
    fetch(`${BASE_URL}/api/medicines`,{signal:AbortSignal.timeout(5000)})
      .then(r=>r.json()).then(d=>{if(d.medicines){setDbMeds(d.medicines);setDbStatus("connected");}})
      .catch(()=>setDbStatus("offline"));
  },[]);

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));

  const handleAnalyze=useCallback(()=>{
    if(!form.symptoms.trim())return;
    setLoading(true);setResult(null);

    const syms=form.symptoms.trim();
    let bpSystolic=120, bpDiastolic=80;
    try {
      const parts = form.bp.split("/");
      bpSystolic = parseInt(parts[0]) || 120;
      bpDiastolic = parseInt(parts[1]) || 80;
    } catch(e) {}

    // ── Call Expert Engine API ──
    fetch(`${BASE_URL}/api/expert/analyze`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        patient_name:   form.name||"Patient",
        age:            parseInt(form.age)||30,
        gender:         form.gender||"Male",
        chief_complaint: syms,
        symptoms_text:   syms,
        bp_systolic:    bpSystolic,
        bp_diastolic:   bpDiastolic,
        nature:         form.nature||"chronic",
      }),
      signal: AbortSignal.timeout(120000),
    })
    .then(r=>r.json())
    .then(apiRes=>{
      if (!apiRes.success) throw new Error(apiRes.message || "Expert Engine Error");
      
      const data = apiRes.data;
      const ordered = data.active_systems || data.eh_analysis?.active_systems || [];
      const mixtures = data.mixtures || data.eh_analysis?.mixtures || [];
      const summaryText = data.parcha || data.clinical_summary || data.eh_analysis?.parcha || '';
      
      // Map mixtures to UI format
      const uiMixtures = mixtures.map((mix, idx) => {
        const sysKey = mix.system_key || ordered[idx] || "GENERAL";
        const meta = SYSTEM_META[sysKey] || { icon: "💊", nameHi: "सामान्य उपचार" };
        
        return {
          ...mix,
          label: `MIXTURE ${String.fromCharCode(65 + idx)}`,
          systemKey: sysKey,
          icon: meta.icon,
          nameHi: meta.nameHi,
          labelHi: meta.nameHi,
          // formula_obj is already in the API response
        };
      });

      const res = {
        ordered,
        mixtures: uiMixtures,
        temperament: data.temperament || "Mixed",
        tempRationale: data.reasoning_trace?.join(" | ") || "",
        logs: data.reasoning_trace?.map(t => ({ type: "trace", found: t, cat: "SYSTEM" })) || [],
        comboNotes: [], // Expert engine can add these if needed
        dosage: {
          dil: typeof data.potency === 'object' ? data.potency?.potency : (data.potency || data.eh_analysis?.potency?.potency || 'D6'),
          freq: "5-10 बूंद — आधा कप गुनगुने पानी में — दिन में 3-4 बार",
          duration: "4 सप्ताह",
          note: ordered.length >= 2 ? "⚠️ अलग-अलग Mixture एक गिलास में न मिलाएं।" : ""
        },
        parcha: summaryText
      };

      setResult(res);
      setReportText(summaryText);
      setTab("visual");
      setLoading(false);
    })
    .catch(err=>{
      console.error("Analysis failed:", err);
      setLoading(false);
      alert("Analysis failed: " + err.message);
    });
  },[form]);

  const examples=[
    "saitica ka dard hai left side ke per me kamar me bhi dard hai pet saf nahi hota",
    "shine me ganth hai safed pani jata hai kamjori bhi lagti hai",
    "haath pair mein sujan hai kabz hai kamjori rehti hai",
    "bukhar hai khansi ho rahi hai saans lene mein takleef hai",
    "safed pani aur kamar dard hai jhunjhuni bhi hoti hai",
    "piliya ke lakshan hain pet mein dard hai gas bhi hai",
  ];

  const isMobile=typeof window!=="undefined"&&window.innerWidth<640;

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(145deg,#0f0c29,#1a1a4e,#24243e)",fontFamily:"Georgia,serif"}}>
      {/* HEADER */}
      <div style={{background:"linear-gradient(90deg,#312e81,#4c1d95,#1e1b4b)",borderBottom:"2px solid #6366f1",padding:"14px 16px 10px"}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"flex-start",flexWrap:"wrap",gap:8}}>
          <div>
            <div style={{fontSize:9,color:"#a5b4fc",letterSpacing:3,marginBottom:2,fontFamily:"sans-serif"}}>🌿 ELECTRO-HOMEOPATHY CLINICAL SYSTEM v3.3</div>
            <h1 style={{margin:0,fontSize:isMobile?17:20,fontWeight:900,color:"#fff",textShadow:"0 2px 20px rgba(139,92,246,0.8)"}}>बहु-रोग स्पैजिरिक अनुशंसा प्रणाली</h1>
            <div style={{color:"#c4b5fd",fontSize:10,marginTop:2,fontFamily:"sans-serif"}}>EH Triad Scoring · 34 Medicines · Dynamic Formula · Multiple Disease</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{display:"flex",alignItems:"center",gap:5,justifyContent:"flex-end"}}>
              <div style={{width:7,height:7,borderRadius:"50%",background:dbStatus==="connected"?"#22c55e":dbStatus==="offline"?"#f59e0b":"#6366f1"}}/>
              <span style={{fontSize:10,color:dbStatus==="connected"?"#86efac":dbStatus==="offline"?"#fcd34d":"#a5b4fc",fontFamily:"sans-serif"}}>
                {dbStatus==="connected"?"DB Connected":dbStatus==="offline"?"Offline Mode":"Connecting..."}
              </span>
            </div>
            <div style={{color:"#4b5563",fontSize:9,marginTop:1,fontFamily:"sans-serif"}}>electrohomeopathy.db</div>
          </div>
        </div>
      </div>

      <div style={{maxWidth:860,margin:"0 auto",padding:"14px 12px"}}>
        {/* INPUT FORM */}
        <div style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(99,102,241,0.3)",borderRadius:16,padding:16,marginBottom:16,backdropFilter:"blur(10px)"}}>
          <div style={{color:"#e0e7ff",fontWeight:700,fontSize:14,marginBottom:11,fontFamily:"sans-serif"}}>📋 मरीज का विवरण दर्ज करें</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginBottom:10}}>
            {[["नाम","name","Patient name",130],["उम्र","age","Age",65],["BP","bp","120/80",88]].map(([lbl,key,ph,w])=>(
              <div key={key}>
                <label style={{color:"#a5b4fc",fontSize:10,display:"block",marginBottom:2,fontFamily:"sans-serif"}}>{lbl}</label>
                <input value={form[key]} onChange={e=>set(key,e.target.value)} placeholder={ph}
                  style={{background:"rgba(30,27,75,0.9)",color:"#e0e7ff",border:"1.5px solid rgba(99,102,241,0.4)",borderRadius:9,padding:"7px 9px",fontSize:13,outline:"none",width:w,fontFamily:"sans-serif"}}/>
              </div>
            ))}
            <div>
              <label style={{color:"#a5b4fc",fontSize:10,display:"block",marginBottom:2,fontFamily:"sans-serif"}}>लिंग</label>
              <select value={form.gender} onChange={e=>set("gender",e.target.value)}
                style={{background:"rgba(30,27,75,0.9)",color:"#e0e7ff",border:"1.5px solid rgba(99,102,241,0.4)",borderRadius:9,padding:"7px 9px",fontSize:13,outline:"none",fontFamily:"sans-serif"}}>
                <option value="male">पुरुष</option><option value="female">महिला</option><option value="other">अन्य</option>
              </select>
            </div>
            <div>
              <label style={{color:"#a5b4fc",fontSize:10,display:"block",marginBottom:2,fontFamily:"sans-serif"}}>रोग प्रकृति</label>
              <select value={form.nature} onChange={e=>set("nature",e.target.value)}
                style={{background:"rgba(30,27,75,0.9)",color:"#e0e7ff",border:"1.5px solid rgba(99,102,241,0.4)",borderRadius:9,padding:"7px 9px",fontSize:13,outline:"none",fontFamily:"sans-serif"}}>
                <option value="acute">Acute — तीव्र (D10/D30)</option>
                <option value="chronic">Chronic — पुराना (D3/D5)</option>
                <option value="neutral">Neutral — सामान्य (D5/D6)</option>
              </select>
            </div>
          </div>
          <textarea value={form.symptoms} onChange={e=>set("symptoms",e.target.value)}
            placeholder="लक्षण लिखें — Hindi / Hinglish / English&#10;जैसे: saitica ka dard hai, kamar dard hai, pet saf nahi hota"
            style={{width:"100%",minHeight:80,borderRadius:10,border:"1.5px solid rgba(99,102,241,0.4)",background:"rgba(15,12,41,0.6)",color:"#e0e7ff",padding:"9px 10px",fontSize:13,fontFamily:"sans-serif",resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.6}}/>
          <div style={{marginTop:6,marginBottom:10}}>
            <div style={{color:"#818cf8",fontSize:10,letterSpacing:1,marginBottom:3,fontFamily:"sans-serif"}}>EXAMPLES</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
              {examples.map((ex,i)=>(
                <button key={i} onClick={()=>set("symptoms",ex)}
                  style={{background:"rgba(99,102,241,0.15)",border:"1px solid rgba(99,102,241,0.3)",color:"#c4b5fd",borderRadius:14,padding:"3px 10px",fontSize:10,cursor:"pointer",fontFamily:"sans-serif"}}>
                  Ex {i+1}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleAnalyze} disabled={!form.symptoms.trim()||loading}
            style={{background:form.symptoms.trim()&&!loading?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(99,102,241,0.3)",color:"#fff",border:"none",borderRadius:10,padding:"10px 24px",fontSize:14,fontWeight:700,cursor:form.symptoms.trim()&&!loading?"pointer":"not-allowed",fontFamily:"sans-serif",boxShadow:form.symptoms.trim()&&!loading?"0 4px 15px rgba(99,102,241,0.4)":"none",width:"100%"}}>
            {loading?"⏳ Analyzing (EH Triad Scoring)...":"🔬 Analyze & Generate Report"}
          </button>
        </div>

        {/* RESULTS */}
        {result&&(
          <div>
            <div style={{display:"flex",gap:6,marginBottom:11}}>
              {[{id:"visual",label:"📊 Visual Report"},{id:"report",label:"📄 Clinical Report"}].map(t=>(
                <button key={t.id} onClick={()=>setTab(t.id)}
                  style={{background:tab===t.id?"linear-gradient(135deg,#6366f1,#8b5cf6)":"rgba(255,255,255,0.06)",color:tab===t.id?"#fff":"#a5b4fc",border:`1px solid ${tab===t.id?"transparent":"rgba(99,102,241,0.3)"}`,borderRadius:9,padding:"7px 14px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",flex:1}}>
                  {t.label}
                </button>
              ))}
            </div>

            {tab==="visual"&&(
              <div>
                {/* Temperament */}
                <div style={{background:"linear-gradient(135deg,#1e1b4b,#312e81)",border:"1px solid #6366f1",borderRadius:13,padding:"13px 15px",marginBottom:13}}>
                  <div style={{display:"flex",flexWrap:"wrap",gap:10,alignItems:"center"}}>
                    <div style={{flex:1,minWidth:150}}>
                      <div style={{color:"#a5b4fc",fontSize:10,letterSpacing:2,marginBottom:2,fontFamily:"sans-serif"}}>TEMPERAMENT (मिज़ाज)</div>
                      <div style={{color:"#fff",fontWeight:800,fontSize:14}}>{result.temperament}</div>
                      <div style={{color:"#c7d2fe",fontSize:11,marginTop:2}}>{result.tempRationale}</div>
                    </div>
                    <div>
                      <div style={{color:"#a5b4fc",fontSize:10,letterSpacing:2,marginBottom:3,fontFamily:"sans-serif"}}>ACTIVE SYSTEMS ({result.ordered.length})</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {result.ordered.map((s,i)=>(
                          <span key={s} style={{background:ACCENT[i%ACCENT.length],color:"#fff",borderRadius:14,padding:"3px 10px",fontSize:11,fontWeight:700,fontFamily:"sans-serif"}}>
                            {result.mixtures[i]?.icon} {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mixtures */}
                <div style={{color:"#e0e7ff",fontWeight:800,fontSize:15,marginBottom:8,fontFamily:"sans-serif"}}>
                  💊 Spagyric Mixtures
                  <span style={{background:"rgba(99,102,241,0.2)",color:"#a5b4fc",borderRadius:14,padding:"2px 9px",fontSize:12,marginLeft:6}}>{result.mixtures.length}</span>
                  <span style={{fontSize:10,color:"#6366f1",marginLeft:5,fontWeight:400}}>← expand for DB data & scoring</span>
                </div>
                {result.mixtures.map((m,i)=><MixtureCard key={i} mix={m} idx={i}/>)}

                {result.comboNotes?.length>0&&(
                  <div style={{background:"linear-gradient(135deg,#451a03,#78350f)",border:"1px solid #f59e0b",borderRadius:12,padding:"10px 13px",marginBottom:11}}>
                    <div style={{color:"#fbbf24",fontWeight:700,fontSize:12,marginBottom:4,fontFamily:"sans-serif"}}>⚠️ COMBINATION NOTES</div>
                    {result.comboNotes.map((n,i)=><div key={i} style={{color:"#fef3c7",fontSize:12,fontFamily:"sans-serif",marginBottom:2}}>{i+1}. {n}</div>)}
                  </div>
                )}

                {/* Dosage */}
                <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(99,102,241,0.2)",borderRadius:12,padding:"12px 14px",marginBottom:11}}>
                  <div style={{color:"#a5b4fc",fontWeight:700,fontSize:13,marginBottom:8,fontFamily:"sans-serif"}}>📏 Dosage Protocol</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:6}}>
                    {[{l:"Dilution",v:result.dosage.dil,i:"🧪"},{l:"Frequency",v:result.dosage.freq,i:"⏰"},{l:"Duration",v:result.dosage.duration,i:"📅"},...(result.dosage.note?[{l:"Note",v:result.dosage.note,i:"⚠️"}]:[])].map(({l,v,i:ic})=>(
                      <div key={l} style={{background:"rgba(99,102,241,0.1)",borderRadius:8,padding:"7px 9px"}}>
                        <div style={{color:"#818cf8",fontSize:10,fontFamily:"sans-serif",marginBottom:2}}>{ic} {l}</div>
                        <div style={{color:"#e0e7ff",fontSize:12,fontFamily:"sans-serif"}}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Diet Section */}
                {result.diet && (
                  <div style={{background:"#f0fdf4",border:"1px solid #22c55e",
                               borderRadius:12,padding:13,marginBottom:12}}>
                    <div style={{fontWeight:800,fontSize:13,color:"#14532d",
                                 marginBottom:6,fontFamily:"sans-serif"}}>
                      🥗 {result.diet.title}
                    </div>
                    <div style={{fontSize:11,color:"#166534",marginBottom:8}}>
                      {result.diet.principle}
                    </div>

                    <div style={{fontWeight:700,fontSize:11,color:"#15803d",
                                 marginBottom:4}}>✅ ZAROOR KHAYEN:</div>
                    {(result.diet.pathya || []).slice(0,8).map((item,i) => (
                      <div key={i} style={{display:"flex",gap:6,marginBottom:3}}>
                        <span style={{color:"#15803d",fontSize:11}}>•</span>
                        <span style={{fontSize:11,color:"#166534"}}>
                          <strong>{item.item}</strong> — {item.reason}
                        </span>
                      </div>
                    ))}

                    <div style={{fontWeight:700,fontSize:11,color:"#dc2626",
                                 marginTop:8,marginBottom:4}}>❌ BILKUL NAHI:</div>
                    {(result.diet.apathya || []).slice(0,6).map((item,i) => (
                      <div key={i} style={{display:"flex",gap:6,marginBottom:3}}>
                        <span style={{color:"#dc2626",fontSize:11}}>•</span>
                        <span style={{fontSize:11,color:"#7f1d1d"}}>
                          <strong>{item.item}</strong> — {item.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button onClick={()=>setTab("report")} style={{background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",borderRadius:9,padding:"8px 20px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif",width:"100%"}}>
                  📄 View Clinical Report →
                </button>
              </div>
            )}

            {tab==="report"&&(
              <div>
                <div style={{display:"flex",gap:6,marginBottom:10,flexWrap:"wrap"}}>
                  <button onClick={()=>{const w=window.open("","_blank");w.document.write(`<pre style="font-family:monospace;font-size:12px;padding:20px;white-space:pre-wrap;background:#fff;color:#111">${result.parcha||reportText}</pre>`);w.print();}}
                    style={{background:"linear-gradient(135deg,#059669,#047857)",color:"#fff",border:"none",borderRadius:9,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
                    🖨️ Print
                  </button>
                  <button onClick={()=>{const el=document.createElement("a");el.href="data:text/plain;charset=utf-8,"+encodeURIComponent(result.parcha||reportText);el.download=`EH_Parcha_${form.name||"Patient"}.txt`;el.click();}}
                    style={{background:"rgba(99,102,241,0.2)",color:"#a5b4fc",border:"1px solid rgba(99,102,241,0.4)",borderRadius:9,padding:"7px 16px",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"sans-serif"}}>
                    💾 Download .txt
                  </button>
                </div>
                <div style={{background:"#fff",borderRadius:13,padding:"18px 14px",maxHeight:560,overflowY:"auto"}}>
                  <pre style={{fontFamily:"'Courier New',monospace",fontSize:11.5,color:"#1a1a2e",whiteSpace:"pre-wrap",lineHeight:1.75,margin:0}}>
                    {result.parcha||reportText}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{borderTop:"1px solid rgba(99,102,241,0.2)",padding:"9px 16px",marginTop:14}}>
        <div style={{maxWidth:860,margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:5}}>
          <span style={{color:"#374151",fontSize:10,fontFamily:"sans-serif"}}>EH v3.3 · 34 Medicines · EH Triad Scoring · Dynamic Formula · Multi-Disease</span>
          <div style={{display:"flex",gap:5}}>
            {Object.entries(ELEC).map(([k,{color,bg}])=>(
              <span key={k} style={{background:bg,border:`1px solid ${color}`,color:color,borderRadius:5,padding:"2px 6px",fontSize:10,fontWeight:700}}>{k}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
