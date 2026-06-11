const { Op } = require('sequelize');
const { isDbReady, getPostgresModels } = require('../utils/dataSource');

function severityScore(severity) {
  const s = String(severity || 'moderate').toLowerCase();
  if (s === 'severe' || Number(severity) >= 8) return 3;
  if (s === 'mild' || Number(severity) <= 4) return 1;
  return 2;
}

function daysSince(date) {
  if (!date) return null;
  const d = new Date(date);
  const now = new Date();
  return Math.floor((now - d) / (24 * 60 * 60 * 1000));
}

async function checkPatientHistory(name, age) {
  if (!isDbReady() || !name) {
    return { isRepeat: false, visitCount: 0 };
  }

  const { PrescriptionPg } = getPostgresModels();
  const ageNum = Number(age) || 0;

  const previous = await PrescriptionPg.findAll({
    where: {
      patient_name: { [Op.iLike]: `%${String(name).trim()}%` },
      ...(ageNum
        ? { patient_age: { [Op.between]: [Math.max(1, ageNum - 2), ageNum + 2] } }
        : {})
    },
    order: [['created_at', 'DESC']],
    limit: 10
  });

  if (!previous.length) {
    return { isRepeat: false, visitCount: 0 };
  }

  const lastVisit = previous[0].get({ plain: true });
  const oldSymptoms = lastVisit.symptoms_json || [];

  return {
    isRepeat: true,
    visitCount: previous.length + 1,
    lastVisitDate: lastVisit.created_at,
    daysSinceLastVisit: daysSince(lastVisit.created_at),
    previousSymptoms: oldSymptoms,
    previousMedicines: lastVisit.medicines_json,
    previousPolarity: lastVisit.polarity,
    allVisits: previous.map((p) => {
      const u = p.get({ plain: true });
      return {
        date: u.created_at,
        polarity: u.polarity,
        symptomCount: (u.symptoms_json || []).length,
        medicines: u.medicines_json,
        improvementPercent: u.improvement_percent
      };
    })
  };
}

function calculateImprovement(oldSymptoms, newSymptoms) {
  const old = Array.isArray(oldSymptoms) ? oldSymptoms : [];
  const neu = Array.isArray(newSymptoms) ? newSymptoms : [];
  const oldCount = Math.max(1, old.length);

  const resolved = old.filter(
    (o) => !neu.some((n) => n.name?.toLowerCase() === o.name?.toLowerCase())
  );

  const newOnes = neu.filter(
    (n) => !old.some((o) => o.name?.toLowerCase() === n.name?.toLowerCase())
  );

  const improved = old.filter((o) => {
    const current = neu.find((n) => n.name?.toLowerCase() === o.name?.toLowerCase());
    if (!current) return false;
    return severityScore(current.severity) < severityScore(o.severity);
  });

  const improvementPercent = Math.min(
    100,
    Math.round(((resolved.length + improved.length) / oldCount) * 100)
  );

  return {
    improvement_percent: improvementPercent,
    resolved_symptoms: resolved,
    new_symptoms: newOnes,
    improved_symptoms: improved,
    overall_status:
      improvementPercent > 70
        ? 'Excellent Recovery'
        : improvementPercent > 40
          ? 'Good Progress'
          : improvementPercent > 20
            ? 'Slow Progress'
            : 'Needs Review'
  };
}

module.exports = { checkPatientHistory, calculateImprovement, severityScore, daysSince };
