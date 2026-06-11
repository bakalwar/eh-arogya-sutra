'use strict';

/**
 * Full Ollama rule extraction is gated until Dr. Sahib finishes textbook ingest.
 * Seed rules in dynamicEhRules.default.json still apply when extraction is locked.
 */
function isRuleExtractionAllowed() {
  const v = String(process.env.EH_RULE_EXTRACT_ALLOW || '0').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

function assertRuleExtractionAllowed() {
  if (isRuleExtractionAllowed()) return;
  const err = new Error(
    'Ollama rule extraction is locked until the full textbook is ingested. ' +
      'Ingest all chapters (batch or ingest-page), rebuild the index, then set EH_RULE_EXTRACT_ALLOW=1 in .env.'
  );
  err.code = 'RULE_EXTRACT_LOCKED';
  throw err;
}

function getRuleExtractGateStatus() {
  const allowed = isRuleExtractionAllowed();
  return {
    extractionAllowed: allowed,
    phase: allowed ? 'ready_for_extract' : 'awaiting_full_book',
    envFlag: 'EH_RULE_EXTRACT_ALLOW',
    message:
      allowed
        ? 'Full book ingest complete — Ollama extraction enabled.'
        : 'Waiting for remaining textbook chapters. Use seed rules only; do not run generate-rules yet.',
    message_hi: allowed
      ? 'पूरी पुस्तक ingest हो चुकी — अब Ollama से नियम निकाल सकते हैं।'
      : 'बाकी अध्याय आने तक Ollama extraction बंद है। अभी सीड नियम (मैटी सिद्धान्त) चालू हैं।'
  };
}

module.exports = {
  isRuleExtractionAllowed,
  assertRuleExtractionAllowed,
  getRuleExtractGateStatus
};
