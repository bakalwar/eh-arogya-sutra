'use strict';

// ═══════════════════════════════════════════════════
// E.H. AROGYA SUTRA — ANATOMY + PATHOLOGY DATABASE
// EH_AI_Expert_Complete_Cursor-2.pdf — Count Cesare Mattei
// ═══════════════════════════════════════════════════

const ORGAN_EH_MAP = {
  lymphatic_system: {
    hindi: 'लसीका तंत्र (Lymphatic System)',
    eh_group: ['S-Group (Scrofoloso)', 'L-Group (Limfatico)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'लसीका नोड्स, प्लीहा (Spleen), थाइमस, लसीका वाहिकाएँ',
    pathology: 'ग्रंथि सूजन, गांठ, इम्यूनिटी कमजोरी, विष जमाव',
    medicines: ['S-1', 'S-2', 'S-5', 'S-10', 'L-1'],
    electricity: 'G.E. (हरी विद्युत)',
    location: 'प्रभावित लसीका ग्रंथि पर'
  },
  cardiovascular: {
    hindi: 'हृदय एवं रक्त वाहिका तंत्र (Cardiovascular)',
    eh_group: ['A-Group (Angioitico)'],
    temperament: 'Sanguine',
    vitiation: 'रक्त (Blood) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'हृदय (बायाँ/दायाँ), धमनियाँ (Arteries), शिराएँ (Veins)',
    pathology: 'उच्च रक्तचाप, धमनी कठोरता, हृदय की अनियमितता',
    medicines: ['A-1', 'A-2', 'A-3'],
    electricity: 'B.E. (नीली विद्युत)',
    location: 'माथे पर और हृदय के पास (बाईं छाती)'
  },
  nervous_system: {
    hindi: 'तंत्रिका तंत्र (Nervous System)',
    eh_group: ['F-Group (Febrifugo)', 'C-Group (Canceroso)'],
    temperament: 'Nervous',
    vitiation: 'रस एवं रक्त दोनों',
    polarity: 'POSITIVE',
    anatomy: 'मस्तिष्क, रीढ़ की हड्डी, परिधीय तंत्रिकाएँ',
    pathology: 'घबराहट, अनिद्रा, माइग्रेन, न्यूरोपैथी, चक्कर',
    medicines: ['F-1', 'F-2', 'C-2'],
    electricity: 'W.E. (सफेद विद्युत)',
    location: 'सिर के पिछले भाग (Occiput) और कनपटी'
  },
  respiratory: {
    hindi: 'श्वसन तंत्र (Respiratory System)',
    eh_group: ['P-Group (Pectorale)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'फेफड़े (ऊपरी/निचले), नासिका, श्वास नली',
    pathology: 'ब्रोंकाइटिस, अस्थमा, सांस फूलना, खांसी, सर्दी-जुकाम',
    medicines: ['P-1', 'P-2', 'P-3'],
    electricity: 'Y.E. (पीली विद्युत)',
    location: 'छाती के ऊपर और पीठ भाग पर'
  },
  digestive: {
    hindi: 'पाचन तंत्र (Digestive System)',
    eh_group: ['S-Group (Scrofoloso)', 'C-Group (Canceroso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'यकृत (Liver), पेट, अग्न्याशय, आंतें',
    pathology: 'कब्ज, गैस, अपच, फैटी लिवर, पीलिया',
    medicines: ['S-2', 'S-10', 'C-8', 'C-10', 'C-15'],
    electricity: 'Y.E. (पीली विद्युत)',
    location: 'पेट के मध्य भाग पर Compress'
  },
  urinary: {
    hindi: 'मूत्र तंत्र (Urinary System)',
    eh_group: ['S-Group (Scrofoloso)', 'C-Group (Canceroso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'गुर्दे (Kidneys), मूत्रवाहिनी, मूत्राशय',
    pathology: 'UTI, पथरी (Calculi), Creatinine↑, Uric Acid↑',
    medicines: ['S-6', 'C-6', 'C-17'],
    electricity: 'G.E. (हरी विद्युत)',
    location: 'पीठ पर गुर्दे के पास (कमर के दोनों ओर)'
  },
  musculoskeletal: {
    hindi: 'मांसपेशी एवं कंकाल तंत्र (Musculoskeletal)',
    eh_group: ['C-Group (Canceroso)', 'S-Group (Scrofoloso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'हड्डियाँ, जोड़ (Joints), उपास्थि (Cartilage), मांसपेशियाँ',
    pathology: 'गठिया (Arthritis), यूरिक एसिड↑, PTH↑, ऑस्टियोपोरोसिस',
    medicines: ['C-4', 'C-3', 'S-5', 'S-6'],
    electricity: 'G.E. (हरी विद्युत)',
    location: 'प्रभावित जोड़ पर — घुटना, कूल्हा, कंधा'
  },
  endocrine: {
    hindi: 'अंतःस्रावी तंत्र (Endocrine System)',
    eh_group: ['S-Group (Scrofoloso)', 'C-Group (Canceroso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'थायरॉइड, पैराथायरॉइड, अग्न्याशय (Pancreas), अधिवृक्क',
    pathology: 'मधुमेह (Diabetes), थायरॉइड विकार, PTH असंतुलन',
    medicines: ['S-4', 'C-10', 'C-13'],
    electricity: 'Y.E. (पीली विद्युत)',
    location: 'गले (थायरॉइड) और पेट (Pancreas) पर'
  },
  skin: {
    hindi: 'त्वचा तंत्र (Integumentary System)',
    eh_group: ['S-Group (Scrofoloso)', 'C-Group (Canceroso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'POSITIVE',
    anatomy: 'त्वचा की तीन परतें, बाल, नाखून, स्वेद ग्रंथियाँ',
    pathology: 'एक्जिमा, सोरायसिस, दाद, खुजली, चर्म रोग',
    medicines: ['S-5', 'C-7', 'C-14'],
    electricity: 'B.E. (नीली विद्युत)',
    location: 'प्रभावित त्वचा पर सीधे Compress'
  },
  reproductive: {
    hindi: 'जनन तंत्र (Reproductive System)',
    eh_group: ['S-Group (Scrofoloso)', 'C-Group (Canceroso)'],
    temperament: 'Lymphatic',
    vitiation: 'रस (Lymph) विकृति',
    polarity: 'Mixed',
    anatomy: 'महिला: गर्भाशय, अंडाशय | पुरुष: प्रोस्टेट, वृषण',
    pathology: 'PCOD, ल्यूकोरिया, हार्मोन असंतुलन',
    medicines: ['S-3', 'C-16', 'S-2'],
    electricity: 'R.E. (लाल विद्युत)',
    location: 'पेट के निचले भाग पर'
  }
};

const PATHOLOGY_POLARITY = {
  high_bp: {
    polarity: 'POSITIVE',
    potency_hint: 'D10',
    eh_meaning: 'रक्त का अति-दबाव — ऋणात्मक औषधि आवश्यक'
  },
  fever: { polarity: 'POSITIVE', potency_hint: 'D10', eh_meaning: 'ताप की अधिकता — ऋणात्मक शीतल औषधि' },
  inflammation: {
    polarity: 'POSITIVE',
    potency_hint: 'D10',
    eh_meaning: 'सूजन = Positive अवस्था'
  },
  uric_acid_high: {
    polarity: 'POSITIVE',
    potency_hint: 'D10',
    eh_meaning: 'यूरिक एसिड की वृद्धि'
  },
  creatinine_high: {
    polarity: 'POSITIVE',
    potency_hint: 'D10',
    eh_meaning: 'गुर्दे में विषाक्त भार'
  },
  wbc_high: { polarity: 'POSITIVE', potency_hint: 'D10', eh_meaning: 'संक्रमण की संभावना' },
  sugar_high: { polarity: 'POSITIVE', potency_hint: 'D10', eh_meaning: 'शक्करा की अधिकता' },
  pth_high: { polarity: 'POSITIVE', potency_hint: 'D30', eh_meaning: 'PTH अधिकता — हड्डी विकृति' },
  hb_low: { polarity: 'NEGATIVE', potency_hint: 'D4', eh_meaning: 'हीमोग्लोबिन कमी — रक्त निर्माण आवश्यक' },
  platelet_low: {
    polarity: 'NEGATIVE',
    potency_hint: 'D4',
    eh_meaning: 'प्लेटलेट कमी — L-1 आवश्यक'
  },
  low_bp: { polarity: 'NEGATIVE', potency_hint: 'D4', eh_meaning: 'रक्तचाप का निम्नस्तर' },
  weakness: { polarity: 'NEGATIVE', potency_hint: 'D4', eh_meaning: 'ऊर्जा की कमी — धनात्मक औषधि' },
  atrophy: { polarity: 'NEGATIVE', potency_hint: 'D3', eh_meaning: 'ऊतक क्षय — पुनर्निर्माण आवश्यक' }
};

const LAB_RANGES = {
  hemoglobin: { low: 12.0, high: 17.0, unit: 'g/dL', hindi: 'हीमोग्लोबिन' },
  wbc: { low: 4000, high: 11000, unit: '/μL', hindi: 'श्वेत रक्त कोशिका' },
  platelets: { low: 150000, high: 400000, unit: '/μL', hindi: 'प्लेटलेट्स' },
  sugar_fast: { low: 70, high: 100, unit: 'mg/dL', hindi: 'रक्तशक्करा (Fasting)' },
  sugar_pp: { low: 70, high: 140, unit: 'mg/dL', hindi: 'रक्त शक्करा (PP)' },
  hba1c: { low: 4.0, high: 5.6, unit: '%', hindi: 'HbA1c' },
  creatinine: { low: 0.6, high: 1.2, unit: 'mg/dL', hindi: 'क्रिएटिनिन' },
  uric_acid: { low: 3.5, high: 7.0, unit: 'mg/dL', hindi: 'यूरिक एसिड' },
  potassium: { low: 3.5, high: 5.0, unit: 'mEq/L', hindi: 'पोटेशियम' },
  sodium: { low: 135, high: 145, unit: 'mEq/L', hindi: 'सोडियम' },
  pth: { low: 15, high: 65, unit: 'pg/mL', hindi: 'पैराथायरॉइड हार्मोन (PTH)' },
  vitamin_d: { low: 30, high: 100, unit: 'ng/mL', hindi: 'विटामिन D' },
  sgpt: { low: 7, high: 56, unit: 'U/L', hindi: 'SGPT (यकृत)' },
  sgot: { low: 10, high: 40, unit: 'U/L', hindi: 'SGOT (यकृत)' },
  cholesterol: { low: 0, high: 200, unit: 'mg/dL', hindi: 'कोलेस्ट्रॉल' },
  triglycerides: { low: 0, high: 150, unit: 'mg/dL', hindi: 'ट्राइग्लिसराइड्स' },
  tsh: { low: 0.4, high: 4.0, unit: 'mIU/L', hindi: 'TSH (थायरॉइड)' },
  t3: { low: 80, high: 200, unit: 'ng/dL', hindi: 'T3' },
  t4: { low: 5.0, high: 12.0, unit: 'μg/dL', hindi: 'T4' }
};

const MEDICINE_ANATOMY = {
  'S-1': {
    name: 'स्क्रोफोलोसो-1 (Scrofoloso-1)',
    group: 'S-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'लसीका तंत्र, पाचन नली, गुर्दे, चयापचय',
    pathology_treated: 'लसीका विकार, इम्यूनिटी कमजोरी, विष पदार्थ जमाव',
    polarity: 'Negative (ऋणात्मक)',
    action:
      'रस नाली की मुख्य औषधि। लसीका तंत्र को शुद्ध करती है। शरीर से विषाक्त पदार्थ निकालती है।'
  },
  'S-2': {
    name: 'स्क्रोफोलोसो-2 (Scrofoloso-2)',
    group: 'S-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'यकृत (Liver), पेट, लसीका ग्रंथियाँ',
    pathology_treated: 'यकृत विकार, पित्त असंतुलन, ग्रंथि सूजन',
    polarity: 'Negative',
    action: 'यकृत और लसीका ग्रंथियों की शुद्धि। पित्त (Bile) प्रवाह सामान्य करती है।'
  },
  'S-5': {
    name: 'स्क्रोफोलोसो-5 (Scrofoloso-5)',
    group: 'S-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'त्वचा, जोड़, लसीका',
    pathology_treated: 'त्वचा रोग, जोड़ों की सूजन, लसीका रुकावट',
    polarity: 'Negative',
    action: 'त्वचा एवं जोड़ों की लसीका शुद्धि। चर्म रोग एवं जोड़ सूजन में भावी।'
  },
  'S-6': {
    name: 'स्क्रोफोलोसो-6 (Scrofoloso-6)',
    group: 'S-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'गुर्दे (Kidneys), मूत्रवाहिनी, मूत्राशय',
    pathology_treated: 'Creatinine↑, Uric Acid↑, UTI, गुर्दे की पथरी',
    polarity: 'Negative',
    action: 'गुर्दे एवं मूत्रवाह तंत्र की विशेष शुद्धि। यूरिक एसिड निकालती है।'
  },
  'S-10': {
    name: 'स्क्रोफोलोसो-10 (Scrofoloso-10)',
    group: 'S-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'पाचन नली, आंतें, उदर लसीका',
    pathology_treated: 'कब्ज, गैस, आंतों में विष जमाव',
    polarity: 'Neutral',
    action: 'आधार औषधि। पाचन तंत्र की लसीका शुद्धि। कब्ज दूर करती है।'
  },
  'A-1': {
    name: 'एंजिटिको-1 (Angioitico-1)',
    group: 'A-Group',
    temperament: 'Sanguine',
    target_anatomy: 'हृदय का बायाँ भाग, धमनियाँ (Arteries)',
    pathology_treated: 'उच्च रक्तचाप, धमनी कठोरता, हृदय बायाँ दोष',
    polarity: 'Negative',
    action: 'हृदय और धमनियों की मुख्य औषधि। रक्तचाप नियंत्रित करती है।'
  },
  'A-2': {
    name: 'एंजिटिको-2 (Angioitico-2)',
    group: 'A-Group',
    temperament: 'Sanguine',
    target_anatomy: 'हृदय का दायाँ भाग, शिराएँ (Veins)',
    pathology_treated: 'नसों की जकड़न, वैरिकोज वेन्स, हृदय दायाँ दोष',
    polarity: 'Negative',
    action: 'शिरा और नसों की औषधि। नस जकड़न दूर करती है।'
  },
  'A-3': {
    name: 'एंजिटिको-3 (Angioitico-3)',
    group: 'A-Group',
    temperament: 'Sanguine',
    target_anatomy: 'रक्त कोशिकाएँ (RBC, WBC, Platelets)',
    pathology_treated: 'रक्त कोशिका विकार, HB↓, WBC असंतुलन',
    polarity: 'Both',
    action: 'रक्त कोशिकाओं की औषधि। HB बढ़ाती है, BP नियंत्रित करती है।'
  },
  'C-4': {
    name: 'कैंसरोसो-4 (Canceroso-4)',
    group: 'C-Group',
    temperament: 'Mixed',
    target_anatomy: 'हड्डियाँ, जोड़ उपास्थि (Cartilage), बाल, PTH',
    pathology_treated: 'ऑस्टियोपोरोसिस, जोड़ दर्द, PTH↑, बाल झड़ना',
    polarity: 'Both',
    action: 'हड्डी एवं जोड़ों की गहरी औषधि। PTH संतुलित करती है।'
  },
  'C-6': {
    name: 'कैंसरोसो-6 (Canceroso-6)',
    group: 'C-Group',
    temperament: 'Mixed',
    target_anatomy: 'गुर्दे की कोशिकाएँ (Renal cells)',
    pathology_treated: 'Creatinine↑, गुर्दे की कोशिका क्षति',
    polarity: 'Negative',
    action: 'गुर्दे की कोशिकाओं की गहरी औषधि। Creatinine↑ में विशेष।'
  },
  'C-10': {
    name: 'कैंसरोसो-10 (Canceroso-10)',
    group: 'C-Group',
    temperament: 'Mixed',
    target_anatomy: 'अग्न्याशय (Pancreas), इंसुलिन उत्पादक कोशिकाएँ',
    pathology_treated: 'मधुमेह (Type-2), इंसुलिन प्रतिरोध',
    polarity: 'Both',
    action: 'अग्न्याशय की औषधि। इंसुलिन नियंत्रण में सहायक।'
  },
  'F-1': {
    name: 'फेब्रीफुगो-1 (Febrifugo-1)',
    group: 'F-Group',
    temperament: 'Mixed',
    target_anatomy: 'मस्तिष्क, केंद्रीय तंत्रिका तंत्र, चयापचय केंद्र',
    pathology_treated: 'बुखार, घबराहट, चक्कर, अनिद्रा, माइग्रेन',
    polarity: 'Both',
    action: 'तंत्रिका तंत्र की मास्टर रेमेडी। मस्तिष्क अति-सक्रियता शांत करती है।'
  },
  'L-1': {
    name: 'लिम्फेटिको-1 (Limfatico-1)',
    group: 'L-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'प्लेटलेट्स, WBC, प्रतिरक्षा कोशिकाएँ',
    pathology_treated: 'प्लेटलेट कमी, डेंगू, इम्यूनिटी कमजोरी',
    polarity: 'Positive',
    action: 'प्लेटलेट्स और प्रतिरक्षा कोशिकाएँ बढ़ाती है।'
  },
  'P-1': {
    name: 'पेक्टोरले-1 (Pectorale-1)',
    group: 'P-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'फेफड़ों का ऊपरी भाग, नासिका',
    pathology_treated: 'ब्रोंकाइटिस, खांसी, छाती संक्रमण, सर्दी-जुकाम',
    polarity: 'Negative',
    action: 'श्वसन तंत्र की लसीका शुद्धि। खांसी और नाक में राहत।'
  },
  'VEN-1': {
    name: 'वेनेरेओ-1 (Venereo-1)',
    group: 'VEN-Group',
    temperament: 'Lymphatic',
    target_anatomy: 'वायरल संक्रमण कक्ष, परजीवी',
    pathology_treated: 'HCV, वायरल संक्रमण, परजीवी रोग',
    polarity: 'Negative',
    action: 'वायरल और परजीवी संक्रमण रोधी। HCV में विशेष।'
  }
};

module.exports = {
  ORGAN_EH_MAP,
  PATHOLOGY_POLARITY,
  LAB_RANGES,
  MEDICINE_ANATOMY
};
