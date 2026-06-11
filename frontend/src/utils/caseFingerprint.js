/** Unique key per search case — stale summary invalidate karne ke liye */
export function caseFingerprint(data) {
  if (!data) return '';
  const ex = data.expert || {};
  const meds = [];
  for (const k of ['formula_a', 'formula_b', 'formula_c', 'formula_d']) {
    const card = ex.formulas?.[k];
    if (card?.medicines?.length) meds.push(...card.medicines);
  }
  if (!meds.length && ex.formula_medicines?.length) meds.push(...ex.formula_medicines);
  return [
    data.searchSessionId || '',
    data.patient?.name || '',
    data.patient?.age ?? '',
    data.patient?.chiefComplaint || data.analysis?.chief_complaint || '',
    ex.overall_polarity || '',
    ex.potency || '',
    ex.temperament || '',
    meds.sort().join('+'),
    'book-v2',
    'engine-v7'
  ].join('|');
}
