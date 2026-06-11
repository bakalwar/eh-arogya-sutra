const express = require('express');
const { QueryTypes } = require('sequelize');
const { sequelize } = require('../db/sequelize');
const { asyncHandler } = require('../utils/asyncHandler');

const router = express.Router();

/**
 * Fuzzy symptom + medicine lookup using pg_trgm (`%` / similarity).
 * @query q — search text (min 2 chars)
 * @query limit — max rows per bucket (default 25, max 50)
 */
router.get(
  '/search',
  asyncHandler(async (req, res) => {
    const q = (req.query.q || '').toString().trim();
    if (q.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter "q" must be at least 2 characters for fuzzy search.'
      });
    }
    let limit = parseInt(req.query.limit, 10);
    if (Number.isNaN(limit) || limit < 1) limit = 25;
    limit = Math.min(50, limit);

    const like = `%${q}%`;

    const medicines = await sequelize.query(
      `
      SELECT id, name, system, medicine_group, dilution, indications,
             GREATEST(
               similarity(name, :q),
               similarity(COALESCE(indications, ''), :q)
             ) AS match_score
      FROM medicines
      WHERE name % :q
         OR COALESCE(indications, '') % :q
         OR name ILIKE :like
      ORDER BY match_score DESC NULLS LAST, name ASC
      LIMIT :limit
      `,
      {
        replacements: { q, like, limit },
        type: QueryTypes.SELECT
      }
    );

    const symptoms = await sequelize.query(
      `
      SELECT id, name, name_hi, aliases,
             GREATEST(
               similarity(name, :q),
               similarity(COALESCE(name_hi, ''), :q)
             ) AS match_score
      FROM symptoms
      WHERE name % :q
         OR COALESCE(name_hi, '') % :q
         OR name ILIKE :like
         OR COALESCE(name_hi, '') ILIKE :like
      ORDER BY match_score DESC NULLS LAST, name ASC
      LIMIT :limit
      `,
      {
        replacements: { q, like, limit },
        type: QueryTypes.SELECT
      }
    );

    res.json({
      success: true,
      query: q,
      data: {
        symptoms: symptoms.map((row) => ({
          id: String(row.id),
          name: row.name,
          nameHi: row.name_hi,
          aliases: row.aliases || [],
          matchScore: row.match_score != null ? Number(row.match_score) : null
        })),
        medicines: medicines.map((row) => ({
          id: String(row.id),
          name: row.name,
          system: row.system,
          medicineGroup: row.medicine_group,
          dilution: row.dilution,
          indications: row.indications,
          matchScore: row.match_score != null ? Number(row.match_score) : null
        }))
      }
    });
  })
);

module.exports = router;
