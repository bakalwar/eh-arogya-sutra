# SUTRA SOFTWEAR — CURSOR EXECUTION GUIDE

## Permanent operating instruction for EHAS2 work

Use this file together with `SUTRA SOFTWEAR` Master Engineering Plan. The master plan controls phase order and engineering governance. Repository authority documents control clinical meaning.

### Project identity

- Repository: `bakalwar/EH_AROGYA_SUTRA_2`
- Product: E.H. AROGYA SUTRA 2
- Legacy project: reference-only; do not mutate or connect at runtime without explicit owner approval
- Planning baseline: `main` after PR #2, merge commit `0aa4948f5962660a5aa362a80ce0648739f3b200`

### Current hard stop

Do not start any of the following unless the owner gives a new, exact approval:

- formal specification freeze;
- Phase 5D implementation;
- deployment or production infrastructure mutation;
- real OTP/passkey/provider activation;
- legacy engine changes;
- production data migration or processing of identifiable clinical data.

### Mandatory start protocol for every task

1. Read the complete master plan and all directly applicable repository authority documents.
2. Verify repository, branch, exact HEAD, cleanliness and remotes.
3. Report current phase, requested action, explicit exclusions and authorization boundary.
4. Search for existing implementation before creating any file, package, abstraction or rule.
5. Identify conflicts, missing decisions, security/privacy risks and patient-data risks.
6. If a normative clinical question or external/destructive action is not approved, stop and ask one exact question.
7. For implementation, create an isolated branch/worktree from the verified `main`; never work directly on `main`.

### Engineering rules

- Keep changes small, cohesive and phase-scoped.
- Use typed contracts and explicit error states.
- Do not return success for unavailable services.
- Do not hardcode prescriptions, patient names, secrets, ports, absolute user paths or legacy runtime paths.
- Do not add duplicate models, parallel engines, temporary compatibility layers or dead fallbacks without an approved migration plan.
- Do not silence exceptions, weaken tests/lint/types, use force audit fixes, hide advisories or misclassify runtime risk.
- Do not add a dependency when the platform or an existing package already safely provides the capability.
- Preserve tenant isolation, authorization, immutable clinical history and auditability.
- Original report/image bytes must follow approved temporary-processing and deletion rules.
- Synthetic fixtures must be clearly labelled; never use identifiable clinical records.

### Clinical safety rules

- Clinical authority comes from the approved constitution and approved/frozen rule specifications.
- Assessment rules provide evidence according to their contracts; do not let one rule secretly mutate another.
- No medicine, mixture, potency, electricity, tablet or external application may be invented by UI/rendering code.
- Simple/Moderate/Complex–multi-system oral totals are exactly 3/4/5 under OD-013; `3+1`, `4+1`, `5+1` are unauthorized shorthand.
- Tablets A/B and external treatment are separate sections.
- Never add filler/unsupported medicines merely to reach a count.
- Preserve `UNKNOWN`/`UNRESOLVED`/fail-closed behavior and reasons.
- No default WE or other silent clinical fallback.
- Renderer displays structured engine output and never invents clinical content.
- A generated recommendation requires doctor review before issuance.

### Required task plan format

Before changing files, return:

```text
TASK:
PHASE:
STARTING BRANCH:
STARTING SHA:
AUTHORITY DOCUMENTS:
IN SCOPE:
OUT OF SCOPE:
FILES EXPECTED TO CHANGE:
ACCEPTANCE CRITERIA:
TEST/QUALITY GATES:
ROLLBACK:
OWNER APPROVAL REQUIRED AFTER THIS STEP:
```

Do not begin mutation if the above cannot be stated truthfully.

### Required verification gates

Run the repository-supported equivalents of:

```text
npm ci
npm run verify:boundary
npm run format:check
npm run lint
npm run typecheck
npm run test
npm run build
npm audit
git diff --check
git status --short
```

Also run phase-specific clinical, migration, browser, security, tenancy and clean-environment checks. Record command, exit code, PASS/FAIL and relevant warnings. Never call a skipped or unpublished check PASS.

### Pull request protocol

- One phase or bounded sub-phase per branch and PR.
- PR description must include purpose, authority, scope, exclusions, files, tests, risks, rollback and current non-claims.
- Keep PR draft until diff review and required CI are complete.
- Do not merge on failed, missing or materially incomplete required gates.
- Merge is a separate owner-authorized action unless the owner has explicitly authorized it in the current instruction.
- After merge, verify closed/merged status, merge SHA and `main` content.

### Required final report format

```text
OUTCOME:
BRANCH / PR / COMMIT:
FILES CHANGED:
BEHAVIOR CHANGED:
TEST RESULTS:
SECURITY/PRIVACY RESULT:
CLINICAL SAFETY RESULT:
KNOWN LIMITATIONS:
MAIN CHANGED: YES/NO
DEPLOYED: YES/NO
LEGACY ENGINE TOUCHED: YES/NO
NEXT GATE:
STOP REASON:
```

### Drift prevention

At the beginning and end of each phase, compare the work against the master plan. If a requested task would skip a gate, mix phases, contradict an authority document or create an unapproved production/clinical action:

```text
STOP — PLAN OR AUTHORITY CONFLICT
```

Then cite the exact conflict and request a narrow owner decision. Do not improvise a new rule or continue into another phase.

### Present state

PR #2 has been merged. OD-013 documentation is on `main`. This does not constitute formal specification freeze and does not authorize Phase 5D or deployment.

**End every completed task at the next explicit gate. Do not continue automatically.**
