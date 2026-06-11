# Referral · Payments · Design system · 14 security layers

Canonical product rules for **E.H. Arogya Sutra**. Implementations may be partial until migrated from interim services (e.g. Stripe).

---

## Referral system

| Verified referrals (doctors) | Reward |
|------------------------------|--------|
| **10** | **1 month** free |
| **20** | **3 months** free |
| **30** | **6 months** free |
| **50** | **1 year** free |
| **100** | **Lifetime** free |

- **Unique referral code format:** `DR-NAME-YEAR`  
  - Example: `DR-SHARMA-2026` (normalize NAME: uppercase, ASCII, hyphen for spaces).  
  - Store normalized code + collision handling (suffix if needed).

**Fraud prevention (mandatory)**

- **One phone = one account** (unique index on normalized mobile; block duplicates).  
- **Real payment required** before referral counts as “verified” (or before credit applies — define in billing service).  
- Audit every referral attribution (who invited whom, when, payment id).

---

## Payment system

**Principle:** Money flows **directly to the clinic / business account**. **No Razorpay** (or other aggregator that breaks direct settlement), per product mandate.

| Rail | Mechanism |
|------|-----------|
| **PhonePe Business** | Static / dynamic **QR** + **Webhook** auto-verify |
| **Google Pay Business** | **QR** + **Webhook** auto-verify |
| **Paytm Business** | **QR** + **Webhook** auto-verify |
| **NPCI UPI AutoPay** | **Monthly auto-deduction** for subscriptions |

Implementation notes:

- Each provider: idempotent webhook handler, signature verification, amount + `merchant_order_id` match.  
- Reconcile against internal `payments` / `subscriptions` tables (Postgres).  
- Remove Stripe (and similar) when UPI stack is live.

---

## Design system

### Colors

| Token / role | Hex |
|--------------|-----|
| Background | `#080f09` |
| Sage | `#2d6a35` |
| Mint | `#4a9b54` |
| Gold | `#c9963a` |
| Gold light | `#e8c46a` |

Supporting surfaces (app): `#0e1a0f` (surface), `#121f13` (card) — see `frontend/tailwind.config.js` (`eh.*`).

### Fonts

| Use | Font |
|-----|------|
| Logo / major headings | **Cinzel** |
| Taglines / elegant subheads | **Cormorant Garamond** |
| Body | **DM Sans** |
| Hindi body | **Noto Sans Devanagari** |

Tailwind: `font-display`, `font-tagline`, `font-sans` (see `tailwind.config.js`).

### Theme & UX

- **Theme:** Dark forest green + gold — premium clinical feel.  
- **Logo:** Medical **Caduceus** — gold staff, green snakes (align `favicon.svg` / header mark).  
- **Style:** Modern dark, responsive, **PWA-ready** (Vite PWA plugin).

---

## 14 security layers (implement all)

| Layer | Control |
|-------|---------|
| **L1** | **dotenv** — secrets only via environment variables |
| **L2** | **bcrypt** — password hashing |
| **L3** | **cors** — CORS policy locked to known origins |
| **L4** | **Sequelize ORM** — parameterized queries / SQL injection prevention |
| **L5** | **jsonwebtoken** — **15 min** access JWT + **7 day** refresh token |
| **L6** | **express-rate-limit** — e.g. **max 5 attempts / 15 min** on auth routes |
| **L7** | **Speakeasy TOTP** + **Email OTP** — 2FA |
| **L8** | **crypto-js AES-256** — sensitive field encryption at rest (where needed) |
| **L9** | **Custom audit logging** — append-only / immutable action logs |
| **L10** | **HMAC signatures** — webhook + critical API payloads |
| **L11** | **Let’s Encrypt SSL** — HTTPS everywhere |
| **L12** | **Cloudflare** — DDoS + edge protections |
| **L13** | **JS Obfuscator** — production bundle obfuscation (where policy allows) |
| **L14** | **Vite minification** — build optimization + tree-shaking |

**Notes**

- L11–L12 are partly **infra** (deploy), not only app code.  
- L13: balance security vs. debugging; often only for sensitive admin bundles.  
- L5 refresh token: prefer **httpOnly Secure cookie** or hardened storage; rotate on use.

---

*Cross-links: [AGENTS.md](../AGENTS.md), [ROADMAP-NEXT-STEPS.md](./ROADMAP-NEXT-STEPS.md).*
