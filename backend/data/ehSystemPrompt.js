'use strict';

/**
 * REMOVED — static 11-section prompt deleted (nuclear v9).
 * All prompts: buildDynamicClinicalPrompt.js → dynamicEhRules.json at invocation.
 */
const { buildSystemPromptFromRules, EH_SYSTEM_PROMPT } = require('../services/buildDynamicClinicalPrompt');

module.exports = {
  EH_SYSTEM_PROMPT,
  buildSystemPromptFromRules
};
