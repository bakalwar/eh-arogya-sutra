# E.H. Book → JSON — Master Batch Plan

**Last full run:** 2026-05-23

## All groups — DONE

| Step | Group | Medicines | Rules | Supplementary | Notes | Status |
|------|-------|-----------|-------|---------------|-------|--------|
| 1 | **S** | 12 | 53 | 81 | 8 | ✅ |
| 2 | **A** | 3 | 13 | 32 | 3 | ✅ |
| 3 | **C** | 17 | 67 | 90 | 11 | ✅ |
| 4 | **F** | 2 | 10 | 34 | 5 | ✅ |
| 5 | **L** | 1 | 3 | 0 | 0 | ✅ |
| 6 | **P** | 3 | 13 | 30 | 3 | ✅ |
| 7 | **V** | 1 | 1 | 0 | 0 | ✅ |
| **Total** | | **39** | **161** | **~267** | **~30** | ✅ |

## Commands (one-shot replay)

```bash
npm run map:book:auto:all
npm run audit:book:all
```

## Potency scale

D4, D5, D6, D7, D8, D10, D30, D60, D100, D200, D500, D1000

## Files

- KB: `backend/data/medicine_knowledge_base.json`
- Reports: `backend/data/batch_reports/batch-*.json`, `audit-all-*.json`
