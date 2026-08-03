import { RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE } from '../version.js';
import { validateRule4OutputCodes } from '../outputCodeValidation.js';
import { evaluateD04Usability, validateMandatoryItemFields } from './assertionValidator.js';
import { resolveRule3BindingPort, validateFormulaTargetBinding } from './rule3BindingPort.js';
import { evaluateDocumentGate } from './documentGate.js';
import { evaluateItemGate } from './itemGate.js';
import { planDedupe, isDedupeDuplicate } from './dedupe.js';
import { applySupersession } from './supersession.js';
import { resolveSlotContradiction } from './contradictionResolver.js';
import {
  assertEvidenceAdapterInputFreeOfPhiText,
  evaluateQuarantineProbe,
  validateQuarantineProbeShape,
} from './quarantine.js';
import { fingerprintFromAdapterOutput } from './evidenceFingerprintV1.js';
import type {
  Rule4DedupeSupersessionMetadata,
  Rule4EvidenceAdapterInput,
  Rule4EvidenceAdapterOutput,
  Rule4EvidenceItemEnvelope,
  Rule4FormulaBoundEvidencePool,
  Rule4IgnoredItemAuditEntry,
  Rule4ItemUsabilityStatus,
} from './types.js';

export class Rule4EvidenceAdapterValidationError extends Error {
  readonly code = 'RULE4_EVIDENCE_ADAPTER_VALIDATION_FAILED';

  constructor(message: string) {
    super(message);
    this.name = 'Rule4EvidenceAdapterValidationError';
  }
}

export function validateEvidenceAdapterInput(input: Rule4EvidenceAdapterInput): void {
  if (input.contractVersion !== RULE4_CONTRACT_VERSION_PHASE3_EVIDENCE) {
    throw new Rule4EvidenceAdapterValidationError(
      'contractVersion not supported for Phase 3 evidence',
    );
  }
  if (!input.rulesetVersion) {
    throw new Rule4EvidenceAdapterValidationError('rulesetVersion required');
  }
  if (!input.registryVersion) {
    throw new Rule4EvidenceAdapterValidationError('registryVersion required');
  }
  if (!Array.isArray(input.documents) || !Array.isArray(input.items)) {
    throw new Rule4EvidenceAdapterValidationError('documents and items must be arrays');
  }
  assertEvidenceAdapterInputFreeOfPhiText(input);
  validateQuarantineProbeShape(input.quarantineProbe);
}

export function evaluateEvidenceAdapter(
  input: Rule4EvidenceAdapterInput,
): Rule4EvidenceAdapterOutput {
  validateEvidenceAdapterInput(input);

  const quarantine = evaluateQuarantineProbe(input.quarantineProbe);
  const docById = new Map(input.documents.map((d) => [d.documentId, d]));
  const documentGateResults = input.documents.map((d) => evaluateDocumentGate(d));
  const docPass = new Map(documentGateResults.map((r) => [r.documentId, r.passed]));

  const itemGateResults = input.items.map((item) => {
    const doc = docById.get(item.documentId);
    const passed = docPass.get(item.documentId) === true;
    return evaluateItemGate(item, doc, passed);
  });
  const itemGatePass = new Map(itemGateResults.map((r) => [r.findingId, r.passed]));

  const ignoredAudit: Rule4IgnoredItemAuditEntry[] = [];
  const usableCandidates: Rule4EvidenceItemEnvelope[] = [];

  for (const item of input.items) {
    const port = resolveRule3BindingPort(input.rule3BindingPorts, item.formulaSlotId);
    const binding = validateFormulaTargetBinding(item, port);
    const itemGatePassed = itemGatePass.get(item.findingId) === true;
    const d04 = evaluateD04Usability(item, itemGatePassed, binding.passed);

    const reasonCodes = [
      ...new Set([
        ...(docPass.get(item.documentId) === false ? ['D08_DOCUMENT_GATE_FAILED'] : []),
        ...itemGateResults.find((r) => r.findingId === item.findingId)!.reasonCodes,
        ...binding.reasonCodes,
        ...d04.reasonCodes,
      ]),
    ];
    const limitationCodes = [
      ...new Set([
        ...itemGateResults.find((r) => r.findingId === item.findingId)!.limitationCodes,
        ...binding.limitationCodes,
        ...d04.limitationCodes,
      ]),
    ];

    let status: Rule4ItemUsabilityStatus = 'IGNORED_NOT_USABLE';
    if (d04.usable) {
      status = 'USABLE_DIRECT_CANDIDATE';
      usableCandidates.push(item);
    } else if (validateMandatoryItemFields(item).length > 0) {
      status = 'IGNORED_NOT_USABLE';
    } else if (reasonCodes.includes('INVALID_NOT_USABLE')) {
      status = 'INVALID_NOT_USABLE';
    }

    if (!d04.usable) {
      ignoredAudit.push({
        findingId: item.findingId,
        documentId: item.documentId,
        itemUsabilityStatus: status,
        reasonCodes,
        limitationCodes,
      });
    }
  }

  const dedupePlans = planDedupe(usableCandidates);
  const afterDedupe = usableCandidates.filter((i) => !isDedupeDuplicate(i.findingId, dedupePlans));

  const supersession = applySupersession(afterDedupe);
  const supById = new Map(supersession.map((s) => [s.findingId, s]));
  const activeUsable = afterDedupe.filter((item) => supById.get(item.findingId)?.active !== false);

  for (const decision of supersession) {
    if (decision.supersededByFindingId) {
      ignoredAudit.push({
        findingId: decision.findingId,
        documentId: input.items.find((i) => i.findingId === decision.findingId)?.documentId ?? '',
        itemUsabilityStatus: 'SUPERSEDED_HISTORICAL',
        reasonCodes: [...decision.reasonCodes],
        limitationCodes: [...decision.limitationCodes],
      });
    }
  }

  ignoredAudit.sort((a, b) => a.findingId.localeCompare(b.findingId));

  const dedupeSupersession: Rule4DedupeSupersessionMetadata[] = [];
  for (const item of input.items) {
    const plan = dedupePlans.find(
      (p) =>
        p.representativeFindingId === item.findingId ||
        p.duplicateFindingIds.includes(item.findingId),
    );
    const sup = supersession.find((s) => s.findingId === item.findingId);
    dedupeSupersession.push({
      findingId: item.findingId,
      parentSourceId: item.parentSourceId,
      dedupeGroupKey: plan?.dedupeGroupKey ?? null,
      supersededByFindingId: sup?.supersededByFindingId ?? null,
      corroborationRank: null,
    });
  }

  const slotIds = [...new Set(input.rule3BindingPorts.map((p) => p.formulaSlotId))];
  const formulaBoundPools: Rule4FormulaBoundEvidencePool[] = slotIds.map((slotId) => {
    const port = resolveRule3BindingPort(input.rule3BindingPorts, slotId);
    const slotActive = activeUsable.filter((i) => i.formulaSlotId === slotId);
    const slotIgnored = ignoredAudit.filter((e) => {
      const item = input.items.find((i) => i.findingId === e.findingId);
      return item?.formulaSlotId === slotId;
    });
    const corroboratingParentSourceIds = [
      ...new Set(slotActive.map((i) => i.parentSourceId)),
    ].sort();
    const corroboration = corroboratingParentSourceIds.length;
    const contradiction = resolveSlotContradiction(slotId, activeUsable);
    return {
      formulaSlotId: slotId,
      formulaTargetId: port?.formulaTargetId ?? null,
      usableFindingIds: slotActive.map((i) => i.findingId).sort(),
      ignoredFindingIds: slotIgnored.map((e) => e.findingId).sort(),
      corroborationDistinctParentCount: corroboration,
      corroboratingParentSourceIds,
      contradiction,
    };
  });

  const reasonCodes = [
    ...new Set([
      ...quarantine.reasonCodes,
      ...ignoredAudit.flatMap((e) => e.reasonCodes),
      ...supersession.flatMap((d) => d.reasonCodes),
      ...formulaBoundPools.flatMap((p) => p.contradiction.reasonCodes),
    ]),
  ];
  const limitationCodes = [
    ...new Set([
      'PHASE3_NO_POTENCY_CASCADE',
      ...ignoredAudit.flatMap((e) => e.limitationCodes),
      ...supersession.flatMap((d) => d.limitationCodes),
      ...formulaBoundPools.flatMap((p) => p.contradiction.limitationCodes),
    ]),
  ];

  const output: Rule4EvidenceAdapterOutput = {
    contractVersion: input.contractVersion,
    rulesetVersion: input.rulesetVersion,
    registryVersion: input.registryVersion,
    dataAssetVersion: input.dataAssetVersion,
    executionStatus: 'NOT_IMPLEMENTED',
    currentRuntimePotencyDelta: 'NONE',
    registryQ16SelectorStatus: 'NOT_EXECUTABLE_AS_Q16_SELECTOR',
    documentGateResults,
    itemGateResults,
    ignoredAudit,
    dedupeSupersession,
    formulaBoundPools,
    reasonCodes,
    limitationCodes,
    deterministicEvidencePoolFingerprint: '',
    quarantineReasonCodes: quarantine.reasonCodes,
  };

  output.deterministicEvidencePoolFingerprint = fingerprintFromAdapterOutput(output);

  validateRule4OutputCodes({
    reasonCodes: output.reasonCodes,
    limitationCodes: output.limitationCodes,
  });

  return output;
}
