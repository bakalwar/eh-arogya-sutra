# Stage A — Repository baseline

**Audit date:** 2026-08-06  
**Product:** E.H. AROGYA SUTRA 2  
**Owner:** Dr. Ghanshyam Bakalwar  
**Gate:** Rules 1–9 pre-freeze audit — Stage A (inventory only)

## Authorized repository

| Field | Value |
|-------|--------|
| GitHub | `bakalwar/EH_AROGYA_SUTRA_2` |
| Origin URL | `https://github.com/bakalwar/EH_AROGYA_SUTRA_2.git` |
| Local primary checkout (preserved, not modified) | `C:\Users\zero error\Desktop\EH_AROGYA_SUTRA_2` |

## Active workspace identity (Step 1)

Read-only inspection of the primary checkout before isolation:

| Check | Result |
|-------|--------|
| Repository root | `EH_AROGYA_SUTRA_2` (not legacy `eh-arogya-sutra`) |
| Origin | `bakalwar/EH_AROGYA_SUTRA_2` |
| Branch at primary checkout | `master` @ `59eb231` (pre-fetch local tip) |
| Working tree | **Dirty** — pre-existing modifications (not altered by Stage A) |
| Merge/rebase in progress | None observed |

**Legacy repository:** Not opened or mutated.

## Remote `main` verification (Step 3)

| Command | Exit | Result |
|---------|------|--------|
| `git fetch origin main --prune` | 0 | Updated `origin/main` |
| `git rev-parse origin/main` | 0 | `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` |
| `git cat-file -t 658f3fd…` | 0 | `commit` |
| `git merge-base --is-ancestor 658f3fd… origin/main` | 0 | Expected SHA is ancestor of remote tip |
| `git rev-list --left-right --count 658f3fd…...origin/main` | 0 | `0	0` |

**Remote tip subject:** Merge pull request #4 — approved Phase 5D fail-closed safety policy (merge `dd7d0b8` + `a7848c9`).

**Baseline status:** **MATCH** — `origin/main` equals owner-expected SHA `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7`.

## Isolated audit worktree (Step 4)

| Field | Value |
|-------|--------|
| Path | `%TEMP%\ehas2_rules_19_stage_a_wt` (expanded: user `AppData\Local\Temp\ehas2_rules_19_stage_a_wt`) |
| Branch | `audit/rules-1-9-stage-a-inventory` |
| HEAD | `658f3fd97e1e00fcafef74ddd3788d2cfa3bf1d7` |
| Created from | `origin/main` (detached-equivalent clean tree) |
| Pre-work `git status` | Clean (empty) |
| Branch pre-existed | **No** — created new |

## Dirty worktree preservation (Step 2)

The primary checkout at `EH_AROGYA_SUTRA_2` on branch `master` with dirty files was **not** stashed, reset, cleaned, or committed. Stage A documentation work occurs **only** in the isolated worktree.

## Other worktrees (read-only list)

Additional worktrees exist under `%TEMP%` and desktop (Rule 4/5 phase branches, prior audits). Stage A did **not** modify them.

## Scope confirmation

| Item | Stage A |
|------|---------|
| Formal nine-rule freeze | **No** |
| Clinical / runtime code changes | **No** |
| Merge to `main` | **No** |
| Legacy mutation | **No** |

## Evidence classification

Repository baseline facts: **IMPLEMENTATION_EVIDENCE** (git) + **SUPPORTING** (this audit record).
