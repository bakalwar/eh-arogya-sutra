# Clinical Product Constitution

Permanent product requirements for E.H. AROGYA SUTRA 2. Guard tests protect these strings. This document does **not** prove clinical correctness.

## A. Scale

- Target up to **100,000 registered doctors**
- Registered, active, and concurrent doctors are **separate metrics**
- No free-server 100,000-doctor claim
- Load testing required before production

## B. Patient input

Future verified engine will process:

- chief complaint
- complete symptoms
- vitals
- duration
- severity
- phase
- affected organ/body site
- doctor-entered clinical context
- lifestyle evidence
- verified structured report findings
- supported clinical/report images through temporary processing
- emergency/red-flag evidence

## C. Image safety

Do not claim that an ordinary patient photo can reliably determine every disease, prakriti, or temperament.

Separate:

- ordinary patient photo
- lesion/skin image
- medical-report photo
- radiology image
- prescription photo

Only validated supported image types may influence analysis.

**No original photo/PDF may be stored permanently.**

## D. Nine-rule engine

Future integration must use the verified versioned **nine-rule engine**.

Every result must record:

- engine version
- rules version
- disease-data version
- medicine-data version
- input hash
- evidence
- confidence
- unresolved reason

## E. Automatic clinical assessment

System will recommend:

- disease candidates
- affected systems/organs
- primary target
- root cause
- polarity
- prakriti: Vata/Pitta/Kapha or supported mixed/unknown state
- temperament
- constitution
- severity/phase
- emergency warning

Every derived value needs evidence and confidence.

Do not force a result when evidence is insufficient or conflicting. Return UNKNOWN/UNRESOLVED with reason.

## F. Dynamic prescription

- no patient-name hardcoding
- no fixed medicine/formula
- no frontend medicine selection
- no silent clinical fallback

Oral formulas:

- Simple → **3**
- Moderate → **4**
- Complex/multi-system → **5**
- never only 1 or 2
- no unjustified repetition
- formula-specific potency
- formula-specific electricity
- **no default WE**

Tablet A/B:

- independent selection from verified full **39**-medicine pool
- not copied from oral formulas
- disease, symptoms, organ, clinical target, temperament, constitution, severity, phase and polarity evidence
- empty Section B slot: `NO_CLINICALLY_JUSTIFIED_CANDIDATE`

External applications:

- organ/body-site specific
- clinically justified
- not blindly copied from oral formulas
- no forced formula only to reach a count

## G. Patient-specific summary

Summary must come from structured engine output and contain:

- report findings
- clinical assessment
- polarity
- prakriti
- temperament
- constitution
- root cause/systems
- oral formulas
- potency/electricity
- Tablet A/B
- external applications
- diet/guidance
- safety/follow-up
- Stage 2–6
- evidence and versions

Renderer must never invent clinical information.

## H. Doctor review

System generates the recommendation automatically.

Doctor does not manually select medicines during generation.

Before the recommendation becomes an issued prescription, doctor must:

- review
- accept
- modify with reason
- reject
- or request clarification

Modification creates a new version. The original generated result remains preserved as immutable versioned clinical history.
