'use strict';

// ─── EH DIET & LIFESTYLE RULES ───────────────────────────────────────────────
// Based on Mattei's EH principles: Positive rog → cooling/light diet;
// Negative rog → warming/nourishing diet.
// ─────────────────────────────────────────────────────────────────────────────

const DIET = {
  en: {
    POSITIVE: {
      do: [
        'Drink room-temperature or cool (not ice-cold) water — 8 glasses/day',
        'Green vegetables: spinach, bottle gourd, ridge gourd, fenugreek leaves',
        'Fruits: apple, pear, grapes, papaya, pomegranate',
        'Buttermilk / thin yogurt (during afternoon)',
        'Light, easily digestible meals: khichdi, porridge, lentil soup',
        'Coconut water (natural diuretic — good for uric acid & kidney)',
        'Herbal teas: ginger-tulsi without milk',
        'Moong dal, arhar dal (avoid urad & rajma in uric acid cases)',
      ],
      dont: [
        'Spicy, fried, and oily food — strictly avoid',
        'Refined flour (maida), bakery products, white bread',
        'Excess sugar, sweets, and desserts — reduce drastically',
        'Milk / curd / dairy at night',
        'Outside food, fast food, processed snacks',
        'Cold drinks, carbonated beverages, alcohol',
        'Tobacco in any form',
        'Red meat, organ meats, shellfish (high in purines — raises uric acid)',
      ]
    },
    NEGATIVE: {
      do: [
        'Warm water — drink 8–10 glasses daily (never cold)',
        'Dry fruits: almonds (soaked), walnuts, raisins, dates',
        'Small amount of ghee or butter with meals',
        'Warm turmeric milk at night (builds strength)',
        'Jaggery (instead of sugar), dates, figs',
        'Wholesome meals: dal, rice, chapati — do not skip meals',
        'Ginger and garlic — add to cooking daily',
        'Sesame seeds, flaxseeds — excellent for nerve & bone strength',
      ],
      dont: [
        'Cold water, ice, ice cream — strictly avoid',
        'Sour foods in excess: tamarind, excess lemon',
        'Stale or leftover food — eat fresh only',
        'Very spicy food — aggravates Negative weakness',
        'Late-night eating — finish dinner by 8 PM',
        'Excess tea/coffee — depletes nerve energy',
        'Raw vegetables in excess — cook them lightly',
      ]
    },
  },

  hi: {
    POSITIVE: {
      do: [
        'सामान्य तापमान या हल्का ठंडा पानी पिएँ — दिन में 8 गिलास',
        'हरी सब्ज़ियाँ — पालक, मेथी, लौकी, तोरई',
        'फल — सेब, नाशपाती, अंगूर, पपीता, अनार',
        'दही और छाछ (दोपहर में)',
        'हल्का सुपाच्य भोजन — खिचड़ी, दलिया, मूँग दाल',
        'नारियल पानी (यूरिक एसिड और किडनी के लिए लाभदायक)',
        'अदरक-तुलसी की चाय (बिना दूध)',
        'मूँग दाल, अरहर दाल (यूरिक एसिड में उड़द-राजमा बंद)',
      ],
      dont: [
        'मिर्च-मसाला, तला-भुना खाना — पूरी तरह बंद',
        'मैदा, बेकरी उत्पाद, सफेद ब्रेड बंद',
        'अधिक मीठा, चीनी और मिठाई — बहुत कम करें',
        'रात को दूध, दही या डेयरी उत्पाद नहीं',
        'बाहर का खाना, फास्ट फूड, पैकेज्ड स्नैक्स बंद',
        'ठंडे पेय, सोडा, शराब — पूरी तरह बंद',
        'तम्बाकू किसी भी रूप में नहीं',
        'लाल माँस, अंग का माँस, झींगा (यूरिक एसिड बढ़ाते हैं)',
      ]
    },
    NEGATIVE: {
      do: [
        'गुनगुना पानी — दिन में 8-10 गिलास (ठंडा कभी नहीं)',
        'सूखे मेवे — भीगे बादाम, अखरोट, किशमिश, खजूर',
        'थोड़ा घी या मक्खन भोजन के साथ',
        'रात को हल्दी वाला गर्म दूध (शक्ति बढ़ाता है)',
        'गुड़ (चीनी की जगह), खजूर, अंजीर',
        'पूर्ण भोजन — दाल, चावल, रोटी — खाना कभी न छोड़ें',
        'अदरक और लहसुन — रोज़ खाने में डालें',
        'तिल, अलसी — हड्डी और नस की मज़बूती के लिए',
      ],
      dont: [
        'ठंडा पानी, बर्फ, आइसक्रीम — बिल्कुल नहीं',
        'खट्टा ज़्यादा नहीं — इमली, नींबू कम करें',
        'बासी खाना बिल्कुल नहीं — ताज़ा खाएं',
        'बहुत तीखा खाना — Negative कमज़ोरी बढ़ाता है',
        'देर रात खाना नहीं — रात 8 बजे तक भोजन कर लें',
        'अधिक चाय/कॉफी — नसों की ऊर्जा घटाती है',
        'कच्ची सब्ज़ियाँ ज़्यादा नहीं — हल्का पका कर खाएं',
      ]
    },
  },
};

// Marathi and Gujarati fall back to Hindi for diet
DIET.mr = DIET.hi;
DIET.gu = DIET.hi;

function getDietForPolarity(polarity, _vitiation, lang = 'en') {
  const langData = DIET[lang] || DIET.en;
  if (polarity === 'POSITIVE' || polarity === 'MIXED') {
    return langData.POSITIVE;
  }
  return langData.NEGATIVE;
}

module.exports = { getDietForPolarity };
