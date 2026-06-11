# S-Group Batch Mapping Report

**Date:** 2026-05-23 | **Command:** `npm run map:book:S`

## Summary

| Metric | Count |
|--------|-------|
| Medicines processed | **12** (S-1…S-10 + book S-11, S-12) |
| Book text scanned | 4k–8k chars each |
| **New `mapping_rules`** | **+24** |
| `supplementary_rules` (earlier pass) | +43 (symptoms preserved) |
| `clinical_notes` (parhez/savadhani) | +8 lines |

## Per medicine

| Code | Book chars | Rules before→after | New rules |
|------|------------|-------------------|-----------|
| S-1 | 6688 | 3→3 | 0 |
| **S-2** | 7787 | 3→**7** | **+4** (तृतीय=D3, उच्च=D6 + electricity) |
| S-3 | 5423 | 2→3 | +1 |
| S-4 | 8059 | 1→2 | +1 |
| **S-5** | 7081 | 3→**12** | **+9** |
| **S-6** | 8166 | 3→**12** | **+9** |
| S-7 | 4624 | 3→3 | 0 |
| S-8 | 4172 | 3→3 | 0 |
| S-9 | 4235 | 3→3 | 0 |
| S-10 | 5589 | 3→3 | 0 |
| S-11 | 4396 | 0→1 | +1 (book-only) |
| S-12 | 4426 | 0→1 | +1 (book-only) |

## New JSON fields

- `mapping_rules[].electricity_component` — B.E./R.E./G.E./W.E./Y.E. + rationale
- `mapping_rules[].precautions` — सावधानी / परहेज from book
- `supplementary_rules[]` — symptoms not in main rules (no-skip)
- `clinical_notes[]` — dry tablets, high potency warnings
- `book_pages`, `book_components`, `batch_mapped_at`

## Commands (other groups)

```bash
npm run map:book:A   # Angioitico
npm run map:book:C   # Canceroso
npm run map:book:group -- --group=F
```

## Note

- App catalog = **37** medicines (S-1…S-10); book OCR also has **S-11, S-12** (stored in KB).
- Ollama `map:book` optional; batch mapper uses **book text + medicines.json** (faster, no parse-fail).
