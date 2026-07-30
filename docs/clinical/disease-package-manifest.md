# Disease package manifest (Phase 5B)

## Local full generation (this machine)

| Field | Value |
|-------|-------|
| Record count | **116,284** |
| Artifact SHA-256 | `D4ADD5A1386851B7C56632C103F5A0306C73B1DC4C298C6499993A7256DBD89F` |
| Source fingerprint | `C3FF59F862EAD2559E116CF6A4F629B7259BBD12D73385F299B780F25C4D1154` |
| Location | `data/clinical-artifacts/disease-package-v1/` (untracked) |
| Installed live in app | **NO** |

## Production receive policy

Ship a signed/versioned artifact (count + SHA + schema version) through an approved release channel.  
Never configure production to read the protected old-project path.
