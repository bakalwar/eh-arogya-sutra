'use strict';

/**
 * APP_ENV: local | staging | production
 * Hybrid staging: API on Railway, Ollama on clinic PC (ngrok/tailscale URL in OLLAMA_URL).
 */
function appEnv() {
  return (process.env.APP_ENV || process.env.NODE_ENV || 'local').toLowerCase();
}

function isStaging() {
  const e = appEnv();
  return e === 'staging' || process.env.EH_DEPLOY_ENV === 'staging';
}

function isProduction() {
  const e = appEnv();
  return e === 'production' && process.env.EH_DEPLOY_ENV !== 'staging';
}

function isHybridStagingOllama() {
  return (
    process.env.EH_STAGING_HYBRID_OLLAMA === '1' ||
    isStaging() ||
    process.env.OLLAMA_TUNNEL_URL
  );
}

/** Max wait for one Ollama generate call — then template fallback (not 504) */
function getOllamaMaxWaitMs() {
  const explicit =
    Number(process.env.EH_OLLAMA_MAX_WAIT_MS) ||
    Number(process.env.EH_OLLAMA_SUMMARY_WAIT_MS);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const clinical = Number(process.env.OLLAMA_EXPERT_CLINICAL_TIMEOUT_MS);
  if (Number.isFinite(clinical) && clinical > 0) return clinical;
  return 180000;
}

function shouldSkipOllamaForSummary() {
  return process.env.EH_SUMMARY_SKIP_OLLAMA === '1' || process.env.OLLAMA_ENABLED === '0';
}

function getSummaryWordTargets() {
  const denseDefault = process.env.EH_SUMMARY_DENSE_MODE !== '0';
  const dense = process.env.EH_SUMMARY_DENSE_MODE === '1' || denseDefault;
  const targetWords =
    Number(process.env.EH_SUMMARY_TARGET_WORDS) ||
    Number(process.env.OLLAMA_EXPERT_SUMMARY_TARGET_WORDS) ||
    Number(process.env.SUMMARY_MIN_WORDS) ||
    (dense ? 550 : 800);
  const minWords =
    Number(process.env.EH_SUMMARY_MIN_WORDS) ||
    Number(process.env.OLLAMA_EXPERT_MIN_WORDS) ||
    Number(process.env.SUMMARY_MIN_WORDS) ||
    (dense ? 500 : 800);
  return {
    dense,
    targetWords,
    minWordsOllama: Number(process.env.EH_SUMMARY_MIN_WORDS_OLLAMA) || minWords,
    minWordsValidate: minWords,
    minCharsValidate: dense ? 3500 : 5000,
    numPredict: Number(process.env.OLLAMA_EXPERT_NUM_PREDICT) || 2000
  };
}

module.exports = {
  appEnv,
  isStaging,
  isProduction,
  isHybridStagingOllama,
  getOllamaMaxWaitMs,
  shouldSkipOllamaForSummary,
  getSummaryWordTargets
};
