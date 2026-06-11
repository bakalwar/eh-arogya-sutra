'use strict';

const NO_APPLICABLE_RULE_MESSAGE =
  '# ⚠️ No applicable rule found\n\n' +
  '**No applicable rule found — check Admin UI**\n\n' +
  'इस रोगी के वाइटल्स/लक्षणों से कोई सक्षम dynamic rule (विद्युत या पोटेंसी lock) `dynamicEhRules.json` में मेल नहीं खाता।\n\n' +
  '1. Admin → Clinical Rules में IF/THEN जोड़ें या सक्षम करें\n' +
  '2. BP / polarity / symptoms शर्तें जाँचें\n' +
  '3. पुनः Analyze करें\n\n' +
  '*Ollama बंद है (`EH_OLLAMA_DOCTOR=0`) या `ollama serve` नहीं चल रहा — `.env` में `EH_OLLAMA_DOCTOR=1` करें।*';

module.exports = { NO_APPLICABLE_RULE_MESSAGE };
