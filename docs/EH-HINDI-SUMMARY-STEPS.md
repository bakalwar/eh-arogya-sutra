# EH Hindi Summary — DOCX से Step-by-Step

स्रोत: `docs/EH_Hindi_Summary_Cursor.docx` (Downloads से कॉपी)

## 4 ज़रूरी नियम (DOCX)

| नियम | गलत | सही |
|------|-----|-----|
| **1 भाषा** | Hinglish: "Rogi ki sthiti" | शुद्ध देवनागरी: "रोगी की स्थिति" |
| **2 फॉर्मूला** | `S-1 + Y.E. D10 D10` | `S10 + A3 + YE D10` (potency एक बार अंत में) |
| **3 ध्रुवता** | Acute=D6 गलत | तीव्र=HYPER=**D10**; जीर्ण=HYPO=**D3/D4** |
| **4 लंबाई** | छोटा/truncated | ~1000 शब्द, 7 खंड पूरे |

---

## STEP 1 — `summaryEngine.js` (RULE 1 + 4)

**फाइल:** `backend/services/summaryEngine.js`

- पूरा सार **शुद्ध हिंदी** (देवनागरी)
- 7 खंड:
  1. कार्यकारी क्लिनिकल विवरण
  2. प्रकृति विश्लेषण
  3. शारीरिक एवं रोग विश्लेषण
  4. औषधि निर्माण का वैज्ञानिक कारण
  5. पोटेंसी और ध्रुवता का नियम
  6. खुराक और सेवन विधि
  7. आहार और जीवन शैली

**रीबिल्ड कमांड:**

```powershell
python scripts/build-hindi-summary-engine-from-docx.py
python scripts/rebuild-hindi-summary-engine.py
```

---

## STEP 2 — `formatFormula()` (RULE 2)

```javascript
// S-1 + Y.E. → S1 + YE D10
formatFormula(['S-10','A-3','F-1','B.E.'], 'D10')
// → "S10 + A3 + F1 + BE D10"
```

- हाइफ़न और डॉट हटते हैं (`S-1` → `S1`, `Y.E.` → `YE`)
- सभी दवाएँ ` + ` से जुड़ती हैं
- Potency **सिर्फ अंत में एक बार**

---

## STEP 3 — `getPotency()` (RULE 3 — सही ध्रुवता)

| अवस्था | रोग प्रकृति | Potency |
|--------|-------------|---------|
| तीव्र / अर्ध-तीव्र | HYPER (POSITIVE) | **D10** |
| जीर्ण | HYPER | **D30** |
| तीव्र / अर्ध-तीव्र | HYPO (NEGATIVE) | **D4** |
| जीर्ण | HYPO | **D3** |

`backend/services/potencyEngine.js` भी इसी नियम से sync है।

---

## STEP 4 — UI (`SearchResult.jsx`)

- **लाइव:** `universal-engine-v7` — **7 खंड** (~1000 शब्द), `clinicalFallbackSeven.js`
- पुराना 5-खंड v8 हटाया गया

---

## STEP 5 — API वायरिंग

```
Smart Search → expert analyze → enrichExpertFormulas()
  → POST /api/summary/expert-clinical
  → summaryEngine.generateClinicalSummary()
  → SearchResult.jsx (markdown)
```

---

## STEP 6 — टेस्ट (DOCX वाला केस)

```powershell
npm run smoke:summary
```

**इनपुट:** 55 वर्ष, पुरुष, BP 200/101, ACUTE, POSITIVE  
**अपेक्षित:**
- शुद्ध हिंदी सार
- फॉर्मूला: `F1 + S10 + A3 + YE D10`
- चेतावनी: उच्च रक्तचाप संकट
- ~900–1100 शब्द

---

## STEP 7 (वैकल्पिक) — Ollama prompt

DOCX **Section 2** का `EH_SYSTEM_PROMPT` — AI enhanced mode के लिए  
`eh-expert-engine` में `llm_engine.py` (अगर Ollama चालू हो)

---

## फाइलें बदली गईं

| फाइल | काम |
|-------|-----|
| `backend/services/clinicalFallbackSeven.js` | **लाइव** 7-खंड rule engine |
| `backend/services/generateClinicalSummary.js` | API + Ollama prompts |
| `backend/services/potencyEngine.js` | Compact formula + D10/D3 polarity |
| `frontend/src/pages/SearchResult.jsx` | Formula mixture line UI |
| `scripts/smoke-summary-docx.js` | Hindi smoke test |
| `docs/EH_Hindi_Summary_Cursor.docx` | स्रोत DOCX |
