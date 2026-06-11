'use strict';

/** लक्षण + BP → anatomy/pathology (7-खंड सार §3) */
function deriveAnatomyPathology(symptomText, sysDisp, diaDisp) {
  const t = String(symptomText || '').toLowerCase();
  let anatomy =
    'हृदय, रक्त वाहिकाएँ, नसों का तंत्र और समग्र परिसंचरण प्रणाली प्रभावित हैं';
  let pathology =
    'रक्त संचार में असंतुलन और शारीरिक तनाव से लक्षण बढ़ रहे हैं';

  if (/sardi|cold|jukam|jukaam|cough|खांसी|सर्दी|जुकाम|नाक|गला|bronch|phlegm|balgam|श्वसन|respiratory|सांस|rhinitis/.test(t)) {
    anatomy = 'नाक, गला, श्वसन मार्ग और फेफड़े प्रभावित हैं';
    pathology =
      'सर्दी-जुकाम से श्लेष्मा बढ़ना, गले में जलन और खांसी; नाक की भीड़ और श्वसन मार्ग में सूजन';
  } else if (/joint|gathiya|गठिया|सूजन|dard|pain|कमर|पीठ|जोड़|uric|यूरिक|sciatica|रीढ/.test(t)) {
    anatomy = 'रीढ़ की हड्डी, कमर की मांसपेशियाँ, जोड़ और नसों का तंत्र प्रभावित है';
    pathology =
      'नसों में खिंचाव, जोड़ों में सूजन और कमजोरी के कारण दर्द बढ़ रहा है; चलने-फिरने में तकलीफ';
  }
  if (/neend|sleep|अनिद्रा|chakkar|घबराहट|kamjori|कमजोरी|weakness/.test(t)) {
    pathology += '; नींद में कमी और शारीरिक थकान स्पष्ट है';
  }
  if (Number(sysDisp) >= 140) {
    pathology += `; रक्तचाप ${sysDisp}/${diaDisp} मि.मी. पारा उच्च — धमनियों पर अतिरिक्त दबाव`;
  }
  if (Number(sysDisp) < 100) {
    pathology += '; निम्न रक्तचाप से सिर चक्कर और कमजोरी की संभावना';
  }
  return { anatomy, pathology };
}

module.exports = { deriveAnatomyPathology };
