# आगे का काम — Summary के बाद (Phase 5+)

**DOCX STEPS 1–4:** ✅ पूरे  
**अभी जोड़ा (Phase 5):** Analyze के साथ ही summary + print CSS + smoke test

---

## ✅ अभी-अभी complete (Phase 5)

| काम | विवरण |
|-----|--------|
| **Inline summary** | `runSmartSearch()` अब analyze के साथ ही `summary` बनाता है — result page तुरंत दिखे |
| **Print / PDF** | `🖨️ Print` — सिर्फ 7-section summary print (buttons छुपें) |
| **Smoke test** | `npm run smoke:summary` — Rajesh case (BP 200/101) verify |

---

## अगला प्राथमिकता (आप चुनें)

### A — Clinical polish (1–2 दिन)
- [ ] Prescription PDF में same markdown summary embed (Puppeteer)
- [ ] Hindi font print में ठीक (Noto Devanagari @print)
- [ ] Patient panel — view-only summary (read-only)

### B — Book + Search (mandated stack)
- [ ] Postgres `BookPg` में बाकी pages load (`npm run load:book-extracted`)
- [ ] Symptom FTS + Fuse.js search bar doctor dashboard में
- [ ] OCR upload → report → auto analyze pipeline

### C — Auth + Plans (production)
- [ ] JWT 15 min + refresh
- [ ] 2FA Speakeasy + OTP email
- [ ] Subscription: trial 14d, Basic ₹699, Pro ₹1499

### D — Payments India
- [ ] PhonePe / GPay / Paytm QR + webhook
- [ ] Referral `DR-NAME-YEAR` + milestones

---

## रोज़ चलाने के commands

```powershell
npm run dev              # API + Vite
npm run expert-engine    # Python EH Expert (port 8001)
npm run smoke:summary    # Summary engine OK?
npm run open:search      # Browser search page
```

---

## पूरा roadmap

[ROADMAP-NEXT-STEPS.md](./ROADMAP-NEXT-STEPS.md) — Postgres → Auth → Panels → FTS → PDF → UPI → Deploy
