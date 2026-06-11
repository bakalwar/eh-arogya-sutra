const { Op, Sequelize } = require('sequelize');
const { getPostgresModels } = require('../db/sequelize');
const { getCache, setCache } = require('./redisService');

/**
 * Smart Search Engine using PostgreSQL Full-Text Search (FTS)
 */
async function searchSymptoms(query) {
  const { SymptomPg } = getPostgresModels();
  if (!query) return [];

  // 0. Check Redis Cache
  const cacheKey = `search:symptoms:${query.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // 1. PostgreSQL Full-Text Search (FTS)
  const ftsResults = await SymptomPg.findAll({
    where: Sequelize.literal(`search_document @@ plainto_tsquery('english', '${query}')`),
    order: [
      [Sequelize.literal(`ts_rank(search_document, plainto_tsquery('english', '${query}'))`), 'DESC']
    ],
    limit: 20
  });

  // 2. Fallback to Trigram / ILIKE if FTS yields few results
  if (ftsResults.length < 5) {
    const trigramResults = await SymptomPg.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { name_hi: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20
    });
    
    // Merge and unique
    const seenIds = new Set(ftsResults.map(r => r.id));
    trigramResults.forEach(r => {
      if (!seenIds.has(r.id)) ftsResults.push(r);
    });
  }

  const results = ftsResults.map(r => r.get({ plain: true }));
  
  // Save to Redis Cache (TTL: 1 hour)
  await setCache(cacheKey, results, 3600);

  return results;
}

async function searchMedicines(query) {
  const { MedicinePg } = getPostgresModels();
  if (!query) return [];

  // 0. Check Redis Cache
  const cacheKey = `search:medicines:${query.toLowerCase()}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  // 1. PostgreSQL Full-Text Search (FTS)
  const ftsResults = await MedicinePg.findAll({
    where: Sequelize.literal(`search_document @@ plainto_tsquery('english', '${query}')`),
    order: [
      [Sequelize.literal(`ts_rank(search_document, plainto_tsquery('english', '${query}'))`), 'DESC']
    ],
    limit: 20
  });

  // 2. Fallback to Trigram / ILIKE
  if (ftsResults.length < 5) {
    const trigramResults = await MedicinePg.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${query}%` } },
          { indications: { [Op.iLike]: `%${query}%` } },
          { medicine_group: { [Op.iLike]: `%${query}%` } }
        ]
      },
      limit: 20
    });
    
    const seenIds = new Set(ftsResults.map(r => r.id));
    trigramResults.forEach(r => {
      if (!seenIds.has(r.id)) ftsResults.push(r);
    });
  }

  const results = ftsResults.map(r => r.get({ plain: true }));
  
  // Save to Redis Cache (TTL: 1 hour)
  await setCache(cacheKey, results, 3600);

  return results;
}

module.exports = {
  searchSymptoms,
  searchMedicines
};
