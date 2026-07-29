# npm lifecycle-script policy — E.H. AROGYA SUTRA 2

**Status:** Active for Phase 1B preflight  
**Owner review point:** Security owner before approving any new `allowScripts` entry

## Default policy

- Lifecycle / install scripts are **denied by default** (npm allow-scripts model).
- **No wildcard** approvals (`*`, package name without version, `--all` without review).
- Permissions are **pinned** to exact `package@version`.
- A new version of an allowed package does **not** inherit permission automatically.
- Version changes require mandatory re-review and a new pinned entry.

## Currently approved

| Package | Version | Direct/transitive | Purpose | Why required | Registry | Risk |
|---------|---------|-------------------|---------|--------------|----------|------|
| `esbuild` | `0.28.1` | Transitive (`vite`→vitest, `tsx`→api) | `postinstall` downloads platform native binary | Required for Vitest/Vite transforms and API `tsx` tooling | `https://registry.npmjs.org/esbuild/-/esbuild-0.28.1.tgz` | Install script runs vendor `install.js`; limited to this version after integrity check |

`package.json`:

```json
"allowScripts": {
  "esbuild@0.28.1": true
}
```

## Not approved (examples)

- `sharp` — present as dependency; **do not** add to `allowScripts` without a separate evidence-based audit and owner approval.
- Any future `esbuild@>` other than `0.28.1` until re-approved.

## Verification required before approving a script

1. Exact installed version matches the pin  
2. Required by approved toolchain  
3. Resolved from official npm registry  
4. `package-lock.json` integrity present and valid  
5. `npm audit` shows 0 vulnerabilities (or documented residual risk)  
6. Permission scoped to exact `name@version` only  
7. Clean `npm ci` succeeds  
8. Lint, typecheck, tests, build PASS  
9. Entry documented in this file + dependency risk register  

## Revocation

1. Remove the exact key from `allowScripts` via normal file edit  
2. Re-run `npm ci` and full quality gates  
3. Record reason and date in this file  

## Clean-install validation

Validate with lockfile install (`npm ci`) in a clean TEMP copy when approving or changing lifecycle permissions.

## Honest limitation

Allowing an install script is a trust decision for that package version. It is **not** a claim that the dependency is permanently safe.
