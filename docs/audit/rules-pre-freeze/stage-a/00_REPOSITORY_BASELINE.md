# Stage A — Repository baseline

**Audit date:** 2026-08-06 (correction pass)  
**Product:** E.H. AROGYA SUTRA 2  
**Owner:** Dr. Ghanshyam Bakalwar

## Authorized repository

| Field | Value |
|-------|--------|
| GitHub | `bakalwar/EH_AROGYA_SUTRA_2` |
| Origin | `https://github.com/bakalwar/EH_AROGYA_SUTRA_2.git` |
| GitHub `main` | `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` |
| Initial Stage A commit | `136ca9e78c4d6ec738df4097f95ff875c7ca5aa6` |
| Draft PR | **#5** |

## Isolated worktree

| Field | Value |
|-------|--------|
| Path | `%TEMP%\ehas2_rules_19_stage_a_wt` |
| Branch | `audit/rules-1-9-stage-a-inventory` |
| Pre-correction HEAD | `136ca9e` |

## Preserved dirty primary checkout

`C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2` — **not modified** (pre-existing dirty `master` preserved).

## Validation environment note

| Check | Result |
|-------|--------|
| Local Node | **v24.16.0** |
| Project policy | **Node 20.x** |
| **NODE20_ENVIRONMENT_NOT_AVAILABLE** on correction host | **Yes** |
| Authoritative CI | **GitHub EHAS2 CI** on PR head |

## GitHub CI (PR #5, pre-correction head)

| Field | Value |
|-------|--------|
| Workflow | EHAS2 CI |
| Run | **14** / ID **31037043082** |
| Head | `136ca9e` |
| Conclusion | **success** |
| PostgreSQL | Service container + “Create isolated test databases” step **success** |
| Tests step | **success** (includes integration suites) |
| Bootstrap clinical extract | **success** (better-sqlite3 tooling path) |
| Test clinical engine | **success** |
| Dependency audit step | **success** |

Post-correction commit must be validated by **new** CI run on updated head.

## Legacy

Legacy `eh-arogya-sutra` repository **not touched**.
