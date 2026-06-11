# आगे के कदम / Next steps roadmap

**E.H. Arogya Sutra** — mandated stack (`AGENTS.md`) के हिसाब से production तक का सुझाया गया क्रम। पहले **निर्भरता वाला** काम, फिर features।

---

## 0) अभी कहाँ हैं (Current)

| हिस्सा | स्थिति |
|--------|--------|
| Frontend | React + Vite + Tailwind + PWA + i18n |
| Backend | Express + **MongoDB (Mongoose)**; **PostgreSQL + Sequelize** optional via `DATABASE_URL` (`/health`) |
| Auth | JWT + bcrypt (2FA / 15 min JWT / OTP email — अभी पूरा नहीं) |
| Payments | Stripe / Twilio interim — **PhonePe / GPay / Paytm / UPI AutoPay** बाद में |

---

## चरण 1 — डेटाबेस व आधार (सबसे पहले)

**Status (repo):** Sequelize + `pg` optional — `DATABASE_URL` पर `GET /health` में `postgres.connected` + `models[]`; models `backend/models/postgres/` + `database/schema.sql` (पुराना DB: `migrations/001_patients_cdss_columns.sql`)। Har route ke liye alag flag: `USE_POSTGRES_FOR_AUTH`, `PATIENTS`, `MEDICINES`, `REPORTS`, `PRESCRIPTIONS`, `ADMIN` (=1 + schema)। **Prescriptions** Postgres par: patient bhi PG par ho to `USE_POSTGRES_FOR_PATIENTS=1` on rakho; Mongo patients ke saath sirf Mongo prescriptions flag off rakho।

1. PostgreSQL लोकल / Railway पर चालू करें; `database/schema.sql` से tables sync (पुराना DB हो तो `migrations/001_patients_cdss_columns.sql`)।
2. Root पर `sequelize` + `pg` ✓ — `backend/db/sequelize.js`, `postgres.init.js`; सभी Sequelize models + associations ✓।
3. Auth + `/api/patients` ✓ — `USE_POSTGRES_FOR_AUTH` / `USE_POSTGRES_FOR_PATIENTS` + `backend/utils/dataSource.js`।
4. Medicines / reports / prescriptions / admin ✓ — `USE_POSTGRES_FOR_MEDICINES|REPORTS|PRESCRIPTIONS|ADMIN`; medicines search = `ILIKE` (FTS `search_document` baad में)।
5. Postgres seed ✓ — `npm run seed:postgres` (`database/seeds/postgres.seed.js`) + `medicines.search_document` refresh।
6. अगला: JWT 15m + refresh (चरण 2) या Mongo पूरी तरह बंद / सभी `USE_POSTGRES_*=1` production cutover।

**पूरा होने पर:** single source of truth = Postgres।

---

## चरण 2 — Auth (mandatory spec)

1. JWT **access 15 min** + refresh token (httpOnly cookie या secure storage)।
2. **Speakeasy** से TOTP 2FA; enrol + verify endpoints।
3. **OTP email** (Nodemailer / SES self-hosted); Twilio हटाना जब तैयार हों।
4. Role middleware: **admin | doctor | patient** (तीनों panels)।

---

## चरण 3 — तीनों panels व सब्सक्रिप्शन

1. Route guard + backend: patient = **view-only**।
2. Admin: pricing CRUD; **grandfathering** — doctor पर `planPriceLockedAt` / `billingPlanSnapshot`।
3. Plans: **14-day trial**, Basic (100 patients), Pro (unlimited), yearly ₹6999 / ₹14999।
4. Feature flags per plan (middleware में limit check)।

---

## चरण 4 — Search व clinical data

1. Postgres **FTS** (tsvector) — medicines / symptoms tables।
2. Frontend **Fuse.js** — पहले से case flow में है; backend FTS के साथ जोड़ें।
3. OCR pipeline: **Tesseract.js** (HI+EN) upload → text → store।

---

## चरण 5 — PDF व documents

1. Read: **pdf-parse** (server) + **PDF.js** (client preview)।
2. Generate: **Puppeteer** HTML→PDF (PDFKit को постепенно replace)।

---

## चरण 6 — Media व अनुवाद

1. Photos: **TF.js + face-api.js + color-thief** — optional face crop / palette (privacy policy ज़रूरी)।
2. Video: **Video.js** + **Cloudflare R2** upload/stream URLs।
3. **LibreTranslate** self-hosted only; env में base URL; कोई paid API नहीं।

---

## चरण 7 — Payments (India)

1. **PhonePe / GPay / Paytm** Business **QR + webhooks** (auto-verify); **no Razorpay** — settlement **direct to clinic account**.  
2. **NPCI UPI AutoPay** mandate flow; subscription renewal.  
3. Stripe/Twilio billing हटाएँ जब UPI live हो।

## चरण 7b — Referral

1. Referral codes **`DR-NAME-YEAR`**; milestones: 10 / 20 / 30 / 50 / 100 doctors → free months / lifetime.  
2. **One phone = one account**; **real payment** before verified referral — see [REFERRAL-PAYMENTS-DESIGN-SECURITY.md](./REFERRAL-PAYMENTS-DESIGN-SECURITY.md).

---

## चरण 8 — Security व hosting

1. **14-layer** मॉडल पूरा करें — [REFERRAL-PAYMENTS-DESIGN-SECURITY.md](./REFERRAL-PAYMENTS-DESIGN-SECURITY.md) (L1–L14)।
2. **Vercel** (frontend) + **Railway** (API) + **Supabase** (Postgres/Auth adjunct अगर use करें) — env per environment।

---

## हर चरण के बाद (habit)

- `npm run build:web` + API smoke tests।
- Hub पर milestone: `npm run agent:now -- "Phase X: …"` (अगर dev hub चल रहा हो)।

---

## संक्षिप्त क्रम (याद रखने लायक)

`Postgres+Sequelize` → `Auth 15m+2FA+Email` → `Roles+Subscriptions` → `FTS+Fuse+OCR` → `PDF read/make` → `Media+Translate` → `UPI payments` → `14-layer+deploy`

---

*Last updated: conversation roadmap — AGENTS.md mandated stack के अनुरूप।*
