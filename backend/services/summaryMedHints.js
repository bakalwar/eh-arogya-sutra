'use strict';

/** शुद्ध हिंदी औषधि विवरण — बुक OCR/अंग्रेज़ी कभी पर्चे में नहीं */
const MED_HINT_HI = {
  S1: '**S1 (स्क्रोफोलोसो-१):** रस प्रणाली की मुख्य शुद्धि; लसीका मार्ग; प्रतिरक्षीय संतुलन।',
  S2: '**S2 (स्क्रोफोलोसो-२):** यकृत व लसीका ग्रंथियों की शुद्धि; पित्त प्रवाह सामान्य करने में सहायक।',
  S3: '**S3 (स्क्रोफोलोसो-३):** प्रजनन ग्रंथियाँ व हार्मोनल संतुलन।',
  S4: '**S4 (स्क्रोफोलोसो-४):** थायरॉइड व चयापचय नियंत्रण।',
  S5: '**S5 (स्क्रोफोलोसो-५):** त्वचा, जोड़ों का दर्द व लसीकीय सूजन।',
  S6: '**S6 (स्क्रोफोलोसो-६):** मूत्र मार्ग व यूरिक अपशिष्ट निष्कासन में सहायक।',
  S10:
    '**S10 (स्क्रोफोलोसो-१०):** पाचन तंत्र व आंतों की आधार शुद्धि करके कब्ज व गैस में राहत देना।',
  A1: '**A1 (एंजिटिको-१):** हृदय व धमनियाँ; परिसंचरण सुधार।',
  A2: '**A2 (एंजिटिको-२):** शिराएँ व नसों की जकड़न — केवल चिकित्सक निर्देशानुसार।',
  A3: '**A3 (एंजिटिको-३):** रक्त वाहिका तल; रक्तचाप संतुलन में प्रमुख भूमिका।',
  C1: '**C1 (कैंसरोसो-१):** सामान्य दुर्बलता व ऊर्जा।',
  C4: '**C4 (कैंसरोसो-४):** ऊतक मरम्मत व जोड़ों का दर्द।',
  C5: '**C5 (कैंसरोसो-५):** लसीका गांठ व असामान्य वृद्धि संबंधी लक्षण।',
  C8: '**C8 (कैंसरोसो-८):** पाचन व यकृत की जीर्ण समस्याएँ।',
  C9: '**C9 (कैंसरोसो-९):** जोड़ों व हड्डी संबंधी जीर्ण विकार में सहयोग।',
  C10: '**C10 (कैंसरोसो-१०):** अग्न्याशय व शर्करा संतुलन में सहयोग।',
  C16: '**C16 (कैंसरोसो-१६):** महिला प्रजनन अंग मार्ग।',
  F1: '**F1 (फेब्रीफुगो-१):** तंत्रिका तंत्र शांति; घबराहट, चक्कर, अनिद्रा में सहायक।',
  F2: '**F2 (फेब्रीफुगो-२):** ताप व तीव्र लक्षणों में सहयोग।',
  L1: '**L1 (लिम्फेटिको-१):** प्रतिरक्षीय घटक व प्लेटलेट मार्ग।',
  P1: '**P1 (पेक्टोरले-१):** श्वास मार्ग ऊपरी भाग।',
  YE: '**YE (पीली विद्युत):** उग्र अवस्था में बाह्य शांतिकारक संकेत।',
  RE: '**RE (लाल विद्युत):** निष्क्रिय अवस्था में ऊर्जा व संचार उत्थान।',
  BE: '**BE (नीली विद्युत):** रक्त वाहिका तल; उच्च दबाव संदर्भ में बाह्य सहयोग।',
  WE: '**WE (सफेद विद्युत):** साम्य व नसों की कोमलता; अनिद्रा व घबराहट में।',
  GE: '**GE (हरी विद्युत):** जोड़ व लसीकीय सूजन के बाह्य संकेत।'
};

function normMedKey(raw) {
  return String(raw || '')
    .replace(/-/g, '')
    .replace(/\./g, '')
    .toUpperCase()
    .trim();
}

function hintForMedicine(raw) {
  const k = normMedKey(raw);
  if (!k) return null;
  return (
    MED_HINT_HI[k] ||
    `**${k}:** स्पैजिरिक संयोजन का अंग; चिकित्सक के निर्देशानुसार प्रयोग।`
  );
}

function devanagariCount(s) {
  return (String(s).match(/[\u0900-\u097F]/g) || []).length;
}

/** OCR / अंग्रेज़ी बुक लाइन पर्चे में नहीं */
function isPublishableHindiText(text) {
  const t = String(text || '').trim();
  if (!t || t.length < 8) return false;
  if (
    /expert engine|typical code|Angiotico|Canceroso\s*No|Scrofoloso\s*No|Febrifugo\s*No|Linfatico|frhfeeh|PTH,\s*calcium|blueprint/i.test(
      t
    )
  ) {
    return false;
  }
  if (/\b[A-Za-z]{4,}\b.*\b[A-Za-z]{4,}\b/.test(t) && devanagariCount(t) < 15) return false;
  const dev = devanagariCount(t);
  if (dev < 10) return false;
  const latinWords = (t.match(/\b[A-Za-z]{3,}\b/g) || []).length;
  return dev >= latinWords * 4;
}

function humanizeComplaintHindi(raw) {
  let s = String(raw || '').trim();
  if (!s) return '';
  if (devanagariCount(s) >= 8) return s;
  const low = s.toLowerCase();
  const parts = [];
  if (/kamjori|weakness/.test(low)) parts.push('कमजोरी');
  if (/dard|pain|hurt/.test(low)) parts.push('शरीर में दर्द');
  if (/chakkar|giddiness|dizzy/.test(low)) parts.push('चक्कर');
  if (/ghabrahat|anxiety/.test(low)) parts.push('घबराहट');
  if (/neend|sleep/.test(low)) parts.push('नींद की कमी');
  if (/ulti|vomit/.test(low)) parts.push('उल्टी');
  if (/bp|blood pressure|raktachap|रक्तचाप/.test(low)) parts.push('रक्तचाप संबंधी तकलीफ');
  if (/kabz|constipation/.test(low)) parts.push('कब्ज');
  if (/gas|flatulence/.test(low)) parts.push('गैस');
  if (parts.length) return parts.join('، ');
  return s.replace(/\s+/g, ' ').slice(0, 120);
}

function dedupeComplaints(symptoms) {
  const seen = new Set();
  const out = [];
  for (const s of symptoms || []) {
    const hi = humanizeComplaintHindi(
      typeof s === 'object' ? s.hindi || s.name || '' : String(s)
    );
    if (!hi) continue;
    const key = hi.toLowerCase().replace(/\s+/g, ' ');
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(hi);
  }
  return out;
}

function buildMedicineBulletsForFormula(medicineCodes) {
  const seen = new Set();
  const lines = [];
  for (const raw of medicineCodes || []) {
    const k = normMedKey(raw);
    if (!k || seen.has(k)) continue;
    seen.add(k);
    const h = hintForMedicine(raw);
    if (h) lines.push(`- ${h}`);
  }
  return lines.join('\n');
}

module.exports = {
  MED_HINT_HI,
  normMedKey,
  hintForMedicine,
  isPublishableHindiText,
  humanizeComplaintHindi,
  dedupeComplaints,
  buildMedicineBulletsForFormula
};
