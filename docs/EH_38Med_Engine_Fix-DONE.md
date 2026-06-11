# EH 38Med Engine Fix — DONE

Source: `EH_38Med_Engine_Fix-1.docx`

## Files

| File | Role |
|------|------|
| `backend/data/medicine_knowledge_base.json` | 37 medicines — mapping_rules, anatomy, lab_trigger, dosage_protocol |
| `backend/services/knowledgeBasedSelector.js` | `selectFromKnowledgeBase()` — scores from JSON rules |
| `backend/services/ehSourceOfTruthClinical.js` | KB → legacy knowledge → rule engine v4 fallback |
| `backend/scripts/buildMedicineKnowledgeBase.js` | Regenerate JSON from catalog |

## Commands

```bash
npm run build:medicine-kb
node scripts/test-38med-kb.js
```

## Env

- `EH_USE_KNOWLEDGE_BASE=1` (default when not `0`) — use JSON KB first
- `EH_USE_KNOWLEDGE_BASE=0` — skip KB, use rule engine v4 only

## Flow

Doctor input → `mapping_rules` match (symptom + lab + organ + phase) → scored FA/FB/FC → `selectElectricityForFormula()` in formula build.
