/** Internal F3D-2E2 lock trace (env-gated; not exported from package index). */
export type RulesShadowLockTraceClass = 'source' | 'fact' | 'norm' | 'd5' | 'e1';

export type RulesShadowLockTraceEntry = {
  class: RulesShadowLockTraceClass;
  subject: string;
  family?: string;
};

let trace: RulesShadowLockTraceEntry[] = [];

export function clearRulesShadowInputLockTrace(): void {
  trace = [];
}

export function getRulesShadowInputLockTrace(): readonly RulesShadowLockTraceEntry[] {
  return trace;
}

export function recordRulesShadowInputLockTrace(entry: RulesShadowLockTraceEntry): void {
  if (process.env.EHAS2_RULES_SHADOW_INPUT_LOCK_TRACE === '1') {
    trace.push(entry);
  }
}
