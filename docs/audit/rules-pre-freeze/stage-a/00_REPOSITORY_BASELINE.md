# Stage A — Repository baseline

**Audit date:** 2026-08-06 (micro-correction pass)  
**Product:** E.H. AROGYA SUTRA 2  
**Owner:** Dr. Ghanshyam Bakalwar

## Authorized repository

| Field | Value |
|-------|--------|
| GitHub | `bakalwar/EH_AROGYA_SUTRA_2` |
| Origin | `https://github.com/bakalwar/EH_AROGYA_SUTRA_2.git` |
| Stage A base `main` | `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` |
| Initial Stage A head | `136ca9e78c4d6ec738df4097f95ff875c7ca5aa6` |
| Correction-pass reviewed head | `d44375ea0234f73a0bc6172d24ca2685bd3e408a` |
| Primary correction-content commit | `19dd5bedca43601abf2eee0356e48270e3d74a82` |
| Draft PR | **#5** |

## Isolated worktree

| Field | Value |
|-------|--------|
| Path | `%TEMP%\ehas2_rules_19_stage_a_wt` |
| Branch | `audit/rules-1-9-stage-a-inventory` |
| Pre–micro-correction HEAD | `d44375e` |

## Preserved dirty primary checkout

`C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2` — **not modified** (pre-existing dirty `master` preserved).

## Validation environment note

| Check | Result |
|-------|--------|
| Local Node | **v24.16.0** |
| Project policy | **Node 20.x** |
| **NODE20_ENVIRONMENT_NOT_AVAILABLE** on correction host | **Yes** |
| Authoritative CI | **GitHub EHAS2 CI** on PR head |

## GitHub CI — correction-pass reviewed head

| Field | Value |
|-------|--------|
| Workflow | EHAS2 CI |
| Verified run | **16** / ID **31038467658** |
| Head | `d44375ea0234f73a0bc6172d24ca2685bd3e408a` |
| Conclusion | **success** |
| PostgreSQL | Service container + “Create isolated test databases” step **success** |
| Tests step | **success** (includes integration suites) |
| Bootstrap clinical extract | **success** (better-sqlite3 tooling path) |
| Test clinical engine | **success** |
| Dependency audit step | **success** |

**Historical supporting evidence:** run **15** / **31038083277** on primary correction-content commit `19dd5be` — **success**. Run **14** on initial Stage A `136ca9e` — **success**.

Micro-correction commit CI is recorded in PR #5 body and the Cursor final response (not self-referenced inside Stage A doc bodies before push).

## Stage A conflicts (register summary)

**Total conflicts:** **7** (SAC-001 … SAC-007) · **Stage B blockers:** **2** (SAC-001, SAC-003) · **Owner decisions required:** **2**

## Legacy

Legacy `eh-arogya-sutra` repository **not touched**.
